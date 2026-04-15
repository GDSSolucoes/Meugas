import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  DollarSign, Search, LogOut, Printer, Edit, Trash2, 
  CheckSquare, Square, FileText, RefreshCw
} from "lucide-react";
import { AccountsReceivables } from "@/entities/AccountsReceivables";
import { CashAccounts } from "@/entities/CashAccounts";
import { CashMovements } from "@/entities/CashMovements";
import { FinancialGroups } from "@/entities/FinancialGroups";
import { PaymentTypes } from "@/entities/PaymentTypes";
import { Sectors } from "@/entities/Sectors";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, isBefore, startOfDay, startOfMonth } from "date-fns";
import RenegociacaoModal from "./RenegociacaoModal";

// Dialog de Baixa
function BaixaDialog({ isOpen, onClose, onConfirm, cashAccounts, preSelectedAccountId, contas, totalSelecionado }) {
  const [selectedAccountId, setSelectedAccountId] = useState(preSelectedAccountId || '');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (preSelectedAccountId) {
      setSelectedAccountId(preSelectedAccountId);
    } else if (cashAccounts.length > 0) {
      setSelectedAccountId(cashAccounts[0].id);
    }
  }, [cashAccounts, preSelectedAccountId]);

  if (!contas || contas.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Baixar Contas a Receber</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p><strong>Quantidade:</strong> {contas.length} conta(s) selecionada(s)</p>
          <p><strong>Valor Total:</strong> <span className="text-green-600 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSelecionado)}</span></p>
          <div>
            <Label>Data do Recebimento</Label>
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div>
            <Label>Conta/Caixa de Destino *</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta..." />
              </SelectTrigger>
              <SelectContent>
                {cashAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onConfirm(selectedAccountId, paymentDate)} disabled={!selectedAccountId} className="bg-green-600 hover:bg-green-700">
            Confirmar Recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ContasAReceberModal({ 
  open, 
  onOpenChange, 
  currentUser, 
  cashAccounts,
  preSelectedAccountId,
  onPaymentComplete 
}) {
  const { toast } = useToast();
  const [contas, setContas] = useState([]);
  const [displayedContas, setDisplayedContas] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBaixaOpen, setIsBaixaOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isRenegociacaoOpen, setIsRenegociacaoOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedContas, setSelectedContas] = useState([]);
  const [selectedContaForAction, setSelectedContaForAction] = useState(null);

  // Filtros - Tipo Sacado
  const [tipoSacado, setTipoSacado] = useState({
    cliente: true,
    pontoVenda: false,
    conveniada: false
  });

  // Filtros - Método de Pesquisa
  const [metodoPesquisa, setMetodoPesquisa] = useState('codigoVenda');
  const [codigoPesquisa, setCodigoPesquisa] = useState('');

  // Filtros - Período
  const [usarPeriodo, setUsarPeriodo] = useState(false);
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFinal, setDataFinal] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Filtros - Dropdowns
  const [filtroConta, setFiltroConta] = useState('todas');
  const [filtroTipoPagto, setFiltroTipoPagto] = useState('todos');
  const [filtroSetor, setFiltroSetor] = useState('todos');

  // Filtros - Status
  const [statusContas, setStatusContas] = useState({
    naoPagas: true,
    pagas: false,
    emCobranca: false
  });

  // Ordenação
  const [ordenacao, setOrdenacao] = useState('codigo');

  const loadData = useCallback(async () => {
    if (!currentUser?.companyId) return;
    setIsLoading(true);
    try {
      const [contasData, paymentTypesData, sectorsData] = await Promise.all([
        AccountsReceivables.filter({ companyId: currentUser.companyId }, '-dueDate'),
        PaymentTypes.filter({ companyId: currentUser.companyId, active: true }),
        Sectors.filter({ companyId: currentUser.companyId, active: true })
      ]);
      setContas(contasData);
      setPaymentTypes(paymentTypesData);
      setSectors(sectorsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({ title: "Erro", description: "Não foi possível carregar as contas a receber.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (open) {
      loadData();
      setSelectedContas([]);
      setShowResults(false);
      setDisplayedContas([]);
    }
  }, [open, loadData]);

  // Função para aplicar filtros e exibir resultados
  const applyFiltersAndShow = () => {
    const filtered = contas.filter(c => {
      // Filtro de status
      const isVencida = c.status === 'pendente' && isBefore(parseISO(c.dueDate), startOfDay(new Date()));
      const isPaga = c.status === 'pago';
      const isEmCobranca = c.status === 'emCobranca';
      
      if (!statusContas.naoPagas && !isPaga && !isEmCobranca) return false;
      if (!statusContas.pagas && isPaga) return false;
      if (!statusContas.emCobranca && isEmCobranca) return false;

      // Filtro de período
      if (usarPeriodo) {
        const contaDate = parseISO(c.dueDate);
        const inicio = new Date(dataInicio + 'T00:00:00');
        const fim = new Date(dataFinal + 'T23:59:59');
        if (contaDate < inicio || contaDate > fim) return false;
      }

      // Filtro de conta
      if (filtroConta !== 'todas' && c.cashAccountId !== filtroConta) return false;

      // Filtro de tipo pagamento
      if (filtroTipoPagto !== 'todos' && c.paymentTypeId !== filtroTipoPagto) return false;

      // Filtro de setor
      if (filtroSetor !== 'todos' && c.sectorId !== filtroSetor) return false;

      return true;
    }).map(c => {
      const isVencida = c.status === 'pendente' && isBefore(parseISO(c.dueDate), startOfDay(new Date()));
      return { ...c, isVencida: isVencida };
    }).sort((a, b) => {
      if (ordenacao === 'codigo') return (a.id || '').localeCompare(b.id || '');
      if (ordenacao === 'data') return new Date(a.createdDate) - new Date(b.createdDate);
      if (ordenacao === 'vencimento') return new Date(a.dueDate) - new Date(b.dueDate);
      return 0;
    });

    setDisplayedContas(filtered);
    setShowResults(true);
  };

  // Aplicar filtros (usado internamente para cálculos)
  const filteredContas = showResults ? displayedContas : [];

  // Filtros de referência para cálculos internos (sem exibição)
  const allFilteredContas = contas.filter(c => {
    // Filtro de status
    const isVencida = c.status === 'pendente' && isBefore(parseISO(c.dueDate), startOfDay(new Date()));
    const isPaga = c.status === 'pago';
    const isEmCobranca = c.status === 'emCobranca';
    
    if (!statusContas.naoPagas && !isPaga && !isEmCobranca) return false;
    if (!statusContas.pagas && isPaga) return false;
    if (!statusContas.emCobranca && isEmCobranca) return false;
    if (statusContas.naoPagas && !isPaga && !isEmCobranca) { /* ok */ }

    // Filtro de período
    if (usarPeriodo) {
      const contaDate = parseISO(c.dueDate);
      const inicio = new Date(dataInicio + 'T00:00:00');
      const fim = new Date(dataFinal + 'T23:59:59');
      if (contaDate < inicio || contaDate > fim) return false;
    }

    // Filtro de código de pesquisa
    if (codigoPesquisa) {
      if (metodoPesquisa === 'codigoVenda' && !c.saleId?.includes(codigoPesquisa)) return false;
      if (metodoPesquisa === 'notaFiscal' && !c.nfeNumber?.includes(codigoPesquisa)) return false;
      if (metodoPesquisa === 'documento' && !c.personDocument?.includes(codigoPesquisa)) return false;
    }

    // Filtro de conta
    if (filtroConta !== 'todas' && c.cashAccountId !== filtroConta) return false;

    // Filtro de tipo pagamento
    if (filtroTipoPagto !== 'todos' && c.paymentTypeId !== filtroTipoPagto) return false;

    // Filtro de setor
    if (filtroSetor !== 'todos' && c.sectorId !== filtroSetor) return false;

    return true;
  }).map(c => {
    const isVencida = c.status === 'pendente' && isBefore(parseISO(c.dueDate), startOfDay(new Date()));
    return { ...c, isVencida: isVencida };
  });

  // Cálculos de totais
  const totais = {
    recebido: contas.filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.amount || 0), 0),
    aReceber: filteredContas.filter(c => c.status !== 'pago').reduce((sum, c) => sum + (c.amount || 0), 0),
    vencido: filteredContas.filter(c => c.isVencida).reduce((sum, c) => sum + (c.amount || 0), 0),
    aVencer: filteredContas.filter(c => !c.isVencida && c.status !== 'pago').reduce((sum, c) => sum + (c.amount || 0), 0),
    selecionado: selectedContas.reduce((sum, id) => {
      const conta = contas.find(c => c.id === id);
      return sum + (conta?.amount || 0);
    }, 0)
  };

  const toggleSelectConta = (contaId) => {
    setSelectedContas(prev => 
      prev.includes(contaId) 
        ? prev.filter(id => id !== contaId)
        : [...prev, contaId]
    );
  };

  const selectAll = () => {
    setSelectedContas(filteredContas.filter(c => c.status === 'pendente').map(c => c.id));
  };

  const deselectAll = () => {
    setSelectedContas([]);
    setSelectedContaForAction(null);
  };

  const handleRowClick = (conta) => {
    setSelectedContaForAction(conta);
  };

  // Verifica se há contas selecionadas (por checkbox ou por clique na linha)
  const hasSelection = selectedContas.length > 0 || selectedContaForAction;
  
  // Retorna as contas selecionadas (prioriza checkboxes, senão usa a linha clicada)
  const getSelectedContasForAction = () => {
    if (selectedContas.length > 0) {
      return selectedContas.map(id => contas.find(c => c.id === id)).filter(Boolean);
    }
    if (selectedContaForAction) {
      return [selectedContaForAction];
    }
    return [];
  };

  const handleExcluir = () => {
    if (!hasSelection) {
      toast({ title: "Atenção", description: "Selecione uma conta para excluir.", variant: "destructive" });
      return;
    }
    setIsDeleteConfirmOpen(true);
  };

  const confirmExcluir = async () => {
    const contasToDelete = getSelectedContasForAction();
    if (contasToDelete.length === 0) return;
    
    try {
      for (const conta of contasToDelete) {
        await AccountsReceivables.delete(conta.id);
      }
      toast({ title: "Sucesso", description: `${contasToDelete.length} conta(s) excluída(s) com sucesso!` });
      setIsDeleteConfirmOpen(false);
      setSelectedContaForAction(null);
      setSelectedContas([]);
      loadData();
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      toast({ title: "Erro", description: "Não foi possível excluir a(s) conta(s).", variant: "destructive" });
    }
  };

  const handleModificar = () => {
    if (!hasSelection) {
      toast({ title: "Atenção", description: "Selecione uma conta para modificar.", variant: "destructive" });
      return;
    }
    // TODO: Implementar edição
    toast({ title: "Info", description: "Funcionalidade de modificação em desenvolvimento." });
  };

  // Busca rápida pelo código (Enter, Tab ou botão raio)
  const handleQuickSearch = () => {
    if (!codigoPesquisa.trim()) {
      toast({ title: "Atenção", description: "Digite um código para pesquisar.", variant: "destructive" });
      return;
    }

    const results = contas.filter(c => {
      const searchTerm = codigoPesquisa.toLowerCase().trim();
      if (metodoPesquisa === 'codigoVenda') {
        return c.saleId?.toLowerCase().includes(searchTerm) || c.id?.toLowerCase().includes(searchTerm);
      }
      if (metodoPesquisa === 'notaFiscal') {
        return c.nfeNumber?.toLowerCase().includes(searchTerm);
      }
      if (metodoPesquisa === 'documento') {
        return c.personDocument?.toLowerCase().includes(searchTerm) || 
               c.personName?.toLowerCase().includes(searchTerm);
      }
      return false;
    });

    if (results.length === 0) {
      toast({ title: "Nenhum resultado", description: "Nenhuma conta encontrada com esse código.", variant: "destructive" });
      setSearchResults([]);
      setDisplayedContas([]);
    } else {
      setSearchResults(results);
      // Atualiza a lista principal com os resultados da busca rápida
      const resultsWithStatus = results.map(c => {
        const isVencida = c.status === 'pendente' && isBefore(parseISO(c.dueDate), startOfDay(new Date()));
        return { ...c, isVencida: isVencida };
      });
      setDisplayedContas(resultsWithStatus);
    }
    setShowResults(true);
  };

  // Abre modal de pesquisa
  const handleOpenSearchModal = () => {
    setIsSearchModalOpen(true);
  };

  // Seleciona conta do resultado de busca
  const handleSelectSearchResult = (conta) => {
    setSelectedContaForAction(conta);
    setSearchResults([]);
    setCodigoPesquisa('');
    setIsSearchModalOpen(false);
  };

  const handleKeyDownCodigo = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      handleQuickSearch();
    }
  };

  const handleImprimir = () => {
    const contasToPrint = getSelectedContasForAction();
    if (contasToPrint.length === 0) {
      toast({ title: "Atenção", description: "Selecione ao menos uma conta para imprimir.", variant: "destructive" });
      return;
    }

    // Criar conteúdo HTML para impressão
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Contas a Receber</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          h1 { text-align: center; margin-bottom: 5px; font-size: 18px; }
          .subtitle { text-align: center; margin-bottom: 20px; color: #666; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; font-size: 10px; }
          td { font-size: 10px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-row { background-color: #f9f9f9; font-weight: bold; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; }
          @media print {
            body { padding: 10px; }
            button { display: none; }
          }
          .btn-print { 
            display: block; 
            margin: 20px auto; 
            padding: 10px 30px; 
            font-size: 14px; 
            background: #1e3a8a; 
            color: white; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
          }
          .btn-print:hover { background: #1e40af; }
        </style>
      </head>
      <body>
        <h1>Relatório de Contas a Receber</h1>
        <p class="subtitle">Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Código</th>
              <th>Nota Fiscal</th>
              <th class="text-center">Parcela</th>
              <th>Dt Vencimento</th>
              <th class="text-right">Valor</th>
              <th>Dt Pagamento</th>
              <th class="text-right">Valor Pago</th>
              <th>Sacado</th>
            </tr>
          </thead>
          <tbody>
            ${contasToPrint.map(conta => `
              <tr>
                <td>${conta.createdDate ? format(parseISO(conta.createdDate), 'dd/MM/yyyy') : '-'}</td>
                <td>${conta.saleId?.slice(-6) || '-'}</td>
                <td>${conta.nfeNumber || '-'}</td>
                <td class="text-center">${conta.installmentNumber || '1'}</td>
                <td>${format(parseISO(conta.dueDate), 'dd/MM/yyyy')}</td>
                <td class="text-right">${formatCurrency(conta.amount)}</td>
                <td>${conta.paymentDate ? format(parseISO(conta.paymentDate), 'dd/MM/yyyy') : '-'}</td>
                <td class="text-right">${conta.status === 'pago' ? formatCurrency(conta.amount) : '-'}</td>
                <td>${conta.personName || '-'}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="5" class="text-right"><strong>TOTAL:</strong></td>
              <td class="text-right"><strong>${formatCurrency(contasToPrint.reduce((sum, c) => sum + (c.amount || 0), 0))}</strong></td>
              <td></td>
              <td class="text-right"><strong>${formatCurrency(contasToPrint.filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.amount || 0), 0))}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>
        
        <p class="footer">Total de registros: ${contasToPrint.length}</p>
        
        <button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>
      </body>
      </html>
    `;

    // Abrir nova janela com o relatório
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleBaixar = () => {
    if (selectedContas.length === 0) {
      toast({ title: "Atenção", description: "Selecione pelo menos uma conta para baixar.", variant: "destructive" });
      return;
    }
    setIsBaixaOpen(true);
  };

  const handleConfirmBaixa = async (cashAccountId, paidDate) => {
    if (!cashAccountId || !currentUser) {
      toast({ title: "Erro", description: "Dados incompletos para baixar as contas.", variant: "destructive" });
      return;
    }
    
    try {
      const receivingAccount = cashAccounts.find(acc => acc.id === cashAccountId);
      if (!receivingAccount) {
        toast({ title: "Erro", description: "Conta de caixa selecionada não encontrada.", variant: "destructive" });
        return;
      }

      // Buscar ou criar grupo financeiro
      let revenueGroup = await FinancialGroups.filter({ name: 'Receitas de Contas a Receber', companyId: currentUser.companyId });
      if (revenueGroup.length === 0) {
        revenueGroup = [await FinancialGroups.create({ 
          name: 'Receitas de Contas a Receber', 
          type: 'receita', 
          active: true,
          companyId: currentUser.companyId,
          companyName: currentUser.companyName,
          createdByName: currentUser.fullName
        })];
      }

      let totalBaixado = 0;

      // Processar cada conta selecionada
      for (const contaId of selectedContas) {
        const conta = contas.find(c => c.id === contaId);
        if (!conta || conta.status === 'pago') continue;

        // Criar movimento de caixa
        await CashMovements.create({
          cashAccountId: receivingAccount.id,
          cashAccountName: receivingAccount.name,
          type: 'receita',
          description: `Recebimento: ${conta.description}`,
          amount: conta.amount,
          personId: conta.personId,
          personName: conta.personName,
          movementDate: paidDate,
          groupId: revenueGroup[0].id,
          groupName: revenueGroup[0].name,
          companyId: currentUser.companyId,
          companyName: currentUser.companyName,
          createdByName: currentUser.fullName,
        });

        // Atualizar status da conta
        await AccountsReceivables.update(contaId, {
          status: 'pago',
          paymentDate: paidDate,
        });

        totalBaixado += conta.amount || 0;
      }

      // Atualizar saldo da conta
      const newBalance = (receivingAccount.balance || 0) + totalBaixado;
      await CashAccounts.update(receivingAccount.id, { balance: newBalance });

      toast({ title: "Sucesso", description: `${selectedContas.length} conta(s) baixada(s) com sucesso!` });
      setIsBaixaOpen(false);
      setSelectedContas([]);
      loadData();
      
      if (onPaymentComplete) {
        onPaymentComplete(cashAccountId);
      }
    } catch (error) {
      console.error("Erro ao baixar contas:", error);
      toast({ title: "Erro", description: `Não foi possível baixar as contas. ${error.message}`, variant: "destructive" });
    }
  };

  const getRowColor = (conta) => {
    if (conta.status === 'pago') return 'bg-green-50';
    if (conta.status === 'emCobranca') return 'bg-blue-50';
    if (conta.isVencida) return 'bg-red-50';
    return '';
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5" />
            Baixa Contas a Receber
          </DialogTitle>
        </DialogHeader>

        <BaixaDialog 
          isOpen={isBaixaOpen}
          onClose={() => setIsBaixaOpen(false)}
          onConfirm={handleConfirmBaixa}
          cashAccounts={cashAccounts}
          preSelectedAccountId={preSelectedAccountId}
          contas={selectedContas.map(id => contas.find(c => c.id === id)).filter(Boolean)}
          totalSelecionado={totais.selecionado}
        />

        <div className="flex-1 overflow-auto space-y-4">
          {/* SEÇÃO DE FILTROS */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 rounded-lg border">
            {/* Grupo Pesquisar */}
            <div className="col-span-3 space-y-3">
              <h4 className="text-xs font-semibold text-slate-700 uppercase">Pesquisar</h4>
              
              {/* Tipo Sacado */}
              <div className="space-y-1">
                <Label className="text-xs">Tipo sacado:</Label>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="cliente" 
                      checked={tipoSacado.cliente}
                      onCheckedChange={(v) => setTipoSacado(p => ({...p, cliente: v}))}
                    />
                    <label htmlFor="cliente" className="text-xs">Cliente</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="pontoVenda" 
                      checked={tipoSacado.pontoVenda}
                      onCheckedChange={(v) => setTipoSacado(p => ({...p, pontoVenda: v}))}
                    />
                    <label htmlFor="pontoVenda" className="text-xs">Ponto de Venda</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="conveniada" 
                      checked={tipoSacado.conveniada}
                      onCheckedChange={(v) => setTipoSacado(p => ({...p, conveniada: v}))}
                    />
                    <label htmlFor="conveniada" className="text-xs">Convênio</label>
                  </div>
                </div>
              </div>

              {/* Método de Pesquisa */}
              <div className="space-y-1">
                <RadioGroup value={metodoPesquisa} onValueChange={setMetodoPesquisa} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="codigoVenda" id="codigoVenda" />
                    <label htmlFor="codigoVenda" className="text-xs">Código da Venda</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="notaFiscal" id="notaFiscal" />
                    <label htmlFor="notaFiscal" className="text-xs">Número Nota Fiscal</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="documento" id="documento" />
                    <label htmlFor="documento" className="text-xs">Documento</label>
                  </div>
                </RadioGroup>
              </div>

              {/* Código */}
              <div className="flex gap-1 items-center">
                <Label className="text-xs whitespace-nowrap">Código:</Label>
                <Input 
                  value={codigoPesquisa}
                  onChange={(e) => setCodigoPesquisa(e.target.value)}
                  onKeyDown={handleKeyDownCodigo}
                  className="h-7 text-xs"
                  placeholder="Digite..."
                />
              </div>

              {/* Resultados da busca rápida */}
              {searchResults.length > 0 && (
                <div className="border rounded bg-white shadow-lg max-h-32 overflow-auto">
                  {searchResults.map(conta => (
                    <div 
                      key={conta.id}
                      className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-0 text-xs"
                      onClick={() => handleSelectSearchResult(conta)}
                    >
                      <div className="font-medium">{conta.personName}</div>
                      <div className="text-slate-500">
                        {formatCurrency(conta.amount)} - Venc: {format(parseISO(conta.dueDate), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Período */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="usarPeriodo" 
                    checked={usarPeriodo}
                    onCheckedChange={setUsarPeriodo}
                  />
                  <label htmlFor="usarPeriodo" className="text-xs font-medium">Período</label>
                </div>
                <div className={`grid grid-cols-2 gap-2 ${!usarPeriodo ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div>
                    <Label className="text-xs">Início:</Label>
                    <Input 
                      type="date" 
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Final:</Label>
                    <Input 
                      type="date" 
                      value={dataFinal}
                      onChange={(e) => setDataFinal(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Grupo Filtros */}
            <div className="col-span-3 space-y-3">
              <h4 className="text-xs font-semibold text-slate-700 uppercase">Filtros</h4>
              
              <div>
                <Label className="text-xs">Conta:</Label>
                <Select value={filtroConta} onValueChange={setFiltroConta}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {cashAccounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Tipo Pagto.:</Label>
                <Select value={filtroTipoPagto} onValueChange={setFiltroTipoPagto}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {paymentTypes.map(pt => (
                      <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Setor:</Label>
                <Select value={filtroSetor} onValueChange={setFiltroSetor}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {sectors.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <Label className="text-xs">Status:</Label>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="naoPagas" 
                      checked={statusContas.naoPagas}
                      onCheckedChange={(v) => setStatusContas(p => ({...p, naoPagas: v}))}
                    />
                    <label htmlFor="naoPagas" className="text-xs">Não Pagas</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="pagas" 
                      checked={statusContas.pagas}
                      onCheckedChange={(v) => setStatusContas(p => ({...p, pagas: v}))}
                    />
                    <label htmlFor="pagas" className="text-xs">Pagas</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="emCobranca" 
                      checked={statusContas.emCobranca}
                      onCheckedChange={(v) => setStatusContas(p => ({...p, emCobranca: v}))}
                    />
                    <label htmlFor="emCobranca" className="text-xs">Em Cobrança</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Grupo Ordenação */}
            <div className="col-span-2 space-y-3">
              <h4 className="text-xs font-semibold text-slate-700 uppercase">Ordenação</h4>
              <RadioGroup value={ordenacao} onValueChange={setOrdenacao} className="space-y-1">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="codigo" id="ordCodigo" />
                  <label htmlFor="ordCodigo" className="text-xs">Código</label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="data" id="ordData" />
                  <label htmlFor="ordData" className="text-xs">Data</label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="vencimento" id="ordVencimento" />
                  <label htmlFor="ordVencimento" className="text-xs">Vencimento</label>
                </div>
              </RadioGroup>
            </div>

            {/* Legenda */}
            <div className="col-span-2 space-y-3">
              <h4 className="text-xs font-semibold text-slate-700 uppercase">Legenda</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-400 rounded"></div>
                  <span className="text-xs">Conta vencida</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-xs">Conta paga</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-400 rounded"></div>
                  <span className="text-xs">Em cobrança</span>
                </div>
              </div>
            </div>

            {/* Botão Pesquisar */}
            <div className="col-span-2 flex items-end">
              <Button onClick={applyFiltersAndShow} className="w-full h-8 text-xs gap-1 bg-slate-800 hover:bg-slate-900">
                <Search className="w-3 h-3" /> Pesquisar
              </Button>
            </div>
          </div>

          {/* GRID DE CONTAS */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[300px] overflow-auto">
              {!showResults ? (
                <div className="flex items-center justify-center h-48 text-slate-500 text-sm p-8">
                  <div className="text-center">
                    <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Selecione os filtros e clique em <strong>Pesquisar</strong></p>
                    <p className="text-xs mt-1">ou digite um código e clique no ⚡</p>
                  </div>
                </div>
              ) : (
              <Table>
                <TableHeader className="bg-slate-100 sticky top-0">
                  <TableRow>
                    <TableHead className="w-8 text-xs">S</TableHead>
                    <TableHead className="text-xs w-20">Data</TableHead>
                    <TableHead className="text-xs w-20">Código</TableHead>
                    <TableHead className="text-xs w-20">N Fiscal</TableHead>
                    <TableHead className="text-xs w-16">Parc</TableHead>
                    <TableHead className="text-xs w-24">Dt Vencto</TableHead>
                    <TableHead className="text-xs w-24 text-right">Valor</TableHead>
                    <TableHead className="text-xs w-24">Dt Pagto</TableHead>
                    <TableHead className="text-xs w-24 text-right">Vl Pago</TableHead>
                    <TableHead className="text-xs w-20">Situação</TableHead>
                    <TableHead className="text-xs">Sacado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">Carregando...</TableCell>
                    </TableRow>
                  ) : filteredContas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-slate-500">
                        Nenhuma conta encontrada com os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContas.map(conta => (
                      <TableRow 
                        key={conta.id} 
                        className={`${getRowColor(conta)} hover:bg-slate-100 cursor-pointer ${selectedContaForAction?.id === conta.id ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => handleRowClick(conta)}
                      >
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedContas.includes(conta.id)}
                            onCheckedChange={() => toggleSelectConta(conta.id)}
                            disabled={conta.status === 'pago'}
                          />
                        </TableCell>
                        <TableCell className="text-xs">{conta.createdDate ? format(parseISO(conta.createdDate), 'dd/MM/yy') : '-'}</TableCell>
                        <TableCell className="text-xs font-mono">{conta.saleId?.slice(-6) || '-'}</TableCell>
                        <TableCell className="text-xs">{conta.nfeNumber || '-'}</TableCell>
                        <TableCell className="text-xs text-center">{conta.installmentNumber || '1'}</TableCell>
                        <TableCell className="text-xs">{format(parseISO(conta.dueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatCurrency(conta.amount)}</TableCell>
                        <TableCell className="text-xs">{conta.paymentDate ? format(parseISO(conta.paymentDate), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{conta.status === 'pago' ? formatCurrency(conta.amount) : '-'}</TableCell>
                        <TableCell className="text-xs">
                          {conta.status === 'pago' ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">Pago</Badge>
                          ) : conta.isVencida ? (
                            <Badge className="bg-red-100 text-red-800 text-xs">Vencido</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Aberto</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{conta.personName}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              )}
            </div>
          </div>

          {/* TOTAIS */}
          <div className="grid grid-cols-5 gap-4 p-3 bg-slate-50 rounded-lg border">
            <div className="text-center">
              <p className="text-xs text-slate-600">Recebido:</p>
              <p className="text-sm font-bold text-green-600">{formatCurrency(totais.recebido)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600">A receber:</p>
              <p className="text-sm font-bold text-slate-700">{formatCurrency(totais.aReceber)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600">Total Vencido:</p>
              <p className="text-sm font-bold text-red-600">{formatCurrency(totais.vencido)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600">Total a Vencer:</p>
              <p className="text-sm font-bold text-blue-600">{formatCurrency(totais.aVencer)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600">Total Selecionado:</p>
              <p className="text-sm font-bold text-green-700">{formatCurrency(totais.selecionado)}</p>
            </div>
          </div>
        </div>

        {/* BARRA DE AÇÕES */}
        <div className="bg-slate-100 -mx-6 -mb-6 px-4 py-3 mt-4 border-t">
          <div className="flex flex-wrap gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs gap-1" 
              disabled={!hasSelection}
              onClick={handleModificar}
            >
              <Edit className="w-3 h-3" /> Modificar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs gap-1" 
              disabled={!hasSelection}
              onClick={handleExcluir}
            >
              <Trash2 className="w-3 h-3" /> Excluir
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleOpenSearchModal}>
              <Search className="w-3 h-3" /> Pesquisar
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => onOpenChange(false)}>
              <LogOut className="w-3 h-3" /> Sair
            </Button>

            <div className="w-px h-6 bg-slate-300 mx-1 self-center" />

            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs gap-1" 
              disabled={!hasSelection}
              onClick={handleImprimir}
            >
              <Printer className="w-3 h-3" /> Imprimir
            </Button>

            <div className="w-px h-6 bg-slate-300 mx-1 self-center" />

            <Button 
              size="sm" 
              className="h-8 text-xs gap-1 bg-green-600 hover:bg-green-700"
              onClick={handleBaixar}
              disabled={selectedContas.length === 0}
            >
              <DollarSign className="w-3 h-3" /> Baixar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs gap-1"
              disabled={selectedContas.length === 0}
              onClick={() => setIsRenegociacaoOpen(true)}
            >
              <RefreshCw className="w-3 h-3" /> Renegocia
            </Button>

            <div className="w-px h-6 bg-slate-300 mx-1 self-center" />

            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={selectAll}>
              <CheckSquare className="w-3 h-3" /> Selecionar
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={deselectAll}>
              <Square className="w-3 h-3" /> Desmarcar
            </Button>

            <div className="w-px h-6 bg-slate-300 mx-1 self-center" />

            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" disabled>
              <FileText className="w-3 h-3" /> Boleto
            </Button>
          </div>
        </div>

        {/* Modal de Renegociação */}
        <RenegociacaoModal
          open={isRenegociacaoOpen}
          onOpenChange={setIsRenegociacaoOpen}
          currentUser={currentUser}
          sectors={sectors}
          cashAccounts={cashAccounts}
          contasSelecionadas={selectedContas.map(id => contas.find(c => c.id === id)).filter(Boolean)}
          onRenegociacaoComplete={() => {
            loadData();
            setSelectedContas([]);
            applyFiltersAndShow();
          }}
        />

        {/* Modal de Pesquisa */}
        <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Pesquisar Contas a Receber</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Buscar por {metodoPesquisa === 'codigoVenda' ? 'Código da Venda' : metodoPesquisa === 'notaFiscal' ? 'Nota Fiscal' : 'Documento/Nome'}</Label>
                  <Input 
                    placeholder="Digite para buscar..."
                    className="h-8"
                    autoFocus
                    onChange={(e) => {
                      const term = e.target.value.toLowerCase();
                      if (!term) {
                        setSearchResults(contas);
                        return;
                      }
                      const results = contas.filter(c => {
                        if (metodoPesquisa === 'codigoVenda') {
                          return c.saleId?.toLowerCase().includes(term) || c.id?.toLowerCase().includes(term);
                        }
                        if (metodoPesquisa === 'notaFiscal') {
                          return c.nfeNumber?.toLowerCase().includes(term);
                        }
                        return c.personDocument?.toLowerCase().includes(term) || 
                               c.personName?.toLowerCase().includes(term);
                      });
                      setSearchResults(results);
                    }}
                  />
                </div>
              </div>
              
              <div className="max-h-80 overflow-auto border rounded">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs">Código</TableHead>
                      <TableHead className="text-xs">Sacado</TableHead>
                      <TableHead className="text-xs">Vencimento</TableHead>
                      <TableHead className="text-xs text-right">Valor</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(searchResults.length > 0 ? searchResults : contas).map(conta => (
                      <TableRow 
                        key={conta.id} 
                        className="cursor-pointer hover:bg-blue-50"
                        onDoubleClick={() => handleSelectSearchResult(conta)}
                      >
                        <TableCell className="text-xs font-mono">{conta.saleId?.slice(-6) || conta.id?.slice(-6)}</TableCell>
                        <TableCell className="text-xs">{conta.personName}</TableCell>
                        <TableCell className="text-xs">{format(parseISO(conta.dueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatCurrency(conta.amount)}</TableCell>
                        <TableCell className="text-xs">
                          {conta.status === 'pago' ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">Pago</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Aberto</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-slate-500">Dê duplo clique para selecionar uma conta</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSearchModalOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação de Exclusão */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center text-slate-600">
                Tem certeza que deseja excluir {getSelectedContasForAction().length > 1 ? 'estas contas a receber' : 'esta conta a receber'}?
              </p>
              {getSelectedContasForAction().length > 0 && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm space-y-2 max-h-40 overflow-auto">
                  {getSelectedContasForAction().map(conta => (
                    <div key={conta.id} className="border-b pb-2 last:border-0">
                      <p><strong>Sacado:</strong> {conta.personName}</p>
                      <p><strong>Valor:</strong> {formatCurrency(conta.amount)}</p>
                      <p><strong>Vencimento:</strong> {format(parseISO(conta.dueDate), 'dd/MM/yyyy')}</p>
                    </div>
                  ))}
                  {getSelectedContasForAction().length > 1 && (
                    <p className="font-bold pt-2">Total: {formatCurrency(getSelectedContasForAction().reduce((sum, c) => sum + (c.amount || 0), 0))}</p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                Não
              </Button>
              <Button variant="destructive" onClick={confirmExcluir}>
                Sim, Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}