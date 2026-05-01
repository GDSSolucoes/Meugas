import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Search, X, LogOut, Printer, ArrowRight } from "lucide-react";
import * as entities from "@/entities";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, startOfDay, endOfDay, isBefore } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function VasilhameManagementPage() {
  const { toast } = useToast();
  const [loans, setLoans] = useState([]);
  const [displayedLoans, setDisplayedLoans] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [people, setPeople] = useState([]);
  const [vasilhames, setVasilhames] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [sectorMasters, setSectorMasters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Modais
  const [showClienteSearch, setShowClienteSearch] = useState(false);
  const [showProdutoSearch, setShowProdutoSearch] = useState(false);
  const [showModificarModal, setShowModificarModal] = useState(false);
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [qtdeBaixar, setQtdeBaixar] = useState('');
  const [baixaError, setBaixaError] = useState('');

  // Filtros
  const [filtrarCliente, setFiltrarCliente] = useState(true);
  const [filtrarPontoVenda, setFiltrarPontoVenda] = useState(true);
  const [filtroClientePdv, setFiltroClientePdv] = useState('');
  const [filtroClientePdvNome, setFiltroClientePdvNome] = useState('');
  
  const [setorGeral, setSetorGeral] = useState(true);
  const [setorMaster, setSetorMaster] = useState(false);
  const [setorMasterValue, setSetorMasterValue] = useState('');
  const [setorMasterNome, setSetorMasterNome] = useState('');
  const [setorEstqProprio, setSetorEstqProprio] = useState(false);
  const [setorEstqProprioValue, setSetorEstqProprioValue] = useState('');
  const [setorEstqProprioNome, setSetorEstqProprioNome] = useState('');

  const [periodoTipo, setPeriodoTipo] = useState('aDevolver');
  const [dataInicial, setDataInicial] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFinal, setDataFinal] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [filtroProduto, setFiltroProduto] = useState('');
  const [filtroProdutoNome, setFiltroProdutoNome] = useState('');

  // Campo ativo para pesquisa
  const [activeSearchField, setActiveSearchField] = useState(null);

  // Modificar modal state
  const [modDevolvido, setModDevolvido] = useState(false);
  const [modDataDevolucao, setModDataDevolucao] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const [loansData, peopleData, vasilhamesData, sectorsData, sectorMastersData] = await Promise.all([
        entities.VasilhameLoan.filter({ companyId: user.companyId }, { sort: '-createdDate' }),
        entities.Person.filter({ companyId: user.companyId }),
        entities.Product.filter({ companyId: user.companyId, category: 'vasilhame', active: true }),
        entities.Sector.filter({ companyId: user.companyId, active: true }),
        entities.SectorMaster.filter({ companyId: user.companyId })
      ]);
      
      setLoans(loansData);
      setPeople(peopleData);
      setVasilhames(vasilhamesData);
      setSectors(sectorsData);
      setSectorMasters(sectorMastersData);
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

  // Aplicar filtros
  const applyFiltersAndShow = () => {
    let filtered = [...loans];

    // Filtro por Cliente/Pto.Venda
    if (filtroClientePdv) {
      filtered = filtered.filter(loan => loan.personId === filtroClientePdv);
    } else {
      // Filtrar por tipo de pessoa baseado nos checkboxes
      filtered = filtered.filter(loan => {
        const person = people.find(p => p.id === loan.personId);
        if (!person) return false;
        
        const isCliente = person.type === 'cliente';
        const isPontoVenda = person.type === 'pontoVenda';
        
        if (filtrarCliente && filtrarPontoVenda) return isCliente || isPontoVenda;
        if (filtrarCliente && isCliente) return true;
        if (filtrarPontoVenda && isPontoVenda) return true;
        
        return false;
      });
    }

    // Filtro por Setor Master
    if (setorMaster && setorMasterValue) {
      filtered = filtered.filter(loan => loan.sectorMasterId === setorMasterValue);
    }

    // Filtro por Setor Estoque Próprio
    if (setorEstqProprio && setorEstqProprioValue) {
      filtered = filtered.filter(loan => loan.sectorId === setorEstqProprioValue);
    }

    // Filtro por Período
    if (periodoTipo === 'aDevolver') {
      filtered = filtered.filter(loan => loan.status !== 'devolvidoTotal' && loan.status !== 'devolvidoParcial');
    } else {
      // Devolvidos entre datas
      filtered = filtered.filter(loan => {
        if (loan.status !== 'devolvidoTotal') return false;
        if (!loan.returnDate) return false;
        
        const returnDate = parseISO(loan.returnDate);
        const start = startOfDay(new Date(dataInicial + 'T00:00:00'));
        const end = endOfDay(new Date(dataFinal + 'T23:59:59'));
        
        return returnDate >= start && returnDate <= end;
      });
    }

    // Filtro por Produto
    if (filtroProduto) {
      filtered = filtered.filter(loan => loan.vasilhameId === filtroProduto);
    }

    // Ordenar por data mais recente
    filtered.sort((a, b) => new Date(b.loanDate || 0) - new Date(a.loanDate || 0));

    setDisplayedLoans(filtered);
    setShowResults(true);
  };

  const handlePesquisar = () => {
    // Se um campo está focado, abre modal de pesquisa
    if (activeSearchField === 'cliente') {
      setShowClienteSearch(true);
      return;
    }
    if (activeSearchField === 'produto') {
      setShowProdutoSearch(true);
      return;
    }
    // Senão, aplica filtros
    applyFiltersAndShow();
  };

  const handleCancelar = () => {
    // Limpar todos os filtros
    setFiltrarCliente(true);
    setFiltrarPontoVenda(true);
    setFiltroClientePdv('');
    setFiltroClientePdvNome('');
    setSetorGeral(true);
    setSetorMaster(false);
    setSetorMasterValue('');
    setSetorMasterNome('');
    setSetorEstqProprio(false);
    setSetorEstqProprioValue('');
    setSetorEstqProprioNome('');
    setPeriodoTipo('aDevolver');
    setDataInicial(format(new Date(), 'yyyy-MM-dd'));
    setDataFinal(format(new Date(), 'yyyy-MM-dd'));
    setFiltroProduto('');
    setFiltroProdutoNome('');
    setDisplayedLoans([]);
    setShowResults(false);
    setSelectedLoan(null);
  };

  const handleModificar = () => {
    if (!selectedLoan) {
      toast({ title: "Atenção", description: "Selecione um registro para modificar.", variant: "destructive" });
      return;
    }
    setModDevolvido(selectedLoan.status === 'devolvidoTotal');
    setModDataDevolucao(selectedLoan.returnDate || format(new Date(), 'yyyy-MM-dd'));
    setShowModificarModal(true);
  };

  const handleSalvarModificacao = async () => {
    if (!selectedLoan) return;

    try {
      await entities.VasilhameLoan.update(selectedLoan.id, {
        status: modDevolvido ? 'devolvidoTotal' : 'pendente',
        returnedQuantity: modDevolvido ? selectedLoan.loanQuantity : 0,
        returnDate: modDevolvido ? modDataDevolucao : null
      });

      toast({ title: "Sucesso", description: "Registro atualizado com sucesso." });
      setShowModificarModal(false);
      setSelectedLoan(null);
      await loadData();
      if (showResults) {
        setTimeout(() => applyFiltersAndShow(), 100);
      }
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o registro.", variant: "destructive" });
    }
  };

  const handleImprimir = () => {
    const dataToprint = showResults ? displayedLoans : [];
    
    if (dataToprint.length === 0) {
      toast({ title: "Atenção", description: "Nenhum dado para imprimir. Execute a pesquisa primeiro.", variant: "destructive" });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Controle de Vasilhames Emprestados</title>
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
          .devolvido { background-color: #d4edda; }
          .pendente { background-color: #fff3cd; }
          .footer { margin-top: 15px; text-align: center; font-size: 9px; color: #666; }
          @media print { body { padding: 10px; } button { display: none; } }
          .btn-print { display: block; margin: 15px auto; padding: 8px 25px; font-size: 12px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Controle de Vasilhames Emprestados (Venda)</h1>
        <p class="subtitle">Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        
        <div class="filters">
          <strong>Filtros:</strong> 
          Tipo: ${filtrarCliente && filtrarPontoVenda ? 'Cliente e Pto. Venda' : filtrarCliente ? 'Cliente' : 'Pto. Venda'} |
          Período: ${periodoTipo === 'aDevolver' ? 'A Devolver' : `Devolvidos de ${format(parseISO(dataInicial), 'dd/MM/yyyy')} a ${format(parseISO(dataFinal), 'dd/MM/yyyy')}`}
          ${filtroProdutoNome ? ` | Produto: ${filtroProdutoNome}` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Dt Venda</th>
              <th>Venda</th>
              <th>Cliente / Pto. Venda</th>
              <th>Produto</th>
              <th>Qtd</th>
              <th class="text-center">Devolvido</th>
              <th>Data Dev.</th>
            </tr>
          </thead>
          <tbody>
            ${dataToprint.map(loan => `
              <tr class="${loan.status === 'devolvidoTotal' ? 'devolvido' : 'pendente'}">
                <td>${loan.loanDate ? format(parseISO(loan.loanDate), 'dd/MM/yyyy') : '-'}</td>
                <td>${loan.saleId?.slice(-6) || '-'}</td>
                <td>${loan.personName || '-'}</td>
                <td>${loan.vasilhameName || '-'}</td>
                <td>${loan.loanQuantity || 0}</td>
                <td class="text-center">${loan.status === 'devolvidoTotal' ? 'Sim' : 'Não'}</td>
                <td>${loan.returnDate ? format(parseISO(loan.returnDate), 'dd/MM/yyyy') : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p class="footer">Total de registros: ${dataToprint.length}</p>
        
        <button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const getRowColor = (loan) => {
    if (loan.status === 'devolvidoTotal') return 'bg-green-50';
    // Verificar se é venda antiga (mais de 30 dias)
    if (loan.loanDate) {
      const loanDate = parseISO(loan.loanDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (isBefore(loanDate, thirtyDaysAgo)) {
        return 'bg-red-50';
      }
    }
    return 'bg-yellow-50';
  };

  const handleRowDoubleClick = (loan) => {
    if (loan.status === 'devolvidoTotal') return;
    setSelectedLoan(loan);
    setQtdeBaixar('');
    setBaixaError('');
    setShowBaixaModal(true);
  };

  const handleConfirmarBaixa = async () => {
    if (!selectedLoan) return;
    
    const qtde = parseInt(qtdeBaixar) || 0;
    const pendente = (selectedLoan.loanQuantity || 0) - (selectedLoan.returnedQuantity || 0);
    
    if (qtde <= 0) {
      setBaixaError('Informe uma quantidade válida.');
      return;
    }
    
    if (qtde > pendente) {
      setBaixaError(`Quantidade inválida. Máximo permitido: ${pendente}. Por favor, redigite.`);
      return;
    }

    try {
      const novaQtdeDevolvida = (selectedLoan.returnedQuantity || 0) + qtde;
      const totalEmprestado = selectedLoan.loanQuantity || 0;
      const novoStatus = novaQtdeDevolvida >= totalEmprestado ? 'devolvidoTotal' : 'devolvidoParcial';

      await entities.VasilhameLoan.update(selectedLoan.id, {
        status: novoStatus,
        returnedQuantity: novaQtdeDevolvida,
        returnDate: novoStatus === 'devolvidoTotal' ? format(new Date(), 'yyyy-MM-dd') : selectedLoan.returnDate
      });

      toast({ title: "Sucesso", description: `Baixa de ${qtde} vasilhame(s) realizada com sucesso.` });
      setShowBaixaModal(false);
      setSelectedLoan(null);
      await loadData();
      if (showResults) {
        setTimeout(() => applyFiltersAndShow(), 100);
      }
    } catch (error) {
      console.error("Erro ao dar baixa:", error);
      toast({ title: "Erro", description: "Não foi possível realizar a baixa.", variant: "destructive" });
    }
  };

  const filteredPeople = people.filter(p => {
    const isCliente = p.type === 'cliente';
    const isPontoVenda = p.type === 'pontoVenda';
    
    if (filtrarCliente && filtrarPontoVenda) return isCliente || isPontoVenda;
    if (filtrarCliente) return isCliente;
    if (filtrarPontoVenda) return isPontoVenda;
    
    return false;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-300 p-4">
        <h1 className="text-xl font-bold text-slate-800">Controle de vasilhames emprestados (Venda)</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-full mx-auto space-y-4">
          
          {/* SEÇÃO DE FILTROS */}
          <div className="grid grid-cols-12 gap-4">
            
            {/* FILTRAR POR + SETOR (Lado Esquerdo) */}
            <div className="col-span-5">
              <Card className="bg-white border-slate-300 h-full">
                <CardContent className="p-4 space-y-4">
                  {/* Filtrar por */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Filtrar por:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="fpCliente" 
                          checked={filtrarCliente}
                          onCheckedChange={setFiltrarCliente}
                        />
                        <label htmlFor="fpCliente" className="text-sm">Cliente</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="fpPdv" 
                          checked={filtrarPontoVenda}
                          onCheckedChange={setFiltrarPontoVenda}
                        />
                        <label htmlFor="fpPdv" className="text-sm">Pto. Venda</label>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={filtroClientePdvNome}
                        onChange={(e) => {
                          setFiltroClientePdvNome(e.target.value);
                          if (!e.target.value) {
                            setFiltroClientePdv('');
                          }
                        }}
                        onFocus={() => setActiveSearchField('cliente')}
                        onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                        placeholder="Todos"
                        className={`h-8 text-sm flex-1 ${!filtroClientePdvNome ? 'placeholder:text-red-500' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Setor */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Setor:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="setorGeral" 
                          checked={setorGeral} 
                          onCheckedChange={setSetorGeral}
                        />
                        <label htmlFor="setorGeral" className="text-sm">Geral</label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="setorMaster" 
                          checked={setorMaster} 
                          onCheckedChange={setSetorMaster}
                        />
                        <label htmlFor="setorMaster" className="text-sm">Master</label>
                        <Input
                          value={setorMasterNome}
                          onChange={(e) => {
                            setSetorMasterNome(e.target.value);
                            if (!e.target.value) {
                              setSetorMasterValue('');
                            }
                          }}
                          disabled={!setorMaster}
                          className={`h-7 text-xs flex-1 ${!setorMasterNome && setorMaster ? 'placeholder:text-red-500' : 'placeholder:text-slate-300'}`}
                          placeholder="Todos"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="setorEstq" 
                          checked={setorEstqProprio} 
                          onCheckedChange={setSetorEstqProprio}
                        />
                        <label htmlFor="setorEstq" className="text-sm whitespace-nowrap">Setor Estq.Proprio</label>
                        <Input
                          value={setorEstqProprioNome}
                          onChange={(e) => {
                            setSetorEstqProprioNome(e.target.value);
                            if (!e.target.value) {
                              setSetorEstqProprioValue('');
                            }
                          }}
                          disabled={!setorEstqProprio}
                          className={`h-7 text-xs flex-1 ${!setorEstqProprioNome && setorEstqProprio ? 'placeholder:text-red-500' : 'placeholder:text-slate-300'}`}
                          placeholder="Todos"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PERÍODO + PRODUTO (Lado Direito) */}
            <div className="col-span-7">
              <Card className="bg-white border-slate-300 h-full">
                <CardContent className="p-4 space-y-4">
                  {/* Período */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Período da venda / devolução:</h4>
                    <RadioGroup value={periodoTipo} onValueChange={setPeriodoTipo} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="aDevolver" id="periodoDevolver" />
                        <label htmlFor="periodoDevolver" className="text-sm">A Devolver</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="devolvidos" id="periodoDevolvidos" />
                        <label htmlFor="periodoDevolvidos" className="text-sm">Devolvidos entre:</label>
                      </div>
                    </RadioGroup>
                    
                    <div className="flex items-center gap-2 mt-2 ml-6">
                      <Input
                        type="date"
                        value={dataInicial}
                        onChange={(e) => setDataInicial(e.target.value)}
                        disabled={periodoTipo !== 'devolvidos'}
                        className="h-8 text-sm w-36"
                      />
                      <span className="text-sm text-slate-600">a</span>
                      <Input
                        type="date"
                        value={dataFinal}
                        onChange={(e) => setDataFinal(e.target.value)}
                        disabled={periodoTipo !== 'devolvidos'}
                        className="h-8 text-sm w-36"
                      />
                    </div>
                  </div>

                  {/* Produto */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Produto:</h4>
                    <div className="flex items-center gap-2">
                      <Input
                        value={filtroProdutoNome}
                        onChange={(e) => {
                          setFiltroProdutoNome(e.target.value);
                          if (!e.target.value) {
                            setFiltroProduto('');
                          }
                        }}
                        onFocus={() => setActiveSearchField('produto')}
                        onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                        placeholder="Todos"
                        className={`h-8 text-sm w-64 ${!filtroProdutoNome ? 'placeholder:text-red-500' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Botão Pesquisar */}
                  <Button 
                    className="w-32 mt-3 text-white text-xs h-7 gap-1"
                    style={{ backgroundColor: '#e78b3a' }}
                    onClick={applyFiltersAndShow}
                  >
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* GRID DE RESULTADOS */}
          <Card className="bg-white border-slate-300">
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-auto">
                {!showResults ? (
                  <div className="flex items-center justify-center h-48 text-slate-500 text-sm p-8">
                    <div className="text-center">
                      <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>Selecione os filtros e clique no botão <strong>➔</strong> para pesquisar</p>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-100 sticky top-0">
                      <TableRow>
                        <TableHead className="text-xs w-24">Dt Venda</TableHead>
                        <TableHead className="text-xs w-20">Venda</TableHead>
                        <TableHead className="text-xs">Cliente / Pto. Venda</TableHead>
                        <TableHead className="text-xs w-32">Produto</TableHead>
                        <TableHead className="text-xs w-16 text-center">Qtd</TableHead>
                        <TableHead className="text-xs w-20 text-center">Devolvido</TableHead>
                        <TableHead className="text-xs w-24">Data Dev.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell>
                        </TableRow>
                      ) : displayedLoans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                            Nenhum vasilhame encontrado com os filtros selecionados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayedLoans.map(loan => (
                          <TableRow 
                            key={loan.id}
                            className={`cursor-pointer hover:bg-slate-100 ${getRowColor(loan)} ${selectedLoan?.id === loan.id ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => setSelectedLoan(loan)}
                            onDoubleClick={() => handleRowDoubleClick(loan)}
                          >
                            <TableCell className="text-xs">
                              {loan.loanDate ? format(parseISO(loan.loanDate), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                            <TableCell className="text-xs font-mono">{loan.saleId?.slice(-6) || '-'}</TableCell>
                            <TableCell className="text-xs">{loan.personName || '-'}</TableCell>
                            <TableCell className="text-xs">{loan.vasilhameName || '-'}</TableCell>
                            <TableCell className="text-xs text-center">{loan.loanQuantity || 0}</TableCell>
                            <TableCell className="text-xs text-center">
                              {loan.status === 'devolvidoTotal' ? (
                                <Badge className="bg-green-100 text-green-800 text-xs">Sim</Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">Não</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {loan.returnDate ? format(parseISO(loan.returnDate), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Legenda */}
          {showResults && displayedLoans.length > 0 && (
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span>Devolvido</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span>Pendente</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span>Pendente há mais de 30 dias</span>
              </div>
              <div className="ml-auto text-slate-600">
                Total de registros: {displayedLoans.length}
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
            onClick={handleModificar}
            disabled={!selectedLoan}
          >
            <Edit className="w-3 h-3" /> Alterar
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
            disabled={!showResults || displayedLoans.length === 0}
          >
            <Printer className="w-3 h-3" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Modal Pesquisa Cliente/PDV */}
      <Dialog open={showClienteSearch} onOpenChange={setShowClienteSearch}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Pesquisar {filtrarCliente && filtrarPontoVenda ? 'Cliente/PDV' : filtrarCliente ? 'Cliente' : 'Ponto de Venda'}
            </DialogTitle>
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
                          setFiltroClientePdv(p.id);
                          setFiltroClientePdvNome(p.name);
                          setShowClienteSearch(false);
                          setSearchTerm('');
                        }}
                      >
                        <TableCell className="text-xs font-mono">{p.personNumber || p.id?.slice(-6)}</TableCell>
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

      {/* Modal Pesquisa Produto */}
      <Dialog open={showProdutoSearch} onOpenChange={setShowProdutoSearch}>
        <DialogContent className="max-w-xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pesquisar Produto/Vasilhame</DialogTitle>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vasilhames
                    .filter(v => {
                      if (!searchTerm) return true;
                      const term = searchTerm.toLowerCase();
                      return v.name?.toLowerCase().includes(term) || 
                             v.code?.toLowerCase().includes(term);
                    })
                    .map(v => (
                      <TableRow 
                        key={v.id} 
                        className="cursor-pointer hover:bg-blue-50"
                        onDoubleClick={() => {
                          setFiltroProduto(v.id);
                          setFiltroProdutoNome(v.name);
                          setShowProdutoSearch(false);
                          setSearchTerm('');
                        }}
                      >
                        <TableCell className="text-xs font-mono">{v.code || v.id?.slice(-6)}</TableCell>
                        <TableCell className="text-xs">{v.name}</TableCell>
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

      {/* Modal Modificar */}
      <Dialog open={showModificarModal} onOpenChange={setShowModificarModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modificar Vasilhame Emprestado</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
                <p><strong>Cliente:</strong> {selectedLoan.personName}</p>
                <p><strong>Produto:</strong> {selectedLoan.vasilhameName}</p>
                <p><strong>Quantidade:</strong> {selectedLoan.loanQuantity}</p>
                <p><strong>Data Empréstimo:</strong> {selectedLoan.loanDate ? format(parseISO(selectedLoan.loanDate), 'dd/MM/yyyy') : '-'}</p>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox 
                  id="modDevolvido" 
                  checked={modDevolvido} 
                  onCheckedChange={setModDevolvido}
                />
                <label htmlFor="modDevolvido" className="text-sm font-medium">Marcar como Devolvido</label>
              </div>

              {modDevolvido && (
                <div>
                  <Label className="text-sm">Data da Devolução:</Label>
                  <Input 
                    type="date" 
                    value={modDataDevolucao} 
                    onChange={(e) => setModDataDevolucao(e.target.value)}
                    className="h-9"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModificarModal(false)}>Cancelar</Button>
            <Button onClick={handleSalvarModificacao} className="text-white hover:opacity-90" style={{ backgroundColor: '#e78b3a' }}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Baixa Rápida */}
      <Dialog open={showBaixaModal} onOpenChange={setShowBaixaModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Baixa de Vasilhame</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
                <p><strong>Cliente:</strong> {selectedLoan.personName}</p>
                <p><strong>Produto:</strong> {selectedLoan.vasilhameName}</p>
                <p><strong>Emprestado:</strong> {selectedLoan.loanQuantity}</p>
                <p><strong>Já devolvido:</strong> {selectedLoan.returnedQuantity || 0}</p>
                <p><strong>Pendente:</strong> {(selectedLoan.loanQuantity || 0) - (selectedLoan.returnedQuantity || 0)}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Qtde. a baixar:</Label>
                <Input 
                  type="number"
                  min="1"
                  max={(selectedLoan.loanQuantity || 0) - (selectedLoan.returnedQuantity || 0)}
                  value={qtdeBaixar}
                  onChange={(e) => {
                    setQtdeBaixar(e.target.value);
                    setBaixaError('');
                  }}
                  className="h-9 mt-1"
                  placeholder="Informe a quantidade..."
                  autoFocus
                />
                {baixaError && (
                  <p className="text-red-600 text-xs mt-2">{baixaError}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBaixaModal(false)}>Cancelar</Button>
            <Button onClick={handleConfirmarBaixa} className="text-white hover:opacity-90" style={{ backgroundColor: '#e78b3a' }}>
              Ok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}