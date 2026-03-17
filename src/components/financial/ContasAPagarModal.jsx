import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  DollarSign, Search, LogOut, Printer, Edit, Trash2, CheckSquare, X, ArrowRight
} from "lucide-react";
import { Person } from "@/entities/Person";
import { ContasAPagar } from "@/entities/ContasAPagar";
import { CashAccount } from "@/entities/CashAccount";
import { CashMovement } from "@/entities/CashMovement";
import { SectorMaster } from "@/entities/SectorMaster";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, isBefore, startOfDay, differenceInDays } from "date-fns";

// Dialog de Baixa (Pagamento)
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
          <DialogTitle>Baixar Contas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p><strong>Quantidade:</strong> {contas.length} conta(s) selecionada(s)</p>
          <p><strong>Valor Total:</strong> <span className="text-red-600 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSelecionado)}</span></p>
          <div>
            <Label>Data do Pagamento</Label>
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div>
            <Label>Conta/Caixa de Origem *</Label>
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
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ContasAPagarModal({ 
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
  const [sectorMasters, setSectorMasters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBaixaOpen, setIsBaixaOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedContas, setSelectedContas] = useState([]);
  const [selectedContaForAction, setSelectedContaForAction] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  // Modais de pesquisa
  const [showFornecedorSearch, setShowFornecedorSearch] = useState(false);
  const [showNFSearch, setShowNFSearch] = useState(false);
  const [fornecedorSearchTerm, setFornecedorSearchTerm] = useState('');
  const [nfSearchTerm, setNfSearchTerm] = useState('');

  // Controle de foco para saber qual campo está ativo
  const [activeSearchField, setActiveSearchField] = useState(null); // 'fornecedor' | 'nf' | null

  // Pesquisa - Fornecedor
  const [fornecedorPesquisa, setFornecedorPesquisa] = useState('');
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);

  // Filtros
  const [filtroConta, setFiltroConta] = useState('todas');
  const [filtroSectorMaster, setFiltroSectorMaster] = useState('todos');
  const [filtroNFe, setFiltroNFe] = useState('');
  const [statusContas, setStatusContas] = useState({
    nao_pagas: true,
    pagas: false
  });

  // Ordenação
  const [ordenacao, setOrdenacao] = useState('vencimento');

  const loadData = useCallback(async () => {
    if (!currentUser?.company_id) return;
    setIsLoading(true);
    try {
      const [contasData, sectorMastersData, suppliersData] = await Promise.all([
        ContasAPagar.filter({ company_id: currentUser.company_id }, '-due_date'),
        SectorMaster.filter({ company_id: currentUser.company_id }),
        Person.filter({ company_id: currentUser.company_id, type: 'fornecedor' })
      ]);
      setContas(contasData);
      setSectorMasters(sectorMastersData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({ title: "Erro", description: "Não foi possível carregar as contas a pagar.", variant: "destructive" });
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
    const today = startOfDay(new Date());
    
    const filtered = contas.filter(c => {
      const dueDate = parseISO(c.due_date);
      const isVencida = c.status === 'aberto' && isBefore(dueDate, today);
      const isPaga = c.status === 'pago';
      
      // Filtro de status
      if (!statusContas.nao_pagas && !isPaga) return false;
      if (!statusContas.pagas && isPaga) return false;

      // Filtro de fornecedor
      if (fornecedorPesquisa) {
        const term = fornecedorPesquisa.toLowerCase();
        if (!c.supplier_name?.toLowerCase().includes(term)) return false;
      }

      // Filtro de conta
      if (filtroConta !== 'todas' && c.cash_account_id !== filtroConta) return false;

      // Filtro de setor master
      if (filtroSectorMaster !== 'todos' && c.sector_master_id !== filtroSectorMaster) return false;

      // Filtro de NFe
      if (filtroNFe) {
        if (!c.nfe_number?.toLowerCase().includes(filtroNFe.toLowerCase())) return false;
      }

      return true;
    }).map(c => {
      const dueDate = parseISO(c.due_date);
      const today = startOfDay(new Date());
      const isVencida = c.status === 'aberto' && isBefore(dueDate, today);
      const diasParaVencer = differenceInDays(dueDate, today);
      const isVenceHoje = diasParaVencer === 0 && c.status === 'aberto';
      const isVenceEm3Dias = diasParaVencer > 0 && diasParaVencer <= 3 && c.status === 'aberto';
      
      return { ...c, is_vencida: isVencida, is_vence_hoje: isVenceHoje, is_vence_em_3_dias: isVenceEm3Dias };
    }).sort((a, b) => {
      if (ordenacao === 'vencimento') return new Date(a.due_date) - new Date(b.due_date);
      if (ordenacao === 'codigo') return (a.id || '').localeCompare(b.id || '');
      if (ordenacao === 'fornecedor') return (a.supplier_name || '').localeCompare(b.supplier_name || '');
      if (ordenacao === 'valor') return (b.amount || 0) - (a.amount || 0);
      return 0;
    });

    setDisplayedContas(filtered);
    setShowResults(true);
  };

  const filteredContas = showResults ? displayedContas : [];

  // Cálculos de totais
  const totais = {
    pago: contas.filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.amount || 0), 0),
    aPagar: filteredContas.filter(c => c.status !== 'pago').reduce((sum, c) => sum + (c.amount || 0), 0),
    vencido: filteredContas.filter(c => c.is_vencida).reduce((sum, c) => sum + (c.amount || 0), 0),
    aVencer: filteredContas.filter(c => !c.is_vencida && c.status !== 'pago').reduce((sum, c) => sum + (c.amount || 0), 0),
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
    setSelectedContas(filteredContas.filter(c => c.status === 'aberto').map(c => c.id));
  };

  const handleRowClick = (conta) => {
    setSelectedContaForAction(conta);
  };

  const hasSelection = selectedContas.length > 0 || selectedContaForAction;

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
      let deletedCount = 0;
      let notFoundCount = 0;
      
      for (const conta of contasToDelete) {
        try {
          await ContasAPagar.delete(conta.id);
          deletedCount++;
        } catch (err) {
          if (err.message?.includes('not found') || err.response?.status === 404) {
            notFoundCount++;
          } else {
            throw err;
          }
        }
      }
      
      if (deletedCount > 0) {
        toast({ title: "Sucesso", description: `${deletedCount} conta(s) excluída(s) com sucesso!` });
      }
      if (notFoundCount > 0) {
        toast({ title: "Aviso", description: `${notFoundCount} conta(s) já havia(m) sido excluída(s).`, variant: "default" });
      }
      
      setIsDeleteConfirmOpen(false);
      setSelectedContaForAction(null);
      setSelectedContas([]);
      loadData();
      if (showResults) applyFiltersAndShow();
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
    toast({ title: "Info", description: "Funcionalidade de modificação em desenvolvimento." });
  };

  const handleBaixar = () => {
    if (selectedContas.length === 0) {
      toast({ title: "Atenção", description: "Selecione pelo menos uma conta para baixar.", variant: "destructive" });
      return;
    }
    setIsBaixaOpen(true);
  };

  const handleConfirmPagamento = async (cashAccountId, paidDate) => {
    if (!cashAccountId || !currentUser) {
      toast({ title: "Erro", description: "Dados incompletos para pagar as contas.", variant: "destructive" });
      return;
    }
    
    try {
      const payingAccount = cashAccounts.find(acc => acc.id === cashAccountId);
      if (!payingAccount) {
        toast({ title: "Erro", description: "Conta de caixa selecionada não encontrada.", variant: "destructive" });
        return;
      }

      let totalPago = 0;

      for (const contaId of selectedContas) {
        const conta = contas.find(c => c.id === contaId);
        if (!conta || conta.status === 'pago') continue;

        // Criar movimento de caixa (despesa)
        await CashMovement.create({
          cash_account_id: payingAccount.id,
          cash_account_name: payingAccount.name,
          type: 'despesa',
          description: `Pagamento: ${conta.description}`,
          amount: conta.amount,
          person_id: conta.supplier_id,
          person_name: conta.supplier_name,
          movement_date: paidDate,
          company_id: currentUser.company_id,
          company_name: currentUser.company_name,
          created_by_name: currentUser.full_name,
        });

        // Atualizar status da conta
        await ContasAPagar.update(contaId, {
          status: 'pago',
          payment_date: paidDate,
        });

        totalPago += conta.amount || 0;
      }

      // Atualizar saldo da conta
      const newBalance = (payingAccount.balance || 0) - totalPago;
      await CashAccount.update(payingAccount.id, { balance: newBalance });

      toast({ title: "Sucesso", description: `${selectedContas.length} conta(s) paga(s) com sucesso!` });
      setIsBaixaOpen(false);
      setSelectedContas([]);
      await loadData();
      // Reaplicar filtros para atualizar a tabela com as novas cores
      setTimeout(() => {
        if (showResults) applyFiltersAndShow();
      }, 100);

      if (onPaymentComplete) {
        onPaymentComplete(cashAccountId);
      }
      } catch (error) {
      console.error("Erro ao pagar contas:", error);
      toast({ title: "Erro", description: `Não foi possível pagar as contas. ${error.message}`, variant: "destructive" });
    }
  };

  const handleImprimir = () => {
    const contasToPrint = getSelectedContasForAction();
    if (contasToPrint.length === 0) {
      toast({ title: "Atenção", description: "Selecione ao menos uma conta para imprimir.", variant: "destructive" });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Contas a Pagar</title>
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
          .total-row { background-color: #f9f9f9; font-weight: bold; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; }
          @media print { body { padding: 10px; } button { display: none; } }
          .btn-print { display: block; margin: 20px auto; padding: 10px 30px; font-size: 14px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Relatório de Contas a Pagar</h1>
        <p class="subtitle">Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Código</th>
              <th>Nota Fiscal</th>
              <th>Dt Vencimento</th>
              <th class="text-right">Valor</th>
              <th>Dt Pagamento</th>
              <th class="text-right">Valor Pago</th>
              <th>Fornecedor</th>
            </tr>
          </thead>
          <tbody>
            ${contasToPrint.map(conta => `
              <tr>
                <td>${conta.created_date ? format(parseISO(conta.created_date), 'dd/MM/yyyy') : '-'}</td>
                <td>${conta.purchase_id?.slice(-6) || '-'}</td>
                <td>${conta.nfe_number || '-'}</td>
                <td>${format(parseISO(conta.due_date), 'dd/MM/yyyy')}</td>
                <td class="text-right">${formatCurrency(conta.amount)}</td>
                <td>${conta.payment_date ? format(parseISO(conta.payment_date), 'dd/MM/yyyy') : '-'}</td>
                <td class="text-right">${conta.status === 'pago' ? formatCurrency(conta.amount) : '-'}</td>
                <td>${conta.supplier_name || '-'}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="4" class="text-right"><strong>TOTAL:</strong></td>
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

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (e.key === 'Enter') e.preventDefault();
      applyFiltersAndShow();
    }
  };

  const handlePesquisarClick = () => {
    // Se o campo de fornecedor está ativo, abre modal de fornecedor
    if (activeSearchField === 'fornecedor') {
      setShowFornecedorSearch(true);
      return;
    }
    // Se o campo de NF está ativo, abre modal de NF
    if (activeSearchField === 'nf') {
      setShowNFSearch(true);
      return;
    }
    // Senão, aplica os filtros
    applyFiltersAndShow();
  };

  const getRowColor = (conta) => {
    if (conta.status === 'pago') return 'bg-green-50';
    if (conta.is_vence_hoje) return 'bg-yellow-50';
    if (conta.is_vence_em_3_dias) return 'bg-orange-50';
    if (conta.is_vencida) return 'bg-red-50';
    return '';
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5" />
            Contas a Pagar
          </DialogTitle>
        </DialogHeader>

        <BaixaDialog 
          isOpen={isBaixaOpen}
          onClose={() => setIsBaixaOpen(false)}
          onConfirm={handleConfirmPagamento}
          cashAccounts={cashAccounts}
          preSelectedAccountId={preSelectedAccountId}
          contas={selectedContas.map(id => contas.find(c => c.id === id)).filter(Boolean)}
          totalSelecionado={totais.selecionado}
        />

        <div className="flex-1 overflow-auto space-y-4">
          {/* SEÇÃO DE FILTROS - 4 BLOCOS */}
          <div className="grid grid-cols-12 gap-3">
            
            {/* 1. PESQUISA */}
            <div className="col-span-3">
              <Card className="bg-white border-slate-300 h-full">
                <CardContent className="p-3">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Pesquisa</h4>
                  <div>
                    <Label className="text-xs">Fornecedor:</Label>
                    <div className="flex gap-1">
                      <div className="flex-1 relative">
                        <Input 
                          value={fornecedorSelecionado?.name || fornecedorPesquisa}
                          onChange={(e) => {
                            setFornecedorPesquisa(e.target.value);
                            setFornecedorSelecionado(null);
                          }}
                          onKeyDown={handleKeyDown}
                          onFocus={() => setActiveSearchField('fornecedor')}
                          onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                          className={`h-7 text-xs pr-6 ${activeSearchField === 'fornecedor' ? 'ring-2 ring-blue-500' : ''}`}
                          placeholder="Digite o nome ou use Pesquisar..."
                        />
                        {(fornecedorSelecionado || fornecedorPesquisa) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setFornecedorSelecionado(null);
                              setFornecedorPesquisa('');
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Deixe em branco para todos</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 2. FILTROS */}
            <div className="col-span-4">
              <Card className="bg-white border-slate-300 h-full">
                <CardContent className="p-3">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Filtros</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
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
                        <Label className="text-xs">Setor Master:</Label>
                        <Select value={filtroSectorMaster} onValueChange={setFiltroSectorMaster}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            {sectorMasters.map(sm => (
                              <SelectItem key={sm.id} value={sm.id}>{sm.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="nao_pagas_modal" 
                          checked={statusContas.nao_pagas}
                          onCheckedChange={(v) => setStatusContas(p => ({...p, nao_pagas: v}))}
                        />
                        <label htmlFor="nao_pagas_modal" className="text-xs">Não Pagas</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="pagas_modal" 
                          checked={statusContas.pagas}
                          onCheckedChange={(v) => setStatusContas(p => ({...p, pagas: v}))}
                        />
                        <label htmlFor="pagas_modal" className="text-xs">Pagas</label>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Número da NF:</Label>
                      <div className="flex gap-1">
                        <div className="flex-1 relative">
                          <Input 
                            value={filtroNFe}
                            onChange={(e) => setFiltroNFe(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setActiveSearchField('nf')}
                            onBlur={() => setTimeout(() => setActiveSearchField(null), 200)}
                            className={`h-7 text-xs pr-6 ${activeSearchField === 'nf' ? 'ring-2 ring-blue-500' : ''}`}
                            placeholder="Digite o número ou use Pesquisar..."
                          />
                          {filtroNFe && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setFiltroNFe('');
                              }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 3. LEGENDA */}
            <div className="col-span-2">
              <Card className="bg-white border-slate-300 h-full">
                <CardContent className="p-3">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Legenda</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded"></div>
                      <span className="text-xs">Conta vencida</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded"></div>
                      <span className="text-xs">Conta paga</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                      <span className="text-xs">Vence hoje</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-400 rounded"></div>
                      <span className="text-xs">Vence em 3 dias</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 4. ORDENAÇÃO */}
            <div className="col-span-3">
              <Card className="bg-white border-slate-300 h-full">
                <CardContent className="p-3">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Ordenação</h4>
                  <RadioGroup value={ordenacao} onValueChange={setOrdenacao} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="vencimento" id="ord_vencimento_modal" />
                      <label htmlFor="ord_vencimento_modal" className="text-xs">Vencimento</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="codigo" id="ord_codigo_modal" />
                      <label htmlFor="ord_codigo_modal" className="text-xs">Código</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="fornecedor" id="ord_fornecedor_modal" />
                      <label htmlFor="ord_fornecedor_modal" className="text-xs">Fornecedor</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="valor" id="ord_valor_modal" />
                      <label htmlFor="ord_valor_modal" className="text-xs">Valor</label>
                    </div>
                  </RadioGroup>
                  
                  <Button 
                    className="w-full mt-3 bg-black hover:bg-gray-800 text-white text-xs h-8 gap-1"
                    onClick={applyFiltersAndShow}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* GRID DE CONTAS */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[280px] overflow-auto">
              {!showResults ? (
                <div className="flex items-center justify-center h-40 text-slate-500 text-sm p-8">
                  <div className="text-center">
                    <Search className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p>Clique em <strong>Pesquisar</strong> para exibir as contas</p>
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
                    <TableHead className="text-xs w-20">Tp Pagto</TableHead>
                    <TableHead className="text-xs w-12">Parc</TableHead>
                    <TableHead className="text-xs w-24">Dt Vencto</TableHead>
                    <TableHead className="text-xs w-24 text-right">Valor</TableHead>
                    <TableHead className="text-xs w-24">Dt Pagto</TableHead>
                    <TableHead className="text-xs w-24 text-right">Vl Pago</TableHead>
                    <TableHead className="text-xs w-20">Situação</TableHead>
                    <TableHead className="text-xs">Fornecedor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8">Carregando...</TableCell>
                    </TableRow>
                  ) : filteredContas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8 text-slate-500">
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
                        <TableCell className="text-xs">{conta.created_date ? format(parseISO(conta.created_date), 'dd/MM/yy') : '-'}</TableCell>
                        <TableCell className="text-xs font-mono">{conta.purchase_id?.slice(-6) || conta.id?.slice(-6)}</TableCell>
                        <TableCell className="text-xs">{conta.nfe_number || '-'}</TableCell>
                        <TableCell className="text-xs">{conta.payment_type_name || '-'}</TableCell>
                        <TableCell className="text-xs text-center">{conta.installment_number || '1'}</TableCell>
                        <TableCell className="text-xs">{format(parseISO(conta.due_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatCurrency(conta.amount)}</TableCell>
                        <TableCell className="text-xs">{conta.payment_date ? format(parseISO(conta.payment_date), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{conta.status === 'pago' ? formatCurrency(conta.amount) : '-'}</TableCell>
                        <TableCell className="text-xs">
                          {conta.status === 'pago' ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">Pago</Badge>
                          ) : conta.is_vencida ? (
                            <Badge className="bg-red-100 text-red-800 text-xs">Vencido</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Aberto</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{conta.supplier_name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              )}
            </div>
          </div>

          {/* TOTAIS */}
          <div className="grid grid-cols-5 gap-3 p-2 bg-slate-50 rounded-lg border">
            <div className="text-center">
              <p className="text-xs text-slate-600">Pago:</p>
              <p className="text-sm font-bold text-green-600">{formatCurrency(totais.pago)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600">A pagar:</p>
              <p className="text-sm font-bold text-blue-600">{formatCurrency(totais.aPagar)}</p>
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
        <div className="bg-slate-100 -mx-6 -mb-6 px-4 py-2 mt-3 border-t">
          <div className="flex flex-wrap gap-1 items-center">
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
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handlePesquisarClick}>
              <Search className="w-3 h-3" /> Pesquisar
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => onOpenChange(false)}>
              <LogOut className="w-3 h-3" /> Sair
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs gap-1" 
              disabled={!hasSelection}
              onClick={handleImprimir}
            >
              <Printer className="w-3 h-3" /> Imprimir
            </Button>
            <Button 
              size="sm" 
              className="h-8 text-xs gap-1 bg-green-600 hover:bg-green-700"
              onClick={handleBaixar}
              disabled={selectedContas.length === 0}
            >
              <DollarSign className="w-3 h-3" /> Baixar
            </Button>

            <div className="w-px h-6 bg-slate-400 mx-1" />

            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={selectAll}>
              <CheckSquare className="w-3 h-3" /> Selecionar
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => { setSelectedContas([]); setSelectedContaForAction(null); }}>
              <X className="w-3 h-3" /> Desmarcar
            </Button>
          </div>
        </div>

        {/* Modal de Pesquisa de Fornecedor */}
        <Dialog open={showFornecedorSearch} onOpenChange={setShowFornecedorSearch}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Pesquisar Fornecedor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input 
                placeholder="Digite o nome do fornecedor..."
                value={fornecedorSearchTerm}
                onChange={(e) => setFornecedorSearchTerm(e.target.value)}
                className="h-9"
                autoFocus
              />
              <div className="max-h-80 overflow-auto border rounded">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs">Código</TableHead>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Documento</TableHead>
                      <TableHead className="text-xs">Telefone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers
                      .filter(s => {
                        if (!fornecedorSearchTerm) return true;
                        const term = fornecedorSearchTerm.toLowerCase();
                        return s.name?.toLowerCase().includes(term) || 
                               s.document?.toLowerCase().includes(term);
                      })
                      .map(s => (
                        <TableRow 
                          key={s.id} 
                          className="cursor-pointer hover:bg-blue-50"
                          onDoubleClick={() => {
                            setFornecedorSelecionado(s);
                            setFornecedorPesquisa(s.name);
                            setShowFornecedorSearch(false);
                            setFornecedorSearchTerm('');
                            setTimeout(() => applyFiltersAndShow(), 100);
                          }}
                        >
                          <TableCell className="text-xs font-mono">{s.person_number || s.id?.slice(-6)}</TableCell>
                          <TableCell className="text-xs">{s.name}</TableCell>
                          <TableCell className="text-xs">{s.document || '-'}</TableCell>
                          <TableCell className="text-xs">{s.phone?.[0] || '-'}</TableCell>
                        </TableRow>
                      ))}
                    {suppliers.filter(s => {
                      if (!fornecedorSearchTerm) return true;
                      const term = fornecedorSearchTerm.toLowerCase();
                      return s.name?.toLowerCase().includes(term) || s.document?.toLowerCase().includes(term);
                    }).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                          Nenhum fornecedor encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-slate-500">Dê duplo clique para selecionar</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFornecedorSearch(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Pesquisa de NF */}
        <Dialog open={showNFSearch} onOpenChange={setShowNFSearch}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Pesquisar Número da NF</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input 
                placeholder="Digite o número da NF..."
                value={nfSearchTerm}
                onChange={(e) => setNfSearchTerm(e.target.value)}
                className="h-9"
                autoFocus
              />
              <div className="max-h-80 overflow-auto border rounded">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs">Número NF</TableHead>
                      <TableHead className="text-xs">Fornecedor</TableHead>
                      <TableHead className="text-xs">Vencimento</TableHead>
                      <TableHead className="text-xs text-right">Valor</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contas
                      .filter(c => c.nfe_number)
                      .filter(c => {
                        if (!nfSearchTerm) return true;
                        const term = nfSearchTerm.toLowerCase();
                        return c.nfe_number?.toLowerCase().includes(term) || 
                               c.supplier_name?.toLowerCase().includes(term);
                      })
                      .map(c => (
                        <TableRow 
                          key={c.id} 
                          className="cursor-pointer hover:bg-blue-50"
                          onDoubleClick={() => {
                            setFiltroNFe(c.nfe_number);
                            setShowNFSearch(false);
                            setNfSearchTerm('');
                            setTimeout(() => applyFiltersAndShow(), 100);
                          }}
                        >
                          <TableCell className="text-xs font-mono">{c.nfe_number}</TableCell>
                          <TableCell className="text-xs">{c.supplier_name}</TableCell>
                          <TableCell className="text-xs">{format(parseISO(c.due_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-xs text-right">{formatCurrency(c.amount)}</TableCell>
                          <TableCell className="text-xs">
                            {c.status === 'pago' ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">Pago</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">Aberto</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    {contas.filter(c => c.nfe_number).filter(c => {
                      if (!nfSearchTerm) return true;
                      const term = nfSearchTerm.toLowerCase();
                      return c.nfe_number?.toLowerCase().includes(term) || c.supplier_name?.toLowerCase().includes(term);
                    }).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          Nenhuma NF encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-slate-500">Dê duplo clique para selecionar</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNFSearch(false)}>Fechar</Button>
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
                Tem certeza que deseja excluir {getSelectedContasForAction().length > 1 ? 'estas contas a pagar' : 'esta conta a pagar'}?
              </p>
              {getSelectedContasForAction().length > 0 && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm space-y-2 max-h-40 overflow-auto">
                  {getSelectedContasForAction().map(conta => (
                    <div key={conta.id} className="border-b pb-2 last:border-0">
                      <p><strong>Fornecedor:</strong> {conta.supplier_name}</p>
                      <p><strong>Valor:</strong> {formatCurrency(conta.amount)}</p>
                      <p><strong>Vencimento:</strong> {format(parseISO(conta.due_date), 'dd/MM/yyyy')}</p>
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