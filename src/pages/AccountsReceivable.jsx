import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

// Custom styled checkbox wrapper
const StyledCheckbox = ({ checked, onCheckedChange, disabled, ...props }) => (
  <Checkbox
    checked={checked}
    onCheckedChange={onCheckedChange}
    disabled={disabled}
    className="data-[state=checked]:bg-[#223f61] data-[state=checked]:border-[#223f61]"
    {...props}
  />
);
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DollarSign,
  Search,
  LogOut,
  Printer,
  Edit,
  Trash2,
  CheckSquare,
  RefreshCw,
  X,
  ArrowRight,
} from "lucide-react";
import { AccountsReceivable, CashAccount, Employee, PaymentType, Person, Sector } from "@/entities";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, isBefore, startOfDay, startOfMonth } from "date-fns";
import { createPageUrl } from "@/utils";
import RenegociacaoModal from "@/components/financial/RenegociacaoModal";

// Dialog de Baixa
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
          <DialogTitle>Baixar Contas a Receber</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p>
            <strong>Quantidade:</strong> {contas.length} conta(s) selecionada(s)
          </p>
          <p>
            <strong>Valor Total:</strong>{" "}
            <span className="text-green-600 font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalSelecionado)}
            </span>
          </p>
          <div>
            <Label>Data do Recebimento</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Conta/Caixa de Destino *</Label>
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
            className="bg-green-600 hover:bg-green-700"
          >
            Confirmar Recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountsReceivablePage({ onComplete }) {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [contas, setContas] = useState([]);
  const [displayedContas, setDisplayedContas] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [people, setPeople] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBaixaOpen, setIsBaixaOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isRenegociacaoOpen, setIsRenegociacaoOpen] = useState(false);
  const [selectedContas, setSelectedContas] = useState([]);
  const [selectedContaForAction, setSelectedContaForAction] = useState(null);

  // Pesquisa - Tipo Sacado
  const [tipoSacado, setTipoSacado] = useState({
    cliente: true,
    pontoVenda: false,
    conveniada: false,
  });
  const [sacadoSelecionado, setSacadoSelecionado] = useState(null);
  const [showSacadoSearch, setShowSacadoSearch] = useState(false);
  const [sacadoSearchTerm, setSacadoSearchTerm] = useState("");

  // Pesquisa - Método de pesquisa
  const [metodoPesquisa, setMetodoPesquisa] = useState("codigoVenda");
  const [codigoPesquisa, setCodigoPesquisa] = useState("");
  const [showCodigoSearch, setShowCodigoSearch] = useState(false);

  // Período
  const [usarPeriodo, setUsarPeriodo] = useState(false);
  const [dataInicio, setDataInicio] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [dataFinal, setDataFinal] = useState(format(new Date(), "yyyy-MM-dd"));

  // Filtros
  const [filtroConta, setFiltroConta] = useState("todas");
  const [filtroSetor, setFiltroSetor] = useState("todos");
  const [filtroTipoPagto, setFiltroTipoPagto] = useState("todos");
  const [filtroRespCobranca, setFiltroRespCobranca] = useState("todos");
  const [statusContas, setStatusContas] = useState({
    naoPagas: true,
    pagas: false,
    emCobranca: false,
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
        peopleData,
        employeesData,
      ] = await Promise.all([
        AccountsReceivable.filter({ companyId: user.companyId }, "-dueDate"),
        CashAccount.filter({ companyId: user.companyId, active: true }),
        PaymentType.filter({ companyId: user.companyId, active: true }),
        Sector.filter({ companyId: user.companyId, active: true }),
        Person.filter({ companyId: user.companyId }),
        Employee.filter({ companyId: user.companyId, active: true }),
      ]);
      setContas(contasData);
      setCashAccounts(cashAccountsData);
      setPaymentTypes(paymentTypesData);
      setSectors(sectorsData);
      setPeople(peopleData);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas a receber.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Conta quantos tipos de sacado estão selecionados
  const tiposSacadoSelecionados = [
    tipoSacado.cliente,
    tipoSacado.pontoVenda,
    tipoSacado.conveniada,
  ].filter(Boolean).length;

  // Filtra pessoas pelo tipo de sacado selecionado
  const filteredPeople = people.filter((p) => {
    if (tipoSacado.cliente && p.type === "cliente") return true;
    if (tipoSacado.pontoVenda && p.type === "pontoVenda") return true;
    if (tipoSacado.conveniada && p.type === "conveniada") return true;
    return false;
  });

  // Função para aplicar filtros e exibir resultados
  const applyFiltersAndShow = () => {
    const today = startOfDay(new Date());

    const filtered = contas
      .filter((c) => {
        const dueDate = parseISO(c.dueDate);
        const isVencida = c.status === "pendente" && isBefore(dueDate, today);
        const isPaga = c.status === "pago";
        const isEmCobranca = c.status === "emCobranca";

        // Filtro de status
        if (!statusContas.naoPagas && !isPaga && !isEmCobranca) return false;
        if (!statusContas.pagas && isPaga) return false;
        if (!statusContas.emCobranca && isEmCobranca) return false;

        // Filtro de sacado selecionado
        if (sacadoSelecionado) {
          if (c.personId !== sacadoSelecionado.id) return false;
        }

        // Filtro de código de pesquisa
        if (codigoPesquisa) {
          const term = codigoPesquisa.toLowerCase();
          if (metodoPesquisa === "codigoVenda") {
            if (
              !c.saleId?.toLowerCase().includes(term) &&
              !c.id?.toLowerCase().includes(term)
            )
              return false;
          }
          if (metodoPesquisa === "notaFiscal") {
            if (!c.nfeNumber?.toLowerCase().includes(term)) return false;
          }
          if (metodoPesquisa === "documento") {
            if (!c.personDocument?.toLowerCase().includes(term)) return false;
          }
        }

        // Filtro de período
        if (usarPeriodo) {
          const inicio = new Date(dataInicio + "T00:00:00");
          const fim = new Date(dataFinal + "T23:59:59");
          if (dueDate < inicio || dueDate > fim) return false;
        }

        // Filtro de conta
        if (filtroConta !== "todas" && c.cashAccountId !== filtroConta)
          return false;

        // Filtro de setor
        if (filtroSetor !== "todos" && c.sectorId !== filtroSetor) return false;

        // Filtro de tipo pagamento
        if (filtroTipoPagto !== "todos" && c.paymentTypeId !== filtroTipoPagto)
          return false;

        // Filtro de responsável cobrança
        if (
          filtroRespCobranca !== "todos" &&
          c.respCobrancaId !== filtroRespCobranca
        )
          return false;

        return true;
      })
      .map((c) => {
        const dueDate = parseISO(c.dueDate);
        const today = startOfDay(new Date());
        const isVencida = c.status === "pendente" && isBefore(dueDate, today);
        const isEmCobranca = c.status === "emCobranca";

        return { ...c, isVencida: isVencida, isEmCobranca: isEmCobranca };
      })
      .sort((a, b) => {
        if (ordenacao === "vencimento")
          return new Date(a.dueDate) - new Date(b.dueDate);
        if (ordenacao === "codigo")
          return (a.id || "").localeCompare(b.id || "");
        if (ordenacao === "valor") return (b.amount || 0) - (a.amount || 0);
        return 0;
      });

    setDisplayedContas(filtered);
    setShowResults(true);
  };

  const filteredContas = showResults ? displayedContas : [];

  // Cálculos de totais
  const totais = {
    recebido: contas
      .filter((c) => c.status === "pago")
      .reduce((sum, c) => sum + (c.amount || 0), 0),
    aReceber: filteredContas
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
      filteredContas.filter((c) => c.status === "pendente").map((c) => c.id),
    );
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
      for (const conta of contasToDelete) {
        await AccountsReceivable.delete(conta.id);
      }
      toast({
        title: "Sucesso",
        description: `${contasToDelete.length} conta(s) excluída(s) com sucesso!`,
      });
      setIsDeleteConfirmOpen(false);
      setSelectedContaForAction(null);
      setSelectedContas([]);
      loadData();
      if (showResults) applyFiltersAndShow();
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a(s) conta(s).",
        variant: "destructive",
      });
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

  const handleBaixar = () => {
    if (selectedContas.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos uma conta para baixar.",
        variant: "destructive",
      });
      return;
    }
    setIsBaixaOpen(true);
  };

  const handleConfirmBaixa = async (cashAccountId, paidDate) => {
    if (!cashAccountId || !currentUser) {
      toast({
        title: "Erro",
        description: "Dados incompletos para baixar as contas.",
        variant: "destructive",
      });
      return;
    }

    try {
      const receivingAccount = cashAccounts.find(
        (acc) => acc.id === cashAccountId,
      );
      if (!receivingAccount) {
        toast({
          title: "Erro",
          description: "Conta de caixa selecionada não encontrada.",
          variant: "destructive",
        });
        return;
      }

      // Buscar ou criar grupo financeiro
      let revenueGroup = await FinancialGroup.filter({
        name: "Receitas de Contas a Receber",
        companyId: currentUser.companyId,
      });
      if (revenueGroup.length === 0) {
        revenueGroup = [
          await FinancialGroup.create({
            name: "Receitas de Contas a Receber",
            type: "receita",
            active: true,
            companyId: currentUser.companyId,
            companyName: currentUser.companyName,
            createdByName: currentUser.fullName,
          }),
        ];
      }

      let totalBaixado = 0;

      for (const contaId of selectedContas) {
        const conta = contas.find((c) => c.id === contaId);
        if (!conta || conta.status === "pago") continue;

        // Criar movimento de caixa
        await CashMovement.create({
          cashAccountId: receivingAccount.id,
          cashAccountName: receivingAccount.name,
          type: "receita",
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
        await AccountsReceivable.update(contaId, {
          status: "pago",
          paymentDate: paidDate,
        });

        totalBaixado += conta.amount || 0;
      }

      // Atualizar saldo da conta
      const newBalance = (receivingAccount.balance || 0) + totalBaixado;
      await CashAccount.update(receivingAccount.id, { balance: newBalance });

      toast({
        title: "Sucesso",
        description: `${selectedContas.length} conta(s) baixada(s) com sucesso!`,
      });
      setIsBaixaOpen(false);
      setSelectedContas([]);
      await loadData();
      // Reaplicar filtros para atualizar a tabela com as novas cores
      setTimeout(() => {
        if (showResults) applyFiltersAndShow();
      }, 100);
    } catch (error) {
      console.error("Erro ao baixar contas:", error);
      toast({
        title: "Erro",
        description: `Não foi possível baixar as contas. ${error.message}`,
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
          .total-row { background-color: #f9f9f9; font-weight: bold; }
          .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; }
          @media print { body { padding: 10px; } button { display: none; } }
          .btn-print { display: block; margin: 20px auto; padding: 10px 30px; font-size: 14px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Relatório de Contas a Receber</h1>
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
              <th>Cliente</th>
            </tr>
          </thead>
          <tbody>
            ${contasToPrint
              .map(
                (conta) => `
              <tr>
                <td>${conta.createdDate ? format(parseISO(conta.createdDate), "dd/MM/yyyy") : "-"}</td>
                <td>${conta.saleId?.slice(-6) || "-"}</td>
                <td>${conta.nfeNumber || "-"}</td>
                <td>${format(parseISO(conta.dueDate), "dd/MM/yyyy")}</td>
                <td class="text-right">${formatCurrency(conta.amount)}</td>
                <td>${conta.paymentDate ? format(parseISO(conta.paymentDate), "dd/MM/yyyy") : "-"}</td>
                <td class="text-right">${conta.status === "pago" ? formatCurrency(conta.amount) : "-"}</td>
                <td>${conta.personName || "-"}</td>
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

  const handleQuickSacadoSearch = () => {
    if (tiposSacadoSelecionados === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um tipo de sacado.",
        variant: "destructive",
      });
      return;
    }
    setShowSacadoSearch(true);
  };

  const handleSair = () => {
    // Se tem callback de conclusão (modo modal), chama ele
    if (onComplete) {
      onComplete();
      return;
    }

    // Verifica se veio de alguma página específica via URL params
    const urlParams = new URLSearchParams(window.location.search);
    const returnTo = urlParams.get("return");

    if (returnTo === "cashMovements") {
      window.location.href = createPageUrl("CashMovements");
    } else {
      window.location.href = createPageUrl("Dashboard");
    }
  };

  // Handler para o botão Pesquisar da barra de ações
  const handlePesquisarClick = () => {
    // Abre modal de pesquisa baseado no método de pesquisa selecionado ou tipo de sacado
    if (metodoPesquisa === "notaFiscal") {
      setShowCodigoSearch(true);
    } else if (metodoPesquisa === "codigoVenda") {
      setShowCodigoSearch(true);
    } else if (metodoPesquisa === "documento") {
      setShowCodigoSearch(true);
    } else if (tiposSacadoSelecionados > 0 && !sacadoSelecionado) {
      setShowSacadoSearch(true);
    }
  };

  const handleQuickCodigoSearch = () => {
    setShowCodigoSearch(true);
  };

  const getRowColor = (conta) => {
    if (conta.status === "pago") return "bg-green-50";
    if (conta.status === "emCobranca") return "bg-blue-50";
    if (conta.isVencida) return "bg-red-50";
    return "";
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);

  // Dados para modal de pesquisa de código
  const getCodigoSearchData = () => {
    if (metodoPesquisa === "codigoVenda") {
      return contas.map((c) => ({
        id: c.id,
        label: c.saleId || c.id,
        extra: c.personName,
        conta: c,
      }));
    }
    if (metodoPesquisa === "notaFiscal") {
      return contas
        .filter((c) => c.nfeNumber)
        .map((c) => ({
          id: c.id,
          label: c.nfeNumber,
          extra: c.personName,
          conta: c,
        }));
    }
    if (metodoPesquisa === "documento") {
      return contas
        .filter((c) => c.personDocument)
        .map((c) => ({
          id: c.id,
          label: c.personDocument,
          extra: c.personName,
          conta: c,
        }));
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-300 p-4">
        <h1 className="text-xl font-bold text-slate-800">Contas a Receber</h1>
      </div>

      {/* Dialogs */}
      <BaixaDialog
        isOpen={isBaixaOpen}
        onClose={() => setIsBaixaOpen(false)}
        onConfirm={handleConfirmBaixa}
        cashAccounts={cashAccounts}
        contas={selectedContas
          .map((id) => contas.find((c) => c.id === id))
          .filter(Boolean)}
        totalSelecionado={totais.selecionado}
      />

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-full mx-auto space-y-4">
          {/* SEÇÃO DE FILTROS - CAIXA ÚNICA */}
          <Card className="bg-white border-slate-300">
            <CardContent className="p-4">
              <div className="grid grid-cols-12 gap-4">
                {/* COLUNA 1: PESQUISAR */}
                <div className="col-span-4 pr-4 border-r border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-3">
                    Pesquisar
                  </h4>

                  {/* Tipo Sacado */}
                  <div className="mb-3">
                    <Label className="text-xs font-medium">Tipo Sacado:</Label>
                    <div className="flex gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Checkbox
                          id="cliente"
                          checked={tipoSacado.cliente}
                          onCheckedChange={(v) =>
                            setTipoSacado((p) => ({ ...p, cliente: v }))
                          }
                        />
                        <label htmlFor="cliente" className="text-xs">
                          Cliente
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <Checkbox
                          id="pontoVenda"
                          checked={tipoSacado.pontoVenda}
                          onCheckedChange={(v) =>
                            setTipoSacado((p) => ({ ...p, pontoVenda: v }))
                          }
                        />
                        <label htmlFor="pontoVenda" className="text-xs">
                          Pto. Venda
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <Checkbox
                          id="conveniada"
                          checked={tipoSacado.conveniada}
                          onCheckedChange={(v) =>
                            setTipoSacado((p) => ({ ...p, conveniada: v }))
                          }
                        />
                        <label htmlFor="conveniada" className="text-xs">
                          Convênio
                        </label>
                      </div>
                    </div>

                    {/* Campo de sacado selecionado */}
                    <div className="flex gap-1 mt-2">
                      <div className="flex-1 relative">
                        <Input
                          value={sacadoSelecionado?.name || ""}
                          readOnly
                          placeholder="Use o botão Pesquisar"
                          className="h-7 text-xs pr-6 bg-slate-50"
                        />
                        {sacadoSelecionado && (
                          <button
                            onClick={() => setSacadoSelecionado(null)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Método de Pesquisa por Código */}
                  <div className="border-t border-slate-200 pt-3">
                    <Label className="text-xs font-medium mb-2 block">
                      Pesquisar por:
                    </Label>
                    <RadioGroup
                      value={metodoPesquisa}
                      onValueChange={setMetodoPesquisa}
                      className="flex gap-3 mb-2"
                    >
                      <div className="flex items-center gap-1">
                        <RadioGroupItem value="codigoVenda" id="codigoVenda" />
                        <label htmlFor="codigoVenda" className="text-xs">
                          Cód. Venda
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <RadioGroupItem value="notaFiscal" id="notaFiscal" />
                        <label htmlFor="notaFiscal" className="text-xs">
                          Nota Fiscal
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <RadioGroupItem value="documento" id="documento" />
                        <label htmlFor="documento" className="text-xs">
                          Documento
                        </label>
                      </div>
                    </RadioGroup>

                    <div className="flex gap-1">
                      <div className="flex-1 relative">
                        <Input
                          value={codigoPesquisa}
                          readOnly
                          placeholder="Use o botão Pesquisar"
                          className="h-7 text-xs pr-6 bg-slate-50"
                        />
                        {codigoPesquisa && (
                          <button
                            onClick={() => setCodigoPesquisa("")}
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUNA 2: FILTROS */}
                <div className="col-span-5 px-4 border-r border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase mb-3">
                    Filtros
                  </h4>

                  <div className="grid grid-cols-2 gap-3 mb-3">
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
                      <Label className="text-xs">Setor:</Label>
                      <Select
                        value={filtroSetor}
                        onValueChange={setFiltroSetor}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {sectors.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Tipo Pagto.:</Label>
                      <Select
                        value={filtroTipoPagto}
                        onValueChange={setFiltroTipoPagto}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {paymentTypes.map((pt) => (
                            <SelectItem key={pt.id} value={pt.id}>
                              {pt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Resp. Cob.:</Label>
                      <Select
                        value={filtroRespCobranca}
                        onValueChange={setFiltroRespCobranca}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {employees.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-1">
                      <Checkbox
                        id="naoPaga"
                        checked={statusContas.naoPagas}
                        onCheckedChange={(v) =>
                          setStatusContas((p) => ({ ...p, naoPagas: v }))
                        }
                      />
                      <label htmlFor="naoPaga" className="text-xs">
                        Não Paga
                      </label>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox
                        id="paga"
                        checked={statusContas.pagas}
                        onCheckedChange={(v) =>
                          setStatusContas((p) => ({ ...p, pagas: v }))
                        }
                      />
                      <label htmlFor="paga" className="text-xs">
                        Paga
                      </label>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox
                        id="emCobranca"
                        checked={statusContas.emCobranca}
                        onCheckedChange={(v) =>
                          setStatusContas((p) => ({ ...p, emCobranca: v }))
                        }
                      />
                      <label htmlFor="emCobranca" className="text-xs">
                        Em Cobrança
                      </label>
                    </div>
                  </div>

                  {/* Período */}
                  <div className="border-t border-slate-200 pt-3 mt-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="usarPeriodo"
                          checked={usarPeriodo}
                          onCheckedChange={setUsarPeriodo}
                        />
                        <label
                          htmlFor="usarPeriodo"
                          className="text-xs font-medium"
                        >
                          Período
                        </label>
                      </div>

                      <div
                        className={`flex flex-col gap-1 ${!usarPeriodo ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <div className="flex items-center gap-1">
                          <Label className="text-xs w-12">Início:</Label>
                          <Input
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            className="h-7 text-xs w-40"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Label className="text-xs w-12">Fim:</Label>
                          <Input
                            type="date"
                            value={dataFinal}
                            onChange={(e) => setDataFinal(e.target.value)}
                            className="h-7 text-xs w-40"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUNA 3: LEGENDA + ORDENAÇÃO */}
                <div className="col-span-3 pl-4">
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">
                      Legenda
                    </h4>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-400 rounded"></div>
                        <span className="text-xs">Vencida</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-400 rounded"></div>
                        <span className="text-xs">Paga</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-400 rounded"></div>
                        <span className="text-xs">Em cobrança</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">
                      Ordenação
                    </h4>
                    <RadioGroup
                      value={ordenacao}
                      onValueChange={setOrdenacao}
                      className="flex flex-col gap-1"
                    >
                      <div className="flex items-center gap-1">
                        <RadioGroupItem value="vencimento" id="ordVencimento" />
                        <label htmlFor="ordVencimento" className="text-xs">
                          Vencimento
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <RadioGroupItem value="codigo" id="ordCodigo" />
                        <label htmlFor="ordCodigo" className="text-xs">
                          Código
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <RadioGroupItem value="valor" id="ordValor" />
                        <label htmlFor="ordValor" className="text-xs">
                          Valor
                        </label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button
                    className="w-full mt-4 text-white text-xs h-9 gap-1"
                    style={{ backgroundColor: "#e78b3a" }}
                    onClick={applyFiltersAndShow}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GRID DE CONTAS */}
          <Card className="bg-white border-slate-300">
            <CardContent className="p-0">
              <div className="max-h-[350px] overflow-auto">
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
                        <TableHead className="text-xs w-20">Tp Pagto</TableHead>
                        <TableHead className="text-xs w-12">Parc</TableHead>
                        <TableHead className="text-xs w-24">
                          Dt Vencto
                        </TableHead>
                        <TableHead className="text-xs w-24 text-right">
                          Valor
                        </TableHead>
                        <TableHead className="text-xs w-24">
                          Dt Receb.
                        </TableHead>
                        <TableHead className="text-xs w-24 text-right">
                          Vl Receb.
                        </TableHead>
                        <TableHead className="text-xs w-20">Situação</TableHead>
                        <TableHead className="text-xs">Sacado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center py-8">
                            Carregando...
                          </TableCell>
                        </TableRow>
                      ) : filteredContas.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={12}
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
                              <StyledCheckbox
                                checked={selectedContas.includes(conta.id)}
                                onCheckedChange={() =>
                                  toggleSelectConta(conta.id)
                                }
                                disabled={conta.status === "pago"}
                              />
                            </TableCell>
                            <TableCell className="text-xs">
                              {conta.createdDate
                                ? format(
                                    parseISO(conta.createdDate),
                                    "dd/MM/yy",
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {conta.saleId?.slice(-6) || conta.id?.slice(-6)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {conta.nfeNumber || "-"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {conta.paymentTypeName || "-"}
                            </TableCell>
                            <TableCell className="text-xs text-center">
                              {conta.installmentNumber || "1"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {format(parseISO(conta.dueDate), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono">
                              {formatCurrency(conta.amount)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {conta.paymentDate
                                ? format(
                                    parseISO(conta.paymentDate),
                                    "dd/MM/yyyy",
                                  )
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
                              ) : conta.status === "emCobranca" ? (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  Cobrança
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
                              {conta.personName}
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
              <p className="text-xs text-slate-600">Recebido:</p>
              <p className="text-sm font-bold text-green-600">
                {formatCurrency(totais.recebido)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-600">A receber:</p>
              <p className="text-sm font-bold text-blue-600">
                {formatCurrency(totais.aReceber)}
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
            onClick={handleBaixar}
            disabled={selectedContas.length === 0}
          >
            <DollarSign className="w-3 h-3" /> Baixar
          </Button>

          <div className="w-px h-6 bg-slate-400 mx-1" />

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            disabled={selectedContas.length === 0}
            onClick={() => setIsRenegociacaoOpen(true)}
          >
            <RefreshCw className="w-3 h-3" /> Renegocia
          </Button>
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
            onClick={() => setSelectedContas([])}
          >
            <X className="w-3 h-3" /> Desmarcar
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
            Agrupar
          </Button>
        </div>
      </div>

      {/* Modal de Pesquisa de Sacado */}
      <Dialog open={showSacadoSearch} onOpenChange={setShowSacadoSearch}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Pesquisar{" "}
              {[
                tipoSacado.cliente && "Clientes",
                tipoSacado.pontoVenda && "Pontos de Venda",
                tipoSacado.conveniada && "Convênios",
              ]
                .filter(Boolean)
                .join(", ")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Digite o nome para buscar..."
              value={sacadoSearchTerm}
              onChange={(e) => setSacadoSearchTerm(e.target.value)}
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
                    <TableHead className="text-xs">Documento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPeople
                    .filter((p) => {
                      if (!sacadoSearchTerm) return true;
                      const term = sacadoSearchTerm.toLowerCase();
                      return (
                        p.name?.toLowerCase().includes(term) ||
                        p.document?.toLowerCase().includes(term)
                      );
                    })
                    .map((p) => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer hover:bg-blue-50"
                        onDoubleClick={() => {
                          setSacadoSelecionado(p);
                          setShowSacadoSearch(false);
                          setSacadoSearchTerm("");
                          // Após selecionar, aplica os filtros automaticamente
                          setTimeout(() => applyFiltersAndShow(), 100);
                        }}
                      >
                        <TableCell className="text-xs font-mono">
                          {p.personNumber || p.id?.slice(-6)}
                        </TableCell>
                        <TableCell className="text-xs">{p.name}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-xs">
                            {p.type === "cliente"
                              ? "Cliente"
                              : p.type === "pontoVenda"
                                ? "Pto. Venda"
                                : "Convênio"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.document || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredPeople.filter((p) => {
                    if (!sacadoSearchTerm) return true;
                    const term = sacadoSearchTerm.toLowerCase();
                    return (
                      p.name?.toLowerCase().includes(term) ||
                      p.document?.toLowerCase().includes(term)
                    );
                  }).length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-slate-500"
                      >
                        Nenhum registro encontrado
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
              onClick={() => setShowSacadoSearch(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Pesquisa de Código */}
      <Dialog open={showCodigoSearch} onOpenChange={setShowCodigoSearch}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Pesquisar{" "}
              {metodoPesquisa === "codigoVenda"
                ? "Código de Venda"
                : metodoPesquisa === "notaFiscal"
                  ? "Nota Fiscal"
                  : "Documento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Filtrar..."
              value={codigoPesquisa}
              onChange={(e) => setCodigoPesquisa(e.target.value)}
              className="h-8"
              autoFocus
            />
            <div className="max-h-80 overflow-auto border rounded">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="text-xs">
                      {metodoPesquisa === "codigoVenda"
                        ? "Código"
                        : metodoPesquisa === "notaFiscal"
                          ? "Nota Fiscal"
                          : "Documento"}
                    </TableHead>
                    <TableHead className="text-xs">Sacado</TableHead>
                    <TableHead className="text-xs">Vencimento</TableHead>
                    <TableHead className="text-xs text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCodigoSearchData()
                    .filter((item) => {
                      if (!codigoPesquisa) return true;
                      const term = codigoPesquisa.toLowerCase();
                      return (
                        item.label?.toLowerCase().includes(term) ||
                        item.extra?.toLowerCase().includes(term)
                      );
                    })
                    .map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-blue-50"
                        onDoubleClick={() => {
                          setCodigoPesquisa(item.label);
                          setShowCodigoSearch(false);
                          setTimeout(() => applyFiltersAndShow(), 100);
                        }}
                      >
                        <TableCell className="text-xs font-mono">
                          {item.label?.slice(-8) || "-"}
                        </TableCell>
                        <TableCell className="text-xs">{item.extra}</TableCell>
                        <TableCell className="text-xs">
                          {item.conta.dueDate
                            ? format(parseISO(item.conta.dueDate), "dd/MM/yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {formatCurrency(item.conta.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  {getCodigoSearchData().filter((item) => {
                    if (!codigoPesquisa) return true;
                    const term = codigoPesquisa.toLowerCase();
                    return (
                      item.label?.toLowerCase().includes(term) ||
                      item.extra?.toLowerCase().includes(term)
                    );
                  }).length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-slate-500"
                      >
                        Nenhum registro encontrado
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
              onClick={() => setShowCodigoSearch(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Renegociação */}
      <RenegociacaoModal
        open={isRenegociacaoOpen}
        onOpenChange={setIsRenegociacaoOpen}
        currentUser={currentUser}
        sectors={sectors}
        cashAccounts={cashAccounts}
        contasSelecionadas={selectedContas
          .map((id) => contas.find((c) => c.id === id))
          .filter(Boolean)}
        onRenegociacaoComplete={() => {
          loadData();
          setSelectedContas([]);
          if (showResults) applyFiltersAndShow();
        }}
      />

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
                ? "estas contas a receber"
                : "esta conta a receber"}
              ?
            </p>
            {getSelectedContasForAction().length > 0 && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm space-y-2 max-h-40 overflow-auto">
                {getSelectedContasForAction().map((conta) => (
                  <div key={conta.id} className="border-b pb-2 last:border-0">
                    <p>
                      <strong>Cliente:</strong> {conta.personName}
                    </p>
                    <p>
                      <strong>Valor:</strong> {formatCurrency(conta.amount)}
                    </p>
                    <p>
                      <strong>Vencimento:</strong>{" "}
                      {format(parseISO(conta.dueDate), "dd/MM/yyyy")}
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
