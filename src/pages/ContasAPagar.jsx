import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DollarSign,
  Search,
  LogOut,
  Printer,
  Edit,
  Trash2,
  CheckSquare,
  X,
  ArrowRight,
} from "lucide-react";
import { ContasAPagar } from "@/entities/ContasAPagar";
import { CashAccount } from "@/entities/CashAccount";
import { CashMovement } from "@/entities/CashMovement";
import { FinancialGroup } from "@/entities/FinancialGroup";
import { PaymentType } from "@/entities/PaymentType";
import { Sector } from "@/entities/Sector";
import { SectorMaster } from "@/entities/SectorMaster";
import { Person } from "@/entities/Person";
import { User } from "@/entities/User";
import { useToast } from "@/components/ui/use-toast";
import {
  format,
  parseISO,
  isBefore,
  startOfDay,
  differenceInDays,
} from "date-fns";
import { createPageUrl } from "@/utils";
import PagamentoModal from "@/components/financial/PagamentoModal";

// Dialog de Baixa (Pagamento)
function BaixaDialog({
  isOpen,
  onClose,
  onConfirm,
  cashAccounts,
  contas,
  totalSelecionado,
}) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );

  useEffect(() => {
    if (cashAccounts.length > 0) {
      setSelectedAccountId(cashAccounts[0].id);
    }
  }, [cashAccounts]);

  if (!contas || contas.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagar Contas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p>
            <strong>Quantidade:</strong> {contas.length} conta(s) selecionada(s)
          </p>
          <p>
            <strong>Valor Total:</strong>{" "}
            <span className="text-red-600 font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalSelecionado)}
            </span>
          </p>
          <div>
            <Label>Data do Pagamento</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Conta/Caixa de Origem *</Label>
            <Select
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta..." />
              </SelectTrigger>
              <SelectContent>
                {cashAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(selectedAccountId, paymentDate)}
            disabled={!selectedAccountId}
            className="bg-red-600 hover:bg-red-700"
          >
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dialog de Reagendamento
function ReagendarDialog({ isOpen, onClose, onConfirm, contas }) {
  const [novaData, setNovaData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [motivo, setMotivo] = useState("");

  if (!contas || contas.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reagendar Vencimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p>
            <strong>Quantidade:</strong> {contas.length} conta(s) selecionada(s)
          </p>
          <div>
            <Label>Nova Data de Vencimento *</Label>
            <Input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
            />
          </div>
          <div>
            <Label>Motivo do Reagendamento</Label>
            <Input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Informe o motivo..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(novaData, motivo)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Confirmar Reagendamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ContasAPagarPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [contas, setContas] = useState([]);
  const [displayedContas, setDisplayedContas] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [sectorMasters, setSectorMasters] = useState([]);
  const [groups, setGroups] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBaixaOpen, setIsBaixaOpen] = useState(false);
  const [isPagamentoOpen, setIsPagamentoOpen] = useState(false);
  const [isReagendarOpen, setIsReagendarOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedContas, setSelectedContas] = useState([]);
  const [selectedContaForAction, setSelectedContaForAction] = useState(null);

  // Modais de pesquisa
  const [showFornecedorSearch, setShowFornecedorSearch] = useState(false);
  const [showNFSearch, setShowNFSearch] = useState(false);
  const [fornecedorSearchTerm, setFornecedorSearchTerm] = useState("");
  const [nfSearchTerm, setNfSearchTerm] = useState("");

  // Controle de foco para saber qual campo está ativo
  const [activeSearchField, setActiveSearchField] = useState(null); // 'fornecedor' | 'nf' | null

  // Pesquisa - Fornecedor
  const [fornecedorPesquisa, setFornecedorPesquisa] = useState("");
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);

  // Filtros
  const [filtroConta, setFiltroConta] = useState("todas");
  const [filtroSectorMaster, setFiltroSectorMaster] = useState("todos");
  const [filtroNFe, setFiltroNFe] = useState("");
  const [statusContas, setStatusContas] = useState({
    naoPagas: true,
    pagas: false,
  });

  // Ordenação
  const [ordenacao, setOrdenacao] = useState("vencimento");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (!user?.companyId) {
        toast({
          title: "Atenção",
          description: "Usuário não vinculado a uma empresa.",
          variant: "destructive",
        });
        return;
      }

      const [
        contasData,
        cashAccountsData,
        paymentTypesData,
        sectorsData,
        sectorMastersData,
        groupsData,
        suppliersData,
      ] = await Promise.all([
        ContasAPagar.filter(
          { companyId: user.companyId },
          { sort: "-dueDate" },
        ),
        CashAccount.filter({ companyId: user.companyId, active: true }),
        PaymentType.filter({ companyId: user.companyId, active: true }),
        Sector.filter({ companyId: user.companyId, active: true }),
        SectorMaster.filter({ companyId: user.companyId }),
        FinancialGroup.filter({
          companyId: user.companyId,
          type: "despesa",
          active: true,
        }),
        Person.filter({ companyId: user.companyId, type: "fornecedor" }),
      ]);
      setContas(contasData);
      setCashAccounts(cashAccountsData);
      setPaymentTypes(paymentTypesData);
      setSectors(sectorsData);
      setSectorMasters(sectorMastersData);
      setGroups(groupsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas a pagar.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Função para aplicar filtros e exibir resultados
  const applyFiltersAndShow = () => {
    const today = startOfDay(new Date());

    const filtered = contas
      .filter((c) => {
        const dueDate = c.dueDate;
        const isVencida = c.status === "aberto" && isBefore(dueDate, today);
        const isPaga = c.status === "pago";

        // Filtro de status
        if (!statusContas.naoPagas && !isPaga) return false;
        if (!statusContas.pagas && isPaga) return false;

        // Filtro de fornecedor
        if (fornecedorPesquisa) {
          const term = fornecedorPesquisa.toLowerCase();
          if (!c.supplierName?.toLowerCase().includes(term)) return false;
        }

        // Filtro de conta
        if (filtroConta !== "todas" && c.cashAccountId !== filtroConta)
          return false;

        // Filtro de setor master
        if (
          filtroSectorMaster !== "todos" &&
          c.sectorMasterId !== filtroSectorMaster
        )
          return false;

        // Filtro de NFe
        if (filtroNFe) {
          if (!c.nfeNumber?.toLowerCase().includes(filtroNFe.toLowerCase()))
            return false;
        }

        return true;
      })
      .map((c) => {
        const dueDate = c.dueDate;
        const today = startOfDay(new Date());
        const isVencida = c.status === "aberto" && isBefore(dueDate, today);
        const diasParaVencer = differenceInDays(dueDate, today);
        const isVenceHoje = diasParaVencer === 0 && c.status === "aberto";
        const isVenceEm3Dias =
          diasParaVencer > 0 && diasParaVencer <= 3 && c.status === "aberto";

        return {
          ...c,
          isVencida: isVencida,
          isVenceHoje: isVenceHoje,
          isVenceEm_3Dias: isVenceEm3Dias,
        };
      })
      .sort((a, b) => {
        if (ordenacao === "vencimento")
          return new Date(a.dueDate) - new Date(b.dueDate);
        if (ordenacao === "codigo")
          return (a.id || "").localeCompare(b.id || "");
        if (ordenacao === "fornecedor")
          return (a.supplierName || "").localeCompare(b.supplierName || "");
        if (ordenacao === "valor") return (b.amount || 0) - (a.amount || 0);
        return 0;
      });

    setDisplayedContas(filtered);
    setShowResults(true);
  };

  const filteredContas = showResults ? displayedContas : [];

  // Cálculos de totais
  const totais = {
    pago: contas
      .filter((c) => c.status === "pago")
      .reduce((sum, c) => sum + (c.amount || 0), 0),
    aPagar: filteredContas
      .filter((c) => c.status !== "pago")
      .reduce((sum, c) => sum + (c.amount || 0), 0),
    vencido: filteredContas
      .filter((c) => c.isVencida)
      .reduce((sum, c) => sum + (c.amount || 0), 0),
    aVencer: filteredContas
      .filter((c) => !c.isVencida && c.status !== "pago")
      .reduce((sum, c) => sum + (c.amount || 0), 0),
    selecionado: selectedContas.reduce((sum, id) => {
      const conta = contas.find((c) => c.id === id);
      return sum + (conta?.amount || 0);
    }, 0),
  };

  const toggleSelectConta = (contaId) => {
    setSelectedContas((prev) =>
      prev.includes(contaId)
        ? prev.filter((id) => id !== contaId)
        : [...prev, contaId],
    );
  };

  const selectAll = () => {
    setSelectedContas(
      filteredContas.filter((c) => c.status === "aberto").map((c) => c.id),
    );
  };

  const deselectAll = () => {
    setSelectedContas([]);
    setSelectedContaForAction(null);
  };

  const handleRowClick = (conta) => {
    setSelectedContaForAction(conta);
  };

  const hasSelection = selectedContas.length > 0 || selectedContaForAction;

  const getSelectedContasForAction = () => {
    if (selectedContas.length > 0) {
      return selectedContas
        .map((id) => contas.find((c) => c.id === id))
        .filter(Boolean);
    }
    if (selectedContaForAction) {
      return [selectedContaForAction];
    }
    return [];
  };

  const handleExcluir = () => {
    if (!hasSelection) {
      toast({
        title: "Atenção",
        description: "Selecione uma conta para excluir.",
        variant: "destructive",
      });
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
          // Se a conta não existe mais (404), apenas conta como "não encontrada"
          if (
            err.message?.includes("not found") ||
            err.response?.status === 404 ||
            err.message?.includes("404")
          ) {
            notFoundCount++;
          } else {
            throw err;
          }
        }
      }

      if (deletedCount > 0) {
        toast({
          title: "Sucesso",
          description: `${deletedCount} conta(s) excluída(s) com sucesso!`,
        });
      }
      if (notFoundCount > 0) {
        toast({
          title: "Aviso",
          description: `${notFoundCount} conta(s) já havia(m) sido excluída(s).`,
          variant: "default",
        });
      }

      setIsDeleteConfirmOpen(false);
      setSelectedContaForAction(null);
      setSelectedContas([]);
      await loadData();
      if (showResults) {
        setTimeout(() => applyFiltersAndShow(), 100);
      }
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a(s) conta(s).",
        variant: "destructive",
      });
      // Mesmo em erro, recarrega os dados para manter consistência
      await loadData();
    }
  };

  const handleModificar = () => {
    if (!hasSelection) {
      toast({
        title: "Atenção",
        description: "Selecione uma conta para modificar.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Info",
      description: "Funcionalidade de modificação em desenvolvimento.",
    });
  };

  const handlePagar = () => {
    if (selectedContas.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos uma conta para pagar.",
        variant: "destructive",
      });
      return;
    }
    setIsPagamentoOpen(true);
  };

  const handleConfirmPagamento = async (cashAccountId, paidDate) => {
    if (!cashAccountId || !currentUser) {
      toast({
        title: "Erro",
        description: "Dados incompletos para pagar as contas.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payingAccount = cashAccounts.find(
        (acc) => acc.id === cashAccountId,
      );
      if (!payingAccount) {
        toast({
          title: "Erro",
          description: "Conta de caixa selecionada não encontrada.",
          variant: "destructive",
        });
        return;
      }

      let totalPago = 0;

      for (const contaId of selectedContas) {
        const conta = contas.find((c) => c.id === contaId);
        if (!conta || conta.status === "pago") continue;

        // Criar movimento de caixa (despesa)
        await CashMovement.create({
          cashAccountId: payingAccount.id,
          cashAccountName: payingAccount.name,
          type: "despesa",
          description: `Pagamento: ${conta.description}`,
          amount: conta.amount,
          personId: conta.supplierId,
          personName: conta.supplierName,
          movementDate: paidDate,
          companyId: currentUser.companyId,
          companyName: currentUser.companyName,
          createdByName: currentUser.name,
        });

        // Atualizar status da conta
        await ContasAPagar.update(contaId, {
          status: "pago",
          paymentDate: paidDate,
        });

        totalPago += conta.amount || 0;
      }

      // Atualizar saldo da conta
      const newBalance = (payingAccount.balance || 0) - totalPago;
      await CashAccount.update(payingAccount.id, { balance: newBalance });

      toast({
        title: "Sucesso",
        description: `${selectedContas.length} conta(s) paga(s) com sucesso!`,
      });
      setIsBaixaOpen(false);
      setSelectedContas([]);
      await loadData();
      // Reaplicar filtros para atualizar a tabela com as novas cores
      setTimeout(() => {
        if (showResults) applyFiltersAndShow();
      }, 100);
    } catch (error) {
      console.error("Erro ao pagar contas:", error);
      toast({
        title: "Erro",
        description: `Não foi possível pagar as contas. ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleReagendar = () => {
    if (selectedContas.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos uma conta para reagendar.",
        variant: "destructive",
      });
      return;
    }
    setIsReagendarOpen(true);
  };

  const handleConfirmReagendar = async (novaData, motivo) => {
    try {
      for (const contaId of selectedContas) {
        const conta = contas.find((c) => c.id === contaId);
        if (!conta || conta.status === "pago") continue;

        await ContasAPagar.update(contaId, {
          dueDate: novaData,
          reagendamentoMotivo: motivo,
          reagendamentoData: format(new Date(), "yyyy-MM-dd"),
        });
      }

      toast({
        title: "Sucesso",
        description: `${selectedContas.length} conta(s) reagendada(s) com sucesso!`,
      });
      setIsReagendarOpen(false);
      setSelectedContas([]);
      loadData();
      if (showResults) applyFiltersAndShow();
    } catch (error) {
      console.error("Erro ao reagendar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível reagendar as contas.",
        variant: "destructive",
      });
    }
  };

  const handleImprimir = () => {
    const contasToPrint = getSelectedContasForAction();
    if (contasToPrint.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione ao menos uma conta para imprimir.",
        variant: "destructive",
      });
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
          .text-center { text-align: center; }
          .total-row { background-color: #f9f9f9; font-weight: bold; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; }
          @media print { body { padding: 10px; } button { display: none; } }
          .btn-print { display: block; margin: 20px auto; padding: 10px 30px; font-size: 14px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Relatório de Contas a Pagar</h1>
        <p class="subtitle">Emitido em: ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        
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
            ${contasToPrint
              .map(
                (conta) => `
              <tr>
                <td>${conta.createdAt ? format(conta.createdAt, "dd/MM/yyyy") : "-"}</td>
                <td>${conta.purchaseId?.slice(-6) || "-"}</td>
                <td>${conta.nfeNumber || "-"}</td>
                <td>${format(conta.dueDate, "dd/MM/yyyy")}</td>
                <td class="text-right">${formatCurrency(conta.amount)}</td>
                <td>${conta.paymentDate ? format(conta.paymentDate, "dd/MM/yyyy") : "-"}</td>
                <td class="text-right">${conta.status === "pago" ? formatCurrency(conta.amount) : "-"}</td>
                <td>${conta.supplierName || "-"}</td>
              </tr>
            `,
              )
              .join("")}
            <tr class="total-row">
              <td colspan="4" class="text-right"><strong>TOTAL:</strong></td>
              <td class="text-right"><strong>${formatCurrency(contasToPrint.reduce((sum, c) => sum + (c.amount || 0), 0))}</strong></td>
              <td></td>
              <td class="text-right"><strong>${formatCurrency(contasToPrint.filter((c) => c.status === "pago").reduce((sum, c) => sum + (c.amount || 0), 0))}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>
        
        <p class="footer">Total de registros: ${contasToPrint.length}</p>
        
        <button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFiltersAndShow();
    }
  };

  const handlePesquisarClick = () => {
    // Se o campo de fornecedor está ativo, abre modal de fornecedor
    if (activeSearchField === "fornecedor") {
      setShowFornecedorSearch(true);
      return;
    }
    // Se o campo de NF está ativo, abre modal de NF
    if (activeSearchField === "nf") {
      setShowNFSearch(true);
      return;
    }
    // Senão, aplica os filtros
    applyFiltersAndShow();
  };

  const handleSair = () => {
    // Verifica se veio de alguma página específica via URL params
    const urlParams = new URLSearchParams(window.location.search);
    const returnTo = urlParams.get("return");

    if (returnTo === "cashMovements") {
      window.location.href = createPageUrl("CashMovements");
    } else {
      window.location.href = createPageUrl("Dashboard");
    }
  };

  const getRowColor = (conta) => {
    if (conta.status === "pago") return "bg-green-50";
    if (conta.isVenceHoje) return "bg-yellow-50";
    if (conta.isVenceEm_3Dias) return "bg-orange-50";
    if (conta.isVencida) return "bg-red-50";
    return "";
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-300 p-4">
        <h1 className="text-xl font-bold text-slate-800">Contas a Pagar</h1>
      </div>

      {/* Dialogs */}
      <BaixaDialog
        isOpen={isBaixaOpen}
        onClose={() => setIsBaixaOpen(false)}
        onConfirm={handleConfirmPagamento}
        cashAccounts={cashAccounts}
        contas={selectedContas
          .map((id) => contas.find((c) => c.id === id))
          .filter(Boolean)}
        totalSelecionado={totais.selecionado}
      />

      <ReagendarDialog
        isOpen={isReagendarOpen}
        onClose={() => setIsReagendarOpen(false)}
        onConfirm={handleConfirmReagendar}
        contas={selectedContas
          .map((id) => contas.find((c) => c.id === id))
          .filter(Boolean)}
      />

      <PagamentoModal
        open={isPagamentoOpen}
        onOpenChange={setIsPagamentoOpen}
        contas={selectedContas
          .map((id) => contas.find((c) => c.id === id))
          .filter(Boolean)
          .filter((c) => c.status !== "pago")}
        cashAccounts={cashAccounts}
        currentUser={currentUser}
        onPaymentComplete={() => {
          setSelectedContas([]);
          loadData();
          setTimeout(() => {
            if (showResults) applyFiltersAndShow();
          }, 100);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-full mx-auto space-y-4">
          {/* SEÇÃO DE FILTROS - 4 BLOCOS */}
          <div className="grid grid-cols-12 gap-4">
            {/* 1. PESQUISA */}
            <div className="col-span-3">
              <Card className="bg-white border-slate-300 h-full">
                <CardContent className="p-4">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-3">
                    Pesquisa
                  </h4>
                  <div>
                    <Label className="text-xs">Fornecedor:</Label>
                    <div className="flex gap-1">
                      <div className="flex-1 relative">
                        <Input
                          value={
                            fornecedorSelecionado?.name || fornecedorPesquisa
                          }
                          onChange={(e) => {
                            setFornecedorPesquisa(e.target.value);
                            setFornecedorSelecionado(null);
                          }}
                          onKeyDown={handleKeyDown}
                          onFocus={() => setActiveSearchField("fornecedor")}
                          onBlur={() =>
                            setTimeout(() => setActiveSearchField(null), 200)
                          }
                          className={`h-8 text-xs pr-6 ${activeSearchField === "fornecedor" ? "ring-2 ring-blue-500" : ""}`}
                          placeholder="Digite o nome ou use Pesquisar..."
                        />
                        {(fornecedorSelecionado || fornecedorPesquisa) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFornecedorSelecionado(null);
                              setFornecedorPesquisa("");
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Deixe em branco para todos
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 2. FILTROS */}
            <div className="col-span-4">
              <Card className="bg-white border-slate-300 h-full">
                <CardContent className="p-4">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-3">
                    Filtros
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Conta:</Label>
                        <Select
                          value={filtroConta}
                          onValueChange={setFiltroConta}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todas">Todas</SelectItem>
                            {cashAccounts.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Setor Master:</Label>
                        <Select
                          value={filtroSectorMaster}
                          onValueChange={setFiltroSectorMaster}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            {sectorMasters.map((sm) => (
                              <SelectItem key={sm.id} value={sm.id}>
                                {sm.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="naoPagasPagar"
                          checked={statusContas.naoPagas}
                          onCheckedChange={(v) =>
                            setStatusContas((p) => ({ ...p, naoPagas: v }))
                          }
                        />
                        <label htmlFor="naoPagasPagar" className="text-xs">
                          Não Pagas
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="pagasPagar"
                          checked={statusContas.pagas}
                          onCheckedChange={(v) =>
                            setStatusContas((p) => ({ ...p, pagas: v }))
                          }
                        />
                        <label htmlFor="pagasPagar" className="text-xs">
                          Pagas
                        </label>
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
                            onFocus={() => setActiveSearchField("nf")}
                            onBlur={() =>
                              setTimeout(() => setActiveSearchField(null), 200)
                            }
                            className={`h-7 text-xs pr-6 ${activeSearchField === "nf" ? "ring-2 ring-blue-500" : ""}`}
                            placeholder="Digite o número ou use Pesquisar..."
                          />
                          {filtroNFe && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFiltroNFe("");
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
                <CardContent className="p-4">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-3">
                    Legenda
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-400 rounded"></div>
                      <span className="text-xs">Conta vencida</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-400 rounded"></div>
                      <span className="text-xs">Conta paga</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                      <span className="text-xs">Vence hoje</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-400 rounded"></div>
                      <span className="text-xs">Vence em 3 dias</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 4. ORDENAÇÃO */}
            <div className="col-span-3">
              <Card className="bg-white border-slate-300 h-full">
                <CardContent className="p-4">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-3">
                    Ordenação
                  </h4>
                  <RadioGroup
                    value={ordenacao}
                    onValueChange={setOrdenacao}
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="vencimento"
                        id="ordVencimentoPagar"
                      />
                      <label htmlFor="ordVencimentoPagar" className="text-xs">
                        Vencimento
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="codigo" id="ordCodigoPagar" />
                      <label htmlFor="ordCodigoPagar" className="text-xs">
                        Código
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="fornecedor" id="ordFornecedor" />
                      <label htmlFor="ordFornecedor" className="text-xs">
                        Fornecedor
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="valor" id="ordValorPagar" />
                      <label htmlFor="ordValorPagar" className="text-xs">
                        Valor
                      </label>
                    </div>
                  </RadioGroup>

                  <Button
                    className="w-full mt-3 text-white text-xs h-8 gap-1"
                    style={{ backgroundColor: "#e78b3a" }}
                    onClick={applyFiltersAndShow}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* GRID DE CONTAS */}
          <Card className="bg-white border-slate-300">
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-auto">
                {!showResults ? (
                  <div className="flex items-center justify-center h-48 text-slate-500 text-sm p-8">
                    <div className="text-center">
                      <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>
                        Selecione os filtros e clique em{" "}
                        <strong>Pesquisar</strong>
                      </p>
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
                        <TableHead className="text-xs w-16">Tipo</TableHead>
                        <TableHead className="text-xs w-20">Tp Pagto</TableHead>
                        <TableHead className="text-xs w-12">Parc</TableHead>
                        <TableHead className="text-xs w-24">
                          Dt Vencto
                        </TableHead>
                        <TableHead className="text-xs w-24 text-right">
                          Valor
                        </TableHead>
                        <TableHead className="text-xs w-24">Dt Pagto</TableHead>
                        <TableHead className="text-xs w-24 text-right">
                          Vl Pago
                        </TableHead>
                        <TableHead className="text-xs w-20">Situação</TableHead>
                        <TableHead className="text-xs">Fornecedor</TableHead>
                        <TableHead className="text-xs w-24">Grupo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={14} className="text-center py-8">
                            Carregando...
                          </TableCell>
                        </TableRow>
                      ) : filteredContas.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={14}
                            className="text-center py-8 text-slate-500"
                          >
                            Nenhuma conta encontrada com os filtros
                            selecionados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredContas.map((conta) => (
                          <TableRow
                            key={conta.id}
                            className={`${getRowColor(conta)} hover:bg-slate-100 cursor-pointer ${selectedContaForAction?.id === conta.id ? "ring-2 ring-blue-500" : ""}`}
                            onClick={() => handleRowClick(conta)}
                          >
                            <TableCell
                              className="text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={selectedContas.includes(conta.id)}
                                onCheckedChange={() =>
                                  toggleSelectConta(conta.id)
                                }
                                disabled={conta.status === "pago"}
                              />
                            </TableCell>
                            <TableCell className="text-xs">
                              {conta.createdAt
                                ? format(conta.createdAt, "dd/MM/yy")
                                : "-"}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {conta.purchaseId?.slice(-6) ||
                                conta.id?.slice(-6)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {conta.nfeNumber || "-"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {conta.documentType || "-"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {conta.paymentTypeName || "-"}
                            </TableCell>
                            <TableCell className="text-xs text-center">
                              {conta.installmentNumber || "1"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {format(conta.dueDate, "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono">
                              {formatCurrency(conta.amount)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {conta.paymentDate
                                ? format(conta.paymentDate, "dd/MM/yyyy")
                                : "-"}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono">
                              {conta.status === "pago"
                                ? formatCurrency(conta.amount)
                                : "-"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {conta.status === "pago" ? (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  Pago
                                </Badge>
                              ) : conta.isVencida ? (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  Vencido
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                  Aberto
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {conta.supplierName}
                            </TableCell>
                            <TableCell className="text-xs">
                              {conta.groupName || "-"}
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

          {/* TOTAIS */}
          <div className="grid grid-cols-5 gap-4 p-3 bg-white rounded-lg border border-slate-300">
            <div className="text-center">
              <p className="text-xs text-slate-600">Pago:</p>
              <p className="text-sm font-bold text-green-600">
                {formatCurrency(totais.pago)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600">A pagar:</p>
              <p className="text-sm font-bold text-blue-600">
                {formatCurrency(totais.aPagar)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600">Total Vencido:</p>
              <p className="text-sm font-bold text-red-600">
                {formatCurrency(totais.vencido)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600">Total a Vencer:</p>
              <p className="text-sm font-bold text-blue-600">
                {formatCurrency(totais.aVencer)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600">Total Selecionado:</p>
              <p className="text-sm font-bold text-green-700">
                {formatCurrency(totais.selecionado)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE AÇÕES */}
      <div className="bg-slate-200 border-t border-slate-300 p-2">
        <div className="flex flex-wrap gap-1 items-center">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            disabled={!hasSelection}
            onClick={handleModificar}
          >
            <Edit className="w-3 h-3" /> Alterar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1 text-red-600 hover:bg-red-50"
            disabled={!hasSelection}
            onClick={handleExcluir}
          >
            <Trash2 className="w-3 h-3" /> Excluir
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={handlePesquisarClick}
          >
            <Search className="w-3 h-3" /> Pesquisar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={handleSair}
          >
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
            className="h-8 text-xs gap-1 text-white hover:opacity-90"
            style={{ backgroundColor: "#e78b3a" }}
            onClick={handlePagar}
            disabled={selectedContas.length === 0}
          >
            <DollarSign className="w-3 h-3" /> Baixar
          </Button>

          <div className="w-px h-6 bg-slate-400 mx-1" />

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={selectAll}
          >
            <CheckSquare className="w-3 h-3" /> Selecionar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={deselectAll}
          >
            <X className="w-3 h-3" /> Desmarcar
          </Button>
        </div>
      </div>

      {/* Modal de Pesquisa de Fornecedor */}
      <Dialog
        open={showFornecedorSearch}
        onOpenChange={setShowFornecedorSearch}
      >
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
                    .filter((s) => {
                      if (!fornecedorSearchTerm) return true;
                      const term = fornecedorSearchTerm.toLowerCase();
                      return (
                        s.name?.toLowerCase().includes(term) ||
                        s.document?.toLowerCase().includes(term)
                      );
                    })
                    .map((s) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-blue-50"
                        onDoubleClick={() => {
                          setFornecedorSelecionado(s);
                          setFornecedorPesquisa(s.name);
                          setShowFornecedorSearch(false);
                          setFornecedorSearchTerm("");
                          setTimeout(() => applyFiltersAndShow(), 100);
                        }}
                      >
                        <TableCell className="text-xs font-mono">
                          {s.personNumber || s.id?.slice(-6)}
                        </TableCell>
                        <TableCell className="text-xs">{s.name}</TableCell>
                        <TableCell className="text-xs">
                          {s.document || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.phone?.[0] || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  {suppliers.filter((s) => {
                    if (!fornecedorSearchTerm) return true;
                    const term = fornecedorSearchTerm.toLowerCase();
                    return (
                      s.name?.toLowerCase().includes(term) ||
                      s.document?.toLowerCase().includes(term)
                    );
                  }).length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-slate-500"
                      >
                        Nenhum fornecedor encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-slate-500">
              Dê duplo clique para selecionar
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFornecedorSearch(false)}
            >
              Fechar
            </Button>
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
                    .filter((c) => c.nfeNumber)
                    .filter((c) => {
                      if (!nfSearchTerm) return true;
                      const term = nfSearchTerm.toLowerCase();
                      return (
                        c.nfeNumber?.toLowerCase().includes(term) ||
                        c.supplierName?.toLowerCase().includes(term)
                      );
                    })
                    .map((c) => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-blue-50"
                        onDoubleClick={() => {
                          setFiltroNFe(c.nfeNumber);
                          setShowNFSearch(false);
                          setNfSearchTerm("");
                          setTimeout(() => applyFiltersAndShow(), 100);
                        }}
                      >
                        <TableCell className="text-xs font-mono">
                          {c.nfeNumber}
                        </TableCell>
                        <TableCell className="text-xs">
                          {c.supplierName}
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(c.dueDate, "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {formatCurrency(c.amount)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {c.status === "pago" ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Pago
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Aberto
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  {contas
                    .filter((c) => c.nfeNumber)
                    .filter((c) => {
                      if (!nfSearchTerm) return true;
                      const term = nfSearchTerm.toLowerCase();
                      return (
                        c.nfeNumber?.toLowerCase().includes(term) ||
                        c.supplierName?.toLowerCase().includes(term)
                      );
                    }).length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-slate-500"
                      >
                        Nenhuma NF encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-slate-500">
              Dê duplo clique para selecionar
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNFSearch(false)}>
              Fechar
            </Button>
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
              Tem certeza que deseja excluir{" "}
              {getSelectedContasForAction().length > 1
                ? "estas contas a pagar"
                : "esta conta a pagar"}
              ?
            </p>
            {getSelectedContasForAction().length > 0 && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm space-y-2 max-h-40 overflow-auto">
                {getSelectedContasForAction().map((conta) => (
                  <div key={conta.id} className="border-b pb-2 last:border-0">
                    <p>
                      <strong>Fornecedor:</strong> {conta.supplierName}
                    </p>
                    <p>
                      <strong>Valor:</strong> {formatCurrency(conta.amount)}
                    </p>
                    <p>
                      <strong>Vencimento:</strong>{" "}
                      {format(conta.dueDate, "dd/MM/yyyy")}
                    </p>
                  </div>
                ))}
                {getSelectedContasForAction().length > 1 && (
                  <p className="font-bold pt-2">
                    Total:{" "}
                    {formatCurrency(
                      getSelectedContasForAction().reduce(
                        (sum, c) => sum + (c.amount || 0),
                        0,
                      ),
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Não
            </Button>
            <Button variant="destructive" onClick={confirmExcluir}>
              Sim, Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
