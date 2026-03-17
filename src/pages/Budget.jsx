import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Edit, Trash2, Search, Save, X, LogOut, Printer, Plus
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Budget() {
  const { toast } = useToast();
  const nomeInputRef = React.useRef(null);
  const codigoInputRef = React.useRef(null);
  const codigoProdutoInputRef = React.useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [products, setProducts] = useState([]);
  const [lastFocusedField, setLastFocusedField] = useState('codigo');
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  
  // Dados do Cliente (não salvos no cadastro)
  const [nome, setNome] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('PR');
  
  // Produtos
  const [items, setItems] = useState([]);
  const [codigoProduto, setCodigoProduto] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [valorUnitario, setValorUnitario] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // Focar no campo Código ao carregar
  useEffect(() => {
    codigoInputRef.current?.focus();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const [budgetsData, productsData] = await Promise.all([
        base44.entities.Budget.filter({ company_id: user.company_id }),
        base44.entities.Product.filter({ company_id: user.company_id, active: true })
      ]);
      
      setBudgets(budgetsData);
      setProducts(productsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const limparCampos = () => {
    setCodigo('');
    setNome('');
    setRua('');
    setNumero('');
    setComplemento('');
    setBairro('');
    setCidade('');
    setUf('PR');
    setItems([]);
    setCodigoProduto('');
    setQuantidade('1');
    setValorUnitario('');
    setSelectedProduct(null);
    setIsEditingCustomer(false);
  };

  const buscarOrcamentoPorCodigo = () => {
    // Se código vazio, novo orçamento
    if (!codigo || codigo.trim() === '') {
      setNome('');
      setRua('');
      setNumero('');
      setComplemento('');
      setBairro('');
      setCidade('');
      setUf('PR');
      setItems([]);
      setIsEditingCustomer(true);
      toast({ title: "Novo Orçamento", description: "Preencha os dados para criar um novo orçamento." });
      // Focar no campo Nome após um pequeno delay
      setTimeout(() => {
        nomeInputRef.current?.focus();
      }, 100);
      return;
    }
    
    const orcamento = budgets.find(b => b.budget_number === codigo);
    
    if (orcamento) {
      setNome(orcamento.customer_data?.name || '');
      setRua(orcamento.customer_data?.street || '');
      setNumero(orcamento.customer_data?.number || '');
      setComplemento(orcamento.customer_data?.complement || '');
      setBairro(orcamento.customer_data?.neighborhood || '');
      setCidade(orcamento.customer_data?.city || '');
      setUf(orcamento.customer_data?.state || 'PR');
      setItems(orcamento.items || []);
      setIsEditingCustomer(false);
      toast({ title: "Orçamento encontrado", description: `Orçamento #${orcamento.budget_number} carregado com sucesso.` });
    } else {
      setShowErrorModal(true);
    }
  };

  const handleCodigoKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      buscarOrcamentoPorCodigo();
    }
  };

  const handleCodigoChange = (value) => {
    setCodigo(value);
  };

  const handleModificar = () => {
    if (!codigo) {
      toast({ title: "Atenção", description: "Informe um código para modificar.", variant: "destructive" });
      return;
    }
    setIsEditingCustomer(true);
    toast({ title: "Info", description: "Campos liberados para edição." });
    // Focar no campo Nome após habilitar edição
    setTimeout(() => {
      nomeInputRef.current?.focus();
    }, 100);
  };

  const handleExcluir = async () => {
    if (!codigo) {
      toast({ title: "Atenção", description: "Informe um código para excluir.", variant: "destructive" });
      return;
    }
    
    const orcamento = budgets.find(b => b.budget_number === codigo);
    if (!orcamento) {
      toast({ title: "Erro", description: "Orçamento não encontrado.", variant: "destructive" });
      return;
    }
    
    if (!window.confirm("Tem certeza que deseja excluir este orçamento?")) {
      return;
    }
    
    try {
      await base44.entities.Budget.delete(orcamento.id);
      toast({ title: "Sucesso", description: "Orçamento excluído com sucesso." });
      await loadData();
      limparCampos();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    }
  };

  const handlePesquisar = () => {
    if (lastFocusedField === 'codigo') {
      setShowSearchModal(true);
    } else if (lastFocusedField === 'produto') {
      setShowProductSearch(true);
    } else {
      // Fallback: se nenhum campo estiver focado, perguntar ao usuário
      setShowSearchModal(true);
    }
  };

  const handleAdicionarProduto = () => {
    if (!selectedProduct) {
      toast({ title: "Atenção", description: "Selecione um produto.", variant: "destructive" });
      return;
    }
    
    const qtd = parseFloat(quantidade) || 0;
    const valor = parseFloat(valorUnitario) || 0;
    
    if (qtd <= 0) {
      toast({ title: "Atenção", description: "Quantidade deve ser maior que zero.", variant: "destructive" });
      return;
    }
    
    if (valor <= 0) {
      toast({ title: "Atenção", description: "Valor unitário deve ser maior que zero.", variant: "destructive" });
      return;
    }
    
    const novoItem = {
      product_id: selectedProduct.id,
      product_code: selectedProduct.code || '',
      product_name: selectedProduct.name,
      quantity: qtd,
      unit_price: valor,
      total: qtd * valor
    };
    
    setItems(prev => [...prev, novoItem]);
    setCodigoProduto('');
    setQuantidade('1');
    setValorUnitario('');
    setSelectedProduct(null);
  };

  const handleRemoverItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleOk = async () => {
    if (isSaving) return;
    
    if (!nome) {
      toast({ title: "Erro", description: "Nome do cliente é obrigatório.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    
    try {
      const customerData = {
        name: nome,
        street: rua,
        number: numero,
        complement: complemento,
        neighborhood: bairro,
        city: cidade,
        state: uf
      };

      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      // Se tem código, é edição
      if (codigo) {
        const orcamento = budgets.find(b => b.budget_number === codigo);
        if (orcamento) {
          await base44.entities.Budget.update(orcamento.id, {
            customer_data: customerData,
            items: items,
            total_amount: totalAmount,
            company_id: currentUser.company_id,
            company_name: currentUser.company_name,
            created_by_name: currentUser.full_name
          });
          
          toast({ title: "Sucesso", description: `Orçamento #${codigo} atualizado com sucesso!` });
        }
      } else {
        // Novo orçamento - gerar código sequencial
        const allBudgets = await base44.entities.Budget.filter({ company_id: currentUser.company_id });
        const maxBudgetNumber = allBudgets.reduce((max, budget) => {
          const currentNum = parseInt(budget.budget_number, 10);
          return !isNaN(currentNum) && currentNum > max ? currentNum : max;
        }, 0);
        const newBudgetNumber = String(maxBudgetNumber + 1);
        
        await base44.entities.Budget.create({
          budget_number: newBudgetNumber,
          customer_data: customerData,
          items: items,
          total_amount: totalAmount,
          company_id: currentUser.company_id,
          company_name: currentUser.company_name,
          created_by_name: currentUser.full_name
        });
        
        setCodigo(newBudgetNumber);
        toast({ title: "Sucesso", description: `Orçamento #${newBudgetNumber} criado com sucesso!` });
      }
      
      await loadData();
      setIsEditingCustomer(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImprimir = () => {
    if (!codigo && items.length === 0) {
      toast({ title: "Atenção", description: "Preencha os dados para imprimir.", variant: "destructive" });
      return;
    }
    
    const totalGeral = items.reduce((sum, item) => sum + item.total, 0);
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orçamento #${codigo || 'Novo'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; font-size: 12px; }
          h1 { text-align: center; margin-bottom: 10px; }
          .data { text-align: center; margin-bottom: 20px; font-size: 11px; color: #666; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
          .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; background: #f0f0f0; padding: 5px; }
          .field { margin: 5px 0; display: flex; }
          .field label { font-weight: bold; width: 150px; }
          .field span { color: #555; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f0f0f0; }
          .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 20px; }
          .assinatura { margin-top: 60px; padding-top: 30px; }
          .assinatura-linha { border-top: 1px solid #000; width: 300px; margin: 0 auto; padding-top: 5px; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>ORÇAMENTO ${codigo ? '#' + codigo : ''}</h1>
        <div class="data">Data: ${dataAtual}</div>
        <div class="section">
          <div class="section-title">Dados do Cliente</div>
          <div class="field"><label>Nome:</label><span>${nome}</span></div>
          <div class="field"><label>Endereço:</label><span>${rua}, ${numero} ${complemento}</span></div>
          <div class="field"><label>Bairro:</label><span>${bairro}</span></div>
          <div class="field"><label>Cidade/UF:</label><span>${cidade}/${uf}</span></div>
        </div>
        <div class="section">
          <div class="section-title">Produtos</div>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Valor Unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.product_code}</td>
                  <td>${item.product_name}</td>
                  <td>${item.quantity}</td>
                  <td>R$ ${item.unit_price.toFixed(2)}</td>
                  <td>R$ ${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">Total Geral: R$ ${totalGeral.toFixed(2)}</div>
        </div>
        <div class="assinatura">
          <div class="assinatura-linha">
            Assinatura do Responsável
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleSelectBudget = (budget) => {
    setCodigo(budget.budget_number);
    setNome(budget.customer_data?.name || '');
    setRua(budget.customer_data?.street || '');
    setNumero(budget.customer_data?.number || '');
    setComplemento(budget.customer_data?.complement || '');
    setBairro(budget.customer_data?.neighborhood || '');
    setCidade(budget.customer_data?.city || '');
    setUf(budget.customer_data?.state || 'PR');
    setItems(budget.items || []);
    setIsEditingCustomer(false);
    setShowSearchModal(false);
    setSearchTerm('');
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setCodigoProduto(product.code || product.id?.slice(-6) || '');
    setValorUnitario(product.unit_price?.toString() || '0');
    setShowProductSearch(false);
    setSearchTerm('');
  };

  const totalGeral = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-300 p-4">
        <h1 className="text-xl font-bold" style={{ color: '#223f61' }}>Orçamento</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-4">
          
          {/* Código do Orçamento */}
          <div className="flex items-center gap-2">
            <Label className="text-sm w-16">Código:</Label>
            <Input 
              ref={codigoInputRef}
              value={codigo}
              onChange={(e) => handleCodigoChange(e.target.value)}
              onKeyDown={handleCodigoKeyDown}
              onFocus={() => setLastFocusedField('codigo')}
              className="w-32 h-8"
              placeholder=""
            />
            <span className="text-xs text-slate-500">
              Digite o código do orçamento e pressione Enter/Tab. Deixe em branco para novo orçamento.
            </span>
          </div>

          {/* Dados do Cliente */}
          <Card className="bg-white border-slate-300">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-4 pb-2 border-b">Dados do Cliente</h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <Label className="text-sm col-span-1">Nome:</Label>
                  <Input 
                    ref={nomeInputRef}
                    value={nome} 
                    onChange={(e) => setNome(e.target.value)} 
                    className={`col-span-11 h-8 ${!isEditingCustomer ? 'bg-gray-100' : 'bg-white'}`}
                    readOnly={!isEditingCustomer}
                  />
                </div>

                <div className="grid grid-cols-12 gap-2 items-center">
                  <Label className="text-sm col-span-1">Rua:</Label>
                  <Input 
                    value={rua} 
                    onChange={(e) => setRua(e.target.value)} 
                    className={`col-span-6 h-8 ${!isEditingCustomer ? 'bg-gray-100' : 'bg-white'}`}
                    readOnly={!isEditingCustomer}
                  />
                  <Label className="text-sm">Nº:</Label>
                  <Input 
                    value={numero} 
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setNumero(value);
                    }} 
                    className={`col-span-1 h-8 ${!isEditingCustomer ? 'bg-gray-100' : 'bg-white'}`}
                    readOnly={!isEditingCustomer}
                  />
                  <Label className="text-sm">Compl.:</Label>
                  <Input 
                    value={complemento} 
                    onChange={(e) => setComplemento(e.target.value)} 
                    className={`col-span-2 h-8 ${!isEditingCustomer ? 'bg-gray-100' : 'bg-white'}`}
                    readOnly={!isEditingCustomer}
                  />
                </div>

                <div className="grid grid-cols-12 gap-2 items-center">
                  <Label className="text-sm col-span-1">Bairro:</Label>
                  <Input 
                    value={bairro} 
                    onChange={(e) => setBairro(e.target.value)} 
                    className={`col-span-4 h-8 ${!isEditingCustomer ? 'bg-gray-100' : 'bg-white'}`}
                    readOnly={!isEditingCustomer}
                  />
                  <Label className="text-sm">Cidade:</Label>
                  <Input 
                    value={cidade} 
                    onChange={(e) => setCidade(e.target.value)} 
                    className={`col-span-4 h-8 ${!isEditingCustomer ? 'bg-gray-100' : 'bg-white'}`}
                    readOnly={!isEditingCustomer}
                  />
                  <Label className="text-sm">UF:</Label>
                  <Input 
                    value={uf} 
                    onChange={(e) => setUf(e.target.value)} 
                    className={`col-span-1 h-8 ${!isEditingCustomer ? 'bg-gray-100' : 'bg-white'}`}
                    maxLength={2}
                    readOnly={!isEditingCustomer}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Produtos */}
          <Card className="bg-white border-slate-300">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-4 pb-2 border-b">Produtos</h3>
              
              <div className="grid grid-cols-12 gap-3 items-end mb-4">
                <div className="col-span-3">
                  <Label className="text-sm">Código:</Label>
                  <Input 
                    ref={codigoProdutoInputRef}
                    value={codigoProduto}
                    onChange={(e) => setCodigoProduto(e.target.value)}
                    onFocus={() => setLastFocusedField('produto')}
                    className="h-8 mt-1"
                    placeholder="Produto"
                    readOnly
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm">Quantidade:</Label>
                  <Input 
                    type="number"
                    min="1"
                    step="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="h-8 mt-1"
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-sm">Valor Unitário:</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={valorUnitario}
                    onChange={(e) => setValorUnitario(e.target.value)}
                    className="h-8 mt-1"
                  />
                </div>
                <div className="col-span-4">
                  <Button 
                    onClick={handleAdicionarProduto}
                    className="w-full h-8 text-white"
                    style={{ background: '#e78b3a' }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Lista de Produtos */}
              {items.length > 0 && (
                <div className="border rounded mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Código</TableHead>
                        <TableHead className="text-xs">Produto</TableHead>
                        <TableHead className="text-xs text-right">Qtde</TableHead>
                        <TableHead className="text-xs text-right">Vlr. Unit.</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                        <TableHead className="text-xs text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs">{item.product_code}</TableCell>
                          <TableCell className="text-xs">{item.product_name}</TableCell>
                          <TableCell className="text-xs text-right">{item.quantity}</TableCell>
                          <TableCell className="text-xs text-right">R$ {item.unit_price.toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-right font-semibold">R$ {item.total.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoverItem(index)}
                              className="h-6 w-6 text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Total */}
              {items.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">Total Geral:</p>
                    <p className="text-2xl font-bold text-slate-800">R$ {totalGeral.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Barra de Ações */}
      <div className="bg-slate-200 border-t border-slate-300 p-2">
        <div className="flex gap-1 items-center justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-12 flex flex-col gap-1 px-4" 
            onClick={handleModificar}
            disabled={!codigo || isEditingCustomer}
          >
            <Edit className="w-4 h-4" />
            <span className="text-xs">Alterar</span>
          </Button>
          <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1 px-4 text-red-600 hover:bg-red-50" onClick={handleExcluir}>
            <Trash2 className="w-4 h-4" />
            <span className="text-xs">Excluir</span>
          </Button>
          <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1 px-4" onClick={handlePesquisar}>
            <Search className="w-4 h-4" />
            <span className="text-xs">Pesquisar</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-12 flex flex-col gap-1 px-4 text-white" 
            style={{ backgroundColor: '#e78b3a' }}
            onClick={handleOk}
            disabled={isSaving || !isEditingCustomer}
          >
            <Save className="w-4 h-4" />
            <span className="text-xs">{isSaving ? 'Salvando...' : 'Ok'}</span>
          </Button>
          <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1 px-4" onClick={limparCampos}>
            <X className="w-4 h-4" />
            <span className="text-xs">Cancelar</span>
          </Button>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="sm" className="h-12 flex flex-col gap-1 px-4">
              <LogOut className="w-4 h-4" />
              <span className="text-xs">Sair</span>
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-12 flex flex-col gap-1 px-4" 
            onClick={handleImprimir}
            disabled={!codigo}
          >
            <Printer className="w-4 h-4" />
            <span className="text-xs">Imprimir</span>
          </Button>
        </div>
      </div>

      {/* Modal Erro */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Código Não Encontrado</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              O código de orçamento digitado não foi encontrado. Por favor, verifique e digite novamente.
            </p>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowErrorModal(false);
                setCodigo('');
              }}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Pesquisa Orçamento */}
      <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pesquisar Orçamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Buscar por código, nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
            <div className="max-h-96 overflow-auto border rounded">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="text-xs">Código</TableHead>
                    <TableHead className="text-xs">Cliente</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets
                    .filter(b => {
                      if (!searchTerm) return true;
                      const term = searchTerm.toLowerCase();
                      return b.budget_number?.toLowerCase().includes(term) || 
                             b.customer_data?.name?.toLowerCase().includes(term);
                    })
                    .map(b => (
                      <TableRow 
                        key={b.id}
                        className="cursor-pointer hover:bg-blue-50"
                        onDoubleClick={() => handleSelectBudget(b)}
                      >
                        <TableCell className="text-xs font-mono">{b.budget_number}</TableCell>
                        <TableCell className="text-xs">{b.customer_data?.name || '-'}</TableCell>
                        <TableCell className="text-xs">{b.created_date ? new Date(b.created_date).toLocaleDateString('pt-BR') : '-'}</TableCell>
                        <TableCell className="text-xs text-right">R$ {(b.total_amount || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-slate-500">Dê duplo clique para selecionar</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSearchModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Pesquisa Produto */}
      <Dialog open={showProductSearch} onOpenChange={setShowProductSearch}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pesquisar Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Digite o código ou nome do produto..."
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
                    <TableHead className="text-xs text-right">Preço</TableHead>
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
                        onDoubleClick={() => handleSelectProduct(prod)}
                      >
                        <TableCell className="text-xs font-mono">{prod.code || prod.id?.slice(-6)}</TableCell>
                        <TableCell className="text-xs">{prod.name}</TableCell>
                        <TableCell className="text-xs">{prod.category || '-'}</TableCell>
                        <TableCell className="text-xs text-right">R$ {(prod.unit_price || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-slate-500">Dê duplo clique para selecionar</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductSearch(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}