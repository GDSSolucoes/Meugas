import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Search, X, LogOut, Printer, ArrowDown, Trash2, ArrowRight, Check
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProductPickupManagement() {
  const { toast } = useToast();
  
  // Data states
  const [pickups, setPickups] = useState([]);
  const [displayedPickups, setDisplayedPickups] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [people, setPeople] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  
  // Filtros
  const [filtrarCliente, setFiltrarCliente] = useState(true);
  const [filtrarPontoVenda, setFiltrarPontoVenda] = useState(false);
  const [clienteInput, setClienteInput] = useState('');
  
  const [produtoInput, setProdutoInput] = useState('');
  
  const [tipoProduto, setTipoProduto] = useState('a_retirar'); // 'a_retirar', 'retirados_entre'
  const [dataInicial, setDataInicial] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFinal, setDataFinal] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [codigoVendaInput, setCodigoVendaInput] = useState('');
  const [codigoVendaLabel, setCodigoVendaLabel] = useState('TODAS');
  
  // Modais
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [lastBaixaData, setLastBaixaData] = useState(null);
  const [showClienteSearch, setShowClienteSearch] = useState(false);
  const [showProdutoSearch, setShowProdutoSearch] = useState(false);
  const [showVendaSearch, setShowVendaSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [qtdeBaixar, setQtdeBaixar] = useState('');
  const [sectorBaixa, setSectorBaixa] = useState('');
  const [dataBaixa, setDataBaixa] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notaFiscal, setNotaFiscal] = useState('');
  const [pedido, setPedido] = useState('');
  const [activeCaixa, setActiveCaixa] = useState(null); // 'cliente', 'produto', 'venda'
  
  // Totais
  const [totalARetirar, setTotalARetirar] = useState(0);
  const [totalRetirados, setTotalRetirados] = useState(0);
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const [pickupsData, peopleData, productsData, salesData, sectorsData] = await Promise.all([
        base44.entities.ProductPickup.filter({ company_id: user.company_id }, '-sale_date'),
        base44.entities.Person.filter({ company_id: user.company_id }),
        base44.entities.Product.filter({ company_id: user.company_id, active: true }),
        base44.entities.Sale.filter({ company_id: user.company_id }),
        base44.entities.Sector.filter({ company_id: user.company_id, active: true })
      ]);
      
      setPickups(pickupsData);
      setPeople(peopleData);
      setProducts(productsData);
      setSales(salesData);
      setSectors(sectorsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os dados.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyFiltersAndShow = () => {
    let filtered = [...pickups];
    
    // Filtro por cliente específico ou por tipo
    if (clienteInput) {
      filtered = filtered.filter(p => p.person_id === clienteInput);
    } else {
      // Filtrar por tipo se não há cliente específico
      filtered = filtered.filter(p => {
        const person = people.find(per => per.id === p.person_id);
        if (!person) return false;
        
        const isCliente = person.type === 'cliente';
        const isPontoVenda = person.type === 'ponto_venda';
        
        if (filtrarCliente && filtrarPontoVenda) return isCliente || isPontoVenda;
        if (filtrarCliente) return isCliente;
        if (filtrarPontoVenda) return isPontoVenda;
        
        return false;
      });
    }
    
    // Filtro por produto
    if (produtoInput) {
      filtered = filtered.filter(p => p.product_id === produtoInput);
    }
    
    // Filtro por status do produto
    if (tipoProduto === 'a_retirar') {
      filtered = filtered.filter(p => p.status === 'pendente' || (p.status === 'retirado_parcial' && (p.pickup_quantity || 0) > (p.collected_quantity || 0)));
    } else {
      // Retirados entre datas - considera TODAS as retiradas (parciais e totais) com data
      filtered = filtered.filter(p => {
        if (!p.collected_date) return false;
        if ((p.collected_quantity || 0) === 0) return false;

        const collectedDate = parseISO(p.collected_date);
        const start = startOfDay(parseISO(dataInicial));
        const end = endOfDay(parseISO(dataFinal));

        return collectedDate >= start && collectedDate <= end;
      });
    }
    
    // Filtro por código da venda
    if (codigoVendaInput) {
      filtered = filtered.filter(p => p.sale_id === codigoVendaInput);
    }
    
    // Calcular totais
    const aRetirar = filtered
      .filter(p => p.status !== 'retirado_total')
      .reduce((sum, p) => sum + ((p.pickup_quantity || 0) - (p.collected_quantity || 0)), 0);
    
    const retirados = filtered
      .filter(p => p.status === 'retirado_total')
      .reduce((sum, p) => sum + (p.collected_quantity || 0), 0);
    
    setTotalARetirar(aRetirar);
    setTotalRetirados(retirados);
    
    setDisplayedPickups(filtered);
    setShowResults(true);
  };

  const handlePesquisar = () => {
    if (!activeCaixa) {
      toast({ title: "Atenção", description: "Clique em uma das caixas de filtro primeiro.", variant: "default" });
      return;
    }
    
    if (activeCaixa === 'cliente') {
      setShowClienteSearch(true);
    } else if (activeCaixa === 'produto') {
      setShowProdutoSearch(true);
    } else if (activeCaixa === 'venda') {
      setShowVendaSearch(true);
    }
  };

  const handleCancelar = () => {
    setFiltrarCliente(true);
    setFiltrarPontoVenda(false);
    setClienteInput('');
    setProdutoInput('');
    setTipoProduto('a_retirar');
    setDataInicial(format(new Date(), 'yyyy-MM-dd'));
    setDataFinal(format(new Date(), 'yyyy-MM-dd'));
    setCodigoVendaInput('');
    setDisplayedPickups([]);
    setShowResults(false);
    setSelectedPickup(null);
    setTotalARetirar(0);
    setTotalRetirados(0);
  };

  const handleBaixar = (pickup = null) => {
    const pickupToUse = pickup || selectedPickup;
    
    if (!pickupToUse) {
      toast({ title: "Atenção", description: "Selecione um registro para dar baixa.", variant: "destructive" });
      return;
    }
    if (pickupToUse.status === 'retirado_total') {
      toast({ title: "Atenção", description: "Este produto já foi totalmente retirado.", variant: "destructive" });
      return;
    }
    
    if (pickup) {
      setSelectedPickup(pickup);
    }
    
    // Pré-preencher campos
    const pendente = (pickupToUse.pickup_quantity || 0) - (pickupToUse.collected_quantity || 0);
    setQtdeBaixar(pendente.toString());
    setDataBaixa(format(new Date(), 'yyyy-MM-dd'));
    setSectorBaixa(sectors.length > 0 ? sectors[0].id : '');
    setNotaFiscal('');
    setPedido('');
    setShowBaixaModal(true);
  };

  const handleConfirmarBaixa = async () => {
    if (!selectedPickup) return;
    
    const qtde = parseInt(qtdeBaixar) || 0;
    const pendente = (selectedPickup.pickup_quantity || 0) - (selectedPickup.collected_quantity || 0);
    
    if (qtde <= 0) {
      toast({ title: "Erro", description: "Informe uma quantidade válida.", variant: "destructive" });
      return;
    }
    
    if (qtde > pendente) {
      toast({ title: "Erro", description: `Quantidade inválida. Máximo permitido: ${pendente}`, variant: "destructive" });
      return;
    }
    
    if (!sectorBaixa) {
      toast({ title: "Erro", description: "Selecione o setor para baixa.", variant: "destructive" });
      return;
    }
    
    if (!dataBaixa) {
      toast({ title: "Erro", description: "Informe a data de retirada.", variant: "destructive" });
      return;
    }
    
    try {
      const novaQtdeColetada = (selectedPickup.collected_quantity || 0) + qtde;
      const totalPendente = selectedPickup.pickup_quantity || 0;
      const novoStatus = novaQtdeColetada >= totalPendente ? 'retirado_total' : 'retirado_parcial';
      
      const sector = sectors.find(s => s.id === sectorBaixa);
      
      await base44.entities.ProductPickup.update(selectedPickup.id, {
        status: novoStatus,
        collected_quantity: novaQtdeColetada,
        collected_date: dataBaixa,
        sector_id: sectorBaixa,
        sector_name: sector?.name || '',
        nota_fiscal: notaFiscal,
        pedido: pedido
      });
      
      // Salvar dados para impressão
      const person = people.find(p => p.id === selectedPickup.person_id);
      setLastBaixaData({
        cliente: selectedPickup.person_name,
        clienteDoc: person?.document || '',
        produto: selectedPickup.product_name,
        quantidade: qtde,
        data: dataBaixa,
        setor: sector?.name || '',
        notaFiscal: notaFiscal,
        pedido: pedido
      });
      
      toast({ title: "Sucesso", description: `Baixa de ${qtde} produto(s) realizada com sucesso.` });
      setShowBaixaModal(false);
      setShowPrintConfirm(true);
      
      await loadData();
      if (showResults) {
        setTimeout(() => applyFiltersAndShow(), 100);
      }
    } catch (error) {
      console.error("Erro ao dar baixa:", error);
      toast({ title: "Erro", description: "Não foi possível realizar a baixa.", variant: "destructive" });
    }
  };

  const handleExcluir = async () => {
    if (!selectedPickup) {
      toast({ title: "Atenção", description: "Selecione um registro para excluir.", variant: "destructive" });
      return;
    }
    
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) {
      return;
    }
    
    try {
      await base44.entities.ProductPickup.delete(selectedPickup.id);
      toast({ title: "Sucesso", description: "Registro excluído com sucesso." });
      setSelectedPickup(null);
      await loadData();
      if (showResults) {
        setTimeout(() => applyFiltersAndShow(), 100);
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({ title: "Erro", description: "Não foi possível excluir o registro.", variant: "destructive" });
    }
  };

  const handleImprimirComprovante = () => {
    if (!lastBaixaData) return;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante de Retirada</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 20px; margin-bottom: 5px; }
          .header p { font-size: 11px; color: #666; }
          .section { margin: 20px 0; }
          .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .field { margin: 8px 0; }
          .field label { font-weight: bold; display: inline-block; width: 150px; }
          .field span { color: #555; }
          .signature { margin-top: 80px; }
          .signature-line { border-top: 1px solid #333; width: 400px; margin: 0 auto; padding-top: 5px; text-align: center; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; }
          @media print { body { padding: 20px; } button { display: none; } }
          .btn-print { display: block; margin: 30px auto; padding: 10px 30px; font-size: 14px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${currentUser?.company_name || 'EMPRESA'}</h1>
          <p>Comprovante de Retirada de Produto</p>
          <p>Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
        </div>

        <div class="section">
          <div class="section-title">Dados do Cliente</div>
          <div class="field">
            <label>Cliente:</label>
            <span>${lastBaixaData.cliente}</span>
          </div>
          ${lastBaixaData.clienteDoc ? `
          <div class="field">
            <label>CPF/CNPJ:</label>
            <span>${lastBaixaData.clienteDoc}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Dados da Retirada</div>
          <div class="field">
            <label>Produto:</label>
            <span>${lastBaixaData.produto}</span>
          </div>
          <div class="field">
            <label>Quantidade:</label>
            <span>${lastBaixaData.quantidade}</span>
          </div>
          <div class="field">
            <label>Data da Retirada:</label>
            <span>${format(parseISO(lastBaixaData.data), 'dd/MM/yyyy')}</span>
          </div>
          <div class="field">
            <label>Setor:</label>
            <span>${lastBaixaData.setor}</span>
          </div>
          ${lastBaixaData.notaFiscal ? `
          <div class="field">
            <label>Nota Fiscal:</label>
            <span>${lastBaixaData.notaFiscal}</span>
          </div>
          ` : ''}
          ${lastBaixaData.pedido ? `
          <div class="field">
            <label>Pedido:</label>
            <span>${lastBaixaData.pedido}</span>
          </div>
          ` : ''}
        </div>

        <div class="signature">
          <div class="signature-line">
            Assinatura do Responsável pela Retirada
          </div>
        </div>

        <div class="footer">
          <p>Este documento comprova a retirada do(s) produto(s) descrito(s) acima.</p>
        </div>

        <button class="btn-print" onclick="window.print()">Imprimir Comprovante</button>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setShowPrintConfirm(false);
    setLastBaixaData(null);
    setSelectedPickup(null);
  };

  const handleImprimir = () => {
    const dataToPrint = showResults ? displayedPickups : [];
    
    if (dataToPrint.length === 0) {
      toast({ title: "Atenção", description: "Nenhum dado para imprimir. Execute a pesquisa primeiro.", variant: "destructive" });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Produtos Vendidos a Retirar</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
          h1 { text-align: center; margin-bottom: 5px; font-size: 16px; }
          .subtitle { text-align: center; margin-bottom: 15px; color: #666; font-size: 10px; }
          .filters { margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
          th { background-color: #e0e0e0; font-weight: bold; font-size: 10px; }
          td { font-size: 10px; }
          .text-center { text-align: center; }
          .footer { margin-top: 15px; text-align: center; font-size: 9px; color: #666; }
          @media print { body { padding: 10px; } button { display: none; } }
          .btn-print { display: block; margin: 15px auto; padding: 8px 25px; font-size: 12px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Produtos Vendidos a Retirar</h1>
        <p class="subtitle">Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        
        <div class="filters">
          <strong>Filtros:</strong> 
          Cliente: ${filtrarCliente ? 'Sim' : 'Não'} | 
          Pto. Venda: ${filtrarPontoVenda ? 'Sim' : 'Não'} |
          Status: ${tipoProduto === 'a_retirar' ? 'A Retirar' : `Retirados de ${format(parseISO(dataInicial), 'dd/MM/yyyy')} a ${format(parseISO(dataFinal), 'dd/MM/yyyy')}`}
        </div>

        <table>
          <thead>
            <tr>
              <th>Dt Venda</th>
              <th>Venda</th>
              <th>Cliente / Pto. Venda</th>
              <th>Produto</th>
              <th>Vend.</th>
              <th>A Ret.</th>
            </tr>
          </thead>
          <tbody>
            ${dataToPrint.map(pickup => `
              <tr>
                <td>${pickup.sale_date ? format(parseISO(pickup.sale_date), 'dd/MM/yyyy') : '-'}</td>
                <td>${pickup.sale_id?.slice(-6) || '-'}</td>
                <td>${pickup.person_name || '-'}</td>
                <td>${pickup.product_name || '-'}</td>
                <td>${pickup.pickup_quantity || 0}</td>
                <td>${(pickup.pickup_quantity || 0) - (pickup.collected_quantity || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p class="footer">Total a Retirar: ${totalARetirar} | Total Retirados: ${totalRetirados} | Total de registros: ${dataToPrint.length}</p>
        
        <button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const filteredPeople = people.filter(p => {
    const isCliente = p.type === 'cliente';
    const isPontoVenda = p.type === 'ponto_venda';
    
    if (filtrarCliente && filtrarPontoVenda) return isCliente || isPontoVenda;
    if (filtrarCliente) return isCliente;
    if (filtrarPontoVenda) return isPontoVenda;
    
    return false;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-300 p-4">
        <h1 className="text-xl font-bold text-slate-800">Produtos vendidos a retirar</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-full mx-auto space-y-4">
          
          {/* SEÇÃO DE FILTROS */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* LADO ESQUERDO - Cliente/PDV */}
            <Card className="bg-white border-slate-300">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="filtro_cliente" 
                      checked={filtrarCliente}
                      onCheckedChange={setFiltrarCliente}
                    />
                    <Label htmlFor="filtro_cliente" className="text-sm font-normal">Cliente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="filtro_pdv" 
                      checked={filtrarPontoVenda}
                      onCheckedChange={setFiltrarPontoVenda}
                    />
                    <Label htmlFor="filtro_pdv" className="text-sm font-normal">Pto. Venda</Label>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3">
                  <Input
                    value={clienteInput ? people.find(p => p.id === clienteInput)?.name || '' : ''}
                    onChange={() => {}}
                    placeholder={!clienteInput ? "Todos" : ""}
                    className={`h-8 text-sm flex-1 cursor-pointer ${!clienteInput ? 'placeholder:text-red-500' : ''} ${activeCaixa === 'cliente' ? 'ring-2 ring-blue-500' : ''}`}
                    readOnly
                    onClick={() => setActiveCaixa('cliente')}
                  />
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Produtos</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      value={produtoInput ? products.find(p => p.id === produtoInput)?.name || '' : ''}
                      onChange={() => {}}
                      placeholder={!produtoInput ? "Todos" : ""}
                      className={`h-8 text-sm flex-1 cursor-pointer ${!produtoInput ? 'placeholder:text-red-500' : ''} ${activeCaixa === 'produto' ? 'ring-2 ring-blue-500' : ''}`}
                      readOnly
                      onClick={() => setActiveCaixa('produto')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LADO DIREITO - Produtos e Código da Venda */}
            <Card className="bg-white border-slate-300">
              <CardContent className="p-4 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Produtos</h4>
                  <RadioGroup value={tipoProduto} onValueChange={setTipoProduto}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="a_retirar" id="prod_retirar" />
                      <Label htmlFor="prod_retirar" className="text-sm font-normal">A retirar</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="retirados_entre" id="prod_retirados" />
                      <Label htmlFor="prod_retirados" className="text-sm font-normal">Retirados entre</Label>
                    </div>
                  </RadioGroup>
                  
                  <div className="flex items-center gap-2 ml-6">
                    <Input
                      type="date"
                      value={dataInicial}
                      onChange={(e) => setDataInicial(e.target.value)}
                      disabled={tipoProduto !== 'retirados_entre'}
                      className="h-8 text-sm w-36"
                    />
                    <span className="text-sm text-slate-600">e</span>
                    <Input
                      type="date"
                      value={dataFinal}
                      onChange={(e) => setDataFinal(e.target.value)}
                      disabled={tipoProduto !== 'retirados_entre'}
                      className="h-8 text-sm w-36"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Código da Venda</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      value={codigoVendaInput ? sales.find(s => s.id === codigoVendaInput)?.sale_number || '' : ''}
                      onChange={() => {}}
                      placeholder={!codigoVendaInput ? "Todas" : ""}
                      className={`h-8 text-sm flex-1 cursor-pointer ${!codigoVendaInput ? 'placeholder:text-red-500' : ''} ${activeCaixa === 'venda' ? 'ring-2 ring-blue-500' : ''}`}
                      readOnly
                      onClick={() => setActiveCaixa('venda')}
                    />
                  </div>
                  
                  <Button 
                    className="h-10 w-full text-white mt-3"
                    style={{ backgroundColor: '#e78b3a' }}
                    onClick={applyFiltersAndShow}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* GRID DE RESULTADOS */}
          <Card className="bg-white border-slate-300">
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-auto">
                {!showResults ? (
                  <div className="flex items-center justify-center h-48 text-slate-500 text-sm p-8">
                    <div className="text-center">
                      <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>Configure os filtros e clique no botão <strong>→</strong> para exibir os resultados.</p>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-100 sticky top-0">
                      <TableRow>
                        <TableHead className="text-xs w-24">Dt Venda</TableHead>
                        <TableHead className="text-xs w-20">Venda</TableHead>
                        <TableHead className="text-xs">Cliente / Pto. Venda</TableHead>
                        <TableHead className="text-xs w-40">Produto</TableHead>
                        <TableHead className="text-xs w-20 text-center">Vend.</TableHead>
                        {tipoProduto === 'a_retirar' ? (
                          <TableHead className="text-xs w-20 text-center">A Ret.</TableHead>
                        ) : (
                          <>
                            <TableHead className="text-xs w-20 text-center">Ret.</TableHead>
                            <TableHead className="text-xs w-24">Dat Ret.</TableHead>
                            <TableHead className="text-xs w-20 text-center">Saldo</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                        </TableRow>
                      ) : displayedPickups.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                            Nenhum produto encontrado com os filtros selecionados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayedPickups.map(pickup => (
                          <TableRow 
                            key={pickup.id}
                            className={`cursor-pointer hover:bg-slate-100 ${selectedPickup?.id === pickup.id ? 'bg-blue-100' : ''}`}
                            onClick={() => setSelectedPickup(pickup)}
                            onDoubleClick={() => handleBaixar(pickup)}
                          >
                            <TableCell className="text-xs">
                              {pickup.sale_date ? format(parseISO(pickup.sale_date), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                            <TableCell className="text-xs font-mono">{pickup.sale_id?.slice(-6) || '-'}</TableCell>
                            <TableCell className="text-xs">{pickup.person_name || '-'}</TableCell>
                            <TableCell className="text-xs">{pickup.product_name || '-'}</TableCell>
                            <TableCell className="text-xs text-center">{pickup.pickup_quantity || 0}</TableCell>
                            {tipoProduto === 'a_retirar' ? (
                              <TableCell className="text-xs text-center">
                                {(pickup.pickup_quantity || 0) - (pickup.collected_quantity || 0)}
                              </TableCell>
                            ) : (
                              <>
                                <TableCell className="text-xs text-center">{pickup.collected_quantity || 0}</TableCell>
                                <TableCell className="text-xs">
                                  {pickup.collected_date ? format(parseISO(pickup.collected_date), 'dd/MM/yyyy') : '-'}
                                </TableCell>
                                <TableCell className="text-xs text-center">
                                  {(pickup.pickup_quantity || 0) - (pickup.collected_quantity || 0)}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          {/* TOTAIS */}
          {showResults && displayedPickups.length > 0 && (
            <div className="flex justify-end">
              <div className="bg-white border border-slate-300 rounded p-4 min-w-[150px]">
                <p className="text-xs text-slate-600 mb-1">Totais...</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-700">a Retirar</p>
                    <p className="text-2xl font-bold text-slate-800">{totalARetirar}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-700">Retirados</p>
                    <p className="text-2xl font-bold text-slate-800">{totalRetirados}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BARRA DE AÇÕES */}
      <div className="bg-slate-200 border-t border-slate-300 p-2">
        <div className="flex flex-wrap gap-1 items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs gap-1"
            onClick={handleBaixar}
            disabled={!selectedPickup}
          >
            <ArrowDown className="w-3 h-3" /> Baixar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs gap-1 text-red-600 hover:bg-red-50"
            onClick={handleExcluir}
            disabled={!selectedPickup}
          >
            <Trash2 className="w-3 h-3" /> Excluir
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs gap-1"
            onClick={handlePesquisar}
          >
            <Search className="w-3 h-3" /> Pesquisar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs gap-1"
            onClick={handleCancelar}
          >
            <X className="w-3 h-3" /> Cancelar
          </Button>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
              <LogOut className="w-3 h-3" /> Sair
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs gap-1"
            onClick={handleImprimir}
            disabled={!showResults || displayedPickups.length === 0}
          >
            <Printer className="w-3 h-3" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Modal Baixa */}
      <Dialog open={showBaixaModal} onOpenChange={setShowBaixaModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Dar baixa</DialogTitle>
          </DialogHeader>
          {selectedPickup && (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-sm font-medium">Baixar do Setor:</Label>
                <Select value={sectorBaixa} onValueChange={setSectorBaixa}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="Selecione o setor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map(sector => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Qtde. a Baixar:</Label>
                  <Input 
                    type="number"
                    min="1"
                    max={(selectedPickup.pickup_quantity || 0) - (selectedPickup.collected_quantity || 0)}
                    value={qtdeBaixar}
                    onChange={(e) => setQtdeBaixar(e.target.value)}
                    className="h-9 mt-1"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Retirado em:</Label>
                  <Input 
                    type="date"
                    value={dataBaixa}
                    onChange={(e) => setDataBaixa(e.target.value)}
                    className="h-9 mt-1"
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Nota Fiscal:</Label>
                <Input 
                  type="text"
                  value={notaFiscal}
                  onChange={(e) => setNotaFiscal(e.target.value)}
                  className="h-9 mt-1"
                  placeholder="Número da nota fiscal (opcional)"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Pedido:</Label>
                <Input 
                  type="text"
                  value={pedido}
                  onChange={(e) => setPedido(e.target.value)}
                  className="h-9 mt-1"
                  placeholder="Número do pedido (opcional)"
                />
              </div>
            </div>
          )}
          <DialogFooter className="bg-slate-50 -mx-6 -mb-6 px-6 py-3 mt-4 rounded-b-lg">
            <div className="flex gap-2 ml-auto">
              <Button 
                onClick={handleConfirmarBaixa} 
                className="h-8 w-8 p-0 bg-[#6ac252] hover:bg-[#5cb143]"
                title="Confirmar"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowBaixaModal(false)}
                className="h-8 w-8 p-0 bg-[#e88d44] hover:bg-[#d97d34] border-[#e88d44] text-white"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Pesquisa Cliente/PDV */}
      <Dialog open={showClienteSearch} onOpenChange={setShowClienteSearch}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pesquisar Cliente / Pto. Venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Digite o nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
              autoFocus
            />
            <div className="max-h-80 overflow-auto border rounded">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="text-xs">Código</TableHead>
                    <TableHead className="text-xs">Nome</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Telefone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeople
                    .filter(p => {
                      if (!searchTerm) return true;
                      const term = searchTerm.toLowerCase();
                      return p.name?.toLowerCase().includes(term) || 
                             p.document?.toLowerCase().includes(term);
                    })
                    .map(p => (
                      <TableRow 
                        key={p.id} 
                        className="cursor-pointer hover:bg-blue-50"
                        onDoubleClick={() => {
                          setClienteInput(p.id);
                          setShowClienteSearch(false);
                          setSearchTerm('');
                        }}
                      >
                        <TableCell className="text-xs font-mono">{p.person_number || p.id?.slice(-6)}</TableCell>
                        <TableCell className="text-xs">{p.name}</TableCell>
                        <TableCell className="text-xs">{p.type === 'cliente' ? 'Cliente' : 'Pto. Venda'}</TableCell>
                        <TableCell className="text-xs">{p.phone?.[0] || '-'}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-slate-500">Dê duplo clique para selecionar</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClienteSearch(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmação de Impressão */}
      <Dialog open={showPrintConfirm} onOpenChange={setShowPrintConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Imprimir Comprovante</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-sm text-slate-600 mb-4">
              Deseja imprimir o comprovante de retirada?
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPrintConfirm(false);
                setLastBaixaData(null);
                setSelectedPickup(null);
              }}
            >
              Não
            </Button>
            <Button 
              onClick={handleImprimirComprovante}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Sim, Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Pesquisa Produto */}
      <Dialog open={showProdutoSearch} onOpenChange={setShowProdutoSearch}>
        <DialogContent className="max-w-xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pesquisar Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Digite o nome do produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
              autoFocus
            />
            <div className="max-h-80 overflow-auto border rounded">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="text-xs">Código</TableHead>
                    <TableHead className="text-xs">Nome</TableHead>
                    <TableHead className="text-xs">Categoria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products
                    .filter(prod => {
                      if (!searchTerm) return true;
                      const term = searchTerm.toLowerCase();
                      return prod.name?.toLowerCase().includes(term) || 
                             prod.code?.toLowerCase().includes(term);
                    })
                    .map(prod => (
                      <TableRow 
                        key={prod.id} 
                        className="cursor-pointer hover:bg-blue-50"
                        onDoubleClick={() => {
                          setProdutoInput(prod.id);
                          setShowProdutoSearch(false);
                          setSearchTerm('');
                        }}
                      >
                        <TableCell className="text-xs font-mono">{prod.code || prod.id?.slice(-6)}</TableCell>
                        <TableCell className="text-xs">{prod.name}</TableCell>
                        <TableCell className="text-xs">{prod.category || '-'}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-slate-500">Dê duplo clique para selecionar</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProdutoSearch(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Pesquisa Venda */}
      <Dialog open={showVendaSearch} onOpenChange={setShowVendaSearch}>
        <DialogContent className="max-w-xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pesquisar Código de Venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Digite o código da venda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
              autoFocus
            />
            <div className="max-h-80 overflow-auto border rounded">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="text-xs">Código</TableHead>
                    <TableHead className="text-xs">Cliente</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales
                    .filter(s => {
                      if (!searchTerm) return true;
                      const term = searchTerm.toLowerCase();
                      return s.sale_number?.toLowerCase().includes(term) || 
                             s.person_name?.toLowerCase().includes(term);
                    })
                    .slice(0, 50)
                    .map(s => (
                      <TableRow 
                        key={s.id} 
                        className="cursor-pointer hover:bg-blue-50"
                        onDoubleClick={() => {
                          setCodigoVendaInput(s.id);
                          setShowVendaSearch(false);
                          setSearchTerm('');
                        }}
                      >
                        <TableCell className="text-xs font-mono">{s.sale_number}</TableCell>
                        <TableCell className="text-xs">{s.person_name}</TableCell>
                        <TableCell className="text-xs">{s.sale_date ? format(parseISO(s.sale_date), 'dd/MM/yyyy') : '-'}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-slate-500">Dê duplo clique para selecionar</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVendaSearch(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}