import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Search,
  X,
  LogOut,
  Printer,
  Plus,
  FolderOpen,
  Folder,
  TrendingUp,
  TrendingDown,
  Fuel,
  CreditCard,
  Factory,
  Store,
  User,
  Edit,
  Trash2,
  Check,
  Save,
  Calculator,
  AlertCircle,
  ArrowRight,
  Upload,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CashMovement } from "@/entities/CashMovement";
import { CashAccount } from "@/entities/CashAccount";
import { Person } from "@/entities/Person";
import { Sector } from "@/entities/Sector";
import { SectorMaster } from "@/entities/SectorMaster";
import { FinancialGroup } from "@/entities/FinancialGroup";
import { FinancialSubgroup } from "@/entities/FinancialSubgroup";
import { PaymentType } from "@/entities/PaymentType";
import { AccountsReceivable } from "@/entities/AccountsReceivable";
import { ContasAPagar } from "@/entities/ContasAPagar";
import { User as UserEntity } from "@/entities/User";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FuelingModal from "@/components/financial/FuelingModal";
import ContasAPagarModal from "@/components/financial/ContasAPagarModal";
import AccountsReceivableFullModal from "@/components/financial/AccountsReceivableFullModal";

export default function CashMovementsPage({ onComplete }) {
  const { toast } = useToast();

  // Data states
  const [cashAccounts, setCashAccounts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [sectorMasters, setSectorMasters] = useState([]);
  const [people, setPeople] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Filter states
  const [selectedAccount, setSelectedAccount] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [activeTab, setActiveTab] = useState("gastar");

  // Balance states
  const [openingBalance, setOpeningBalance] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);

  // Form states
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [sacadoType, setSacadoType] = useState("cliente");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sacadoFieldFocused, setSacadoFieldFocused] = useState(false);
  const [sacadoError, setSacadoError] = useState("");
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [showFuelingModal, setShowFuelingModal] = useState(false);
  const [showContasAPagarModal, setShowContasAPagarModal] = useState(false);
  const [showContasAReceberModal, setShowContasAReceberModal] = useState(false);
  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);
  const [calculatedInstallments, setCalculatedInstallments] = useState([]);

  // Edit mode state: 'none' | 'incluir' | 'modificar'
  const [editMode, setEditMode] = useState("none");

  // Estado para evitar duplo clique no salvamento
  const [isSaving, setIsSaving] = useState(false);

  // Transfer form states
  const [transferData, setTransferData] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: 0,
    sectorId: "",
    sectorName: "",
    subgroupId: "",
    subgroupName: "",
    subgroupCode: "",
    subgroupError: "",
    groupId: "",
    groupName: "",
    transferDate: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const [formData, setFormData] = useState({
    sectorId: "",
    sectorName: "",
    description: "",
    subgroupId: "",
    subgroupName: "",
    groupId: "",
    groupName: "",
    personId: "",
    personName: "",
    documentNumber: "",
    competenceMonth: format(new Date(), "MM/yyyy"),
    movementDate: format(new Date(), "yyyy-MM-dd"),
    amount: 0,
    paymentTypeId: "",
    paymentTypeName: "",
    isAccounting: false,
    firstDueDate: "",
    entryValue: 0,
    installments: 1,
    interestRate: 0,
  });

  // Check if form has been modified
  const isFormDirty =
    formData.description ||
    formData.amount > 0 ||
    formData.movementDate ||
    transferData.amount > 0 ||
    transferData.toAccountId;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const formatMoneyDisplay = (value) => {
    if (!value && value !== 0) return "";
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const parseMoneyInput = (inputValue) => {
    if (!inputValue) return 0;
    const cleaned = inputValue.replace(/[^\d,]/g, "");
    const normalized = cleaned.replace(",", ".");
    return parseFloat(normalized) || 0;
  };

  const handleMoneyChange = (e, field, setter) => {
    const rawValue = e.target.value;
    const filtered = rawValue.replace(/[^\d,.]/g, "");
    setter((prev) => ({ ...prev, [field]: filtered }));
  };

  const handleMoneyBlur = (field, setter, currentValue) => {
    const numericValue = parseMoneyInput(currentValue);
    setter((prev) => ({ ...prev, [field]: numericValue }));
  };

  const loadData = useCallback(async () => {
    try {
      const user = await UserEntity.me();
      setCurrentUser(user);
      const companyId = user.companyId;

      if (!companyId) {
        toast({
          title: "Atenção",
          description: "Usuário não vinculado a uma empresa.",
          variant: "destructive",
        });
        return;
      }

      const [
        accountsData,
        sectorsData,
        sectorMastersData,
        peopleData,
        groupsData,
        subgroupsData,
        paymentTypesData,
      ] = await Promise.all([
        CashAccount.filter({ companyId, active: true }),
        Sector.filter({ companyId, active: true }),
        SectorMaster.filter({ companyId }),
        Person.filter({ companyId }),
        FinancialGroup.filter({ companyId, active: true }),
        FinancialSubgroup.filter({ companyId, active: true }),
        PaymentType.filter({ companyId, active: true }),
      ]);

      setCashAccounts(accountsData);
      setSectors(sectorsData);
      setSectorMasters(sectorMastersData);
      setPeople(peopleData);
      setGroups(groupsData);
      setSubgroups(subgroupsData);
      setPaymentTypes(paymentTypesData);

      if (accountsData.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsData[0].id);
      }

      // Selecionar "Dinheiro" como forma de pagamento padrão
      const dinheiroPt = paymentTypesData.find(
        (pt) =>
          pt.type === "dinheiro" || pt.name?.toLowerCase().includes("dinheiro"),
      );
      if (dinheiroPt) {
        setFormData((prev) => ({
          ...prev,
          paymentTypeId: dinheiroPt.id,
          paymentTypeName: dinheiroPt.name,
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados iniciais.",
        variant: "destructive",
      });
    }
  }, [selectedAccount, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Verificar se voltou do cadastro de pessoa com personId
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const personId = urlParams.get("personId");

    if (personId && people.length > 0) {
      const person = people.find((p) => p.id === personId);
      if (person) {
        setFormData((prev) => ({
          ...prev,
          personId: person.id,
          personName: person.name,
        }));
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
        setEditMode("incluir");
      }
    }
  }, [people]);

  useEffect(() => {
    const updateFinancials = async () => {
      if (!selectedAccount || !cashAccounts.length || !currentUser) {
        setMovements([]);
        setOpeningBalance(0);
        setCurrentBalance(0);
        return;
      }

      try {
        const account = cashAccounts.find((a) => a.id === selectedAccount);
        if (!account) return;

        const allMovements = await CashMovement.filter({
          companyId: currentUser.companyId,
          cashAccountId: selectedAccount,
        });

        const periodStart = startOfDay(new Date(startDate + "T00:00:00"));
        const periodEnd = endOfDay(new Date(endDate + "T23:59:59"));

        let opening = account.initialBalance || 0;
        allMovements
          .filter((m) => startOfDay(m.movementDate) < periodStart)
          .forEach((m) => {
            opening += m.type === "receita" ? m.amount : -m.amount;
          });
        setOpeningBalance(opening);

        const periodMovements = allMovements
          .filter((m) => {
            const movDate = m.movementDate;
            return movDate >= periodStart && movDate <= periodEnd;
          })
          .sort((a, b) => a.movementDate - b.movementDate);

        setMovements(periodMovements);

        const receitas = periodMovements
          .filter((m) => m.type === "receita")
          .reduce((sum, m) => sum + m.amount, 0);
        const despesas = periodMovements
          .filter((m) => m.type === "despesa")
          .reduce((sum, m) => sum + m.amount, 0);
        setCurrentBalance(opening + receitas - despesas);
      } catch (error) {
        console.error("Erro ao calcular finanças:", error);
      }
    };
    updateFinancials();
  }, [selectedAccount, startDate, endDate, cashAccounts, currentUser]);

  const filteredMovements = movements.filter((m) => {
    if (activeTab === "gastar") return m.type === "despesa";
    if (activeTab === "receber") return m.type === "receita";
    if (activeTab === "transferencia") return m.type === "transferencia";
    return true;
  });

  const handleRowClick = (movement) => {
    setSelectedMovement(movement);
    setFormData({
      sectorId: movement.sectorId || "",
      sectorName: movement.sectorName || "",
      description: movement.description || "",
      subgroupId: movement.subgroupId || "",
      subgroupName: movement.subgroupName || "",
      groupId: movement.groupId || "",
      groupName: movement.groupName || "",
      personId: movement.personId || "",
      personName: movement.personName || "",
      documentNumber: movement.documentNumber || "",
      competenceMonth:
        movement.competenceMonth || format(new Date(), "MM/yyyy"),
      movementDate: movement.movementDate || format(new Date(), "yyyy-MM-dd"),
      amount: movement.amount || 0,
      paymentTypeId: movement.paymentTypeId || "",
      paymentTypeName: movement.paymentTypeName || "",
      isAccounting: movement.isAccounting || false,
      firstDueDate: "",
      entryValue: 0,
      installments: 1,
      interestRate: 0,
    });
  };

  const handleSectorChange = (sectorId) => {
    const sector = sectors.find((s) => s.id === sectorId);
    setFormData((prev) => ({
      ...prev,
      sectorId: sectorId,
      sectorName: sector?.name || "",
    }));
  };

  const handleGroupChange = (groupId) => {
    const group = groups.find((g) => g.id === groupId);
    setFormData((prev) => ({
      ...prev,
      groupId: groupId,
      groupName: group?.name || "",
      subgroupId: "",
      subgroupName: "",
    }));
  };

  const handleSubgroupChange = (subgroupId) => {
    const subgroup = subgroups.find((sg) => sg.id === subgroupId);
    const group = subgroup
      ? groups.find((g) => g.id === subgroup.financialGroupId)
      : null;
    setFormData((prev) => ({
      ...prev,
      subgroupId: subgroupId,
      subgroupName: subgroup?.name || "",
      groupId: group?.id || prev.groupId,
      groupName: group?.name || prev.groupName,
    }));
  };

  const handlePersonChange = (personId) => {
    const person = people.find((p) => p.id === personId);
    setFormData((prev) => ({
      ...prev,
      personId: personId,
      personName: person?.name || "",
    }));
  };

  const resetTransferForm = () => {
    setTransferData({
      fromAccountId: cashAccounts.length > 0 ? cashAccounts[0].id : "",
      toAccountId: "",
      amount: 0,
      sectorId: "",
      sectorName: "",
      subgroupId: "",
      subgroupName: "",
      subgroupCode: "",
      subgroupError: "",
      groupId: "",
      groupName: "",
      transferDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    });
  };

  const resetForm = () => {
    setSelectedMovement(null);
    setSacadoType("cliente");
    setSacadoError("");
    setEditMode("none");
    resetTransferForm();
    const dinheiroPt = paymentTypes.find(
      (pt) =>
        pt.type === "dinheiro" || pt.name?.toLowerCase().includes("dinheiro"),
    );
    setFormData({
      sectorId: "",
      sectorName: "",
      description: "",
      subgroupId: "",
      subgroupName: "",
      groupId: "",
      groupName: "",
      personId: "",
      personName: "",
      documentNumber: "",
      competenceMonth: format(new Date(), "MM/yyyy"),
      movementDate: format(new Date(), "yyyy-MM-dd"),
      amount: 0,
      paymentTypeId: dinheiroPt?.id || "",
      paymentTypeName: dinheiroPt?.name || "",
      isAccounting: false,
      firstDueDate: "",
      entryValue: 0,
      installments: 1,
      interestRate: 0,
    });
  };

  const handleIncluir = () => {
    resetForm();
    setEditMode("incluir");
  };

  const handleModificar = () => {
    if (!selectedMovement) {
      toast({
        title: "Atenção",
        description: "Selecione um lançamento para modificar.",
        variant: "destructive",
      });
      return;
    }
    setEditMode("modificar");
  };

  const handleCancelar = () => {
    if (isFormDirty) {
      setShowCancelConfirm(true);
    } else {
      resetForm();
    }
  };

  const confirmCancelar = () => {
    setShowCancelConfirm(false);
    resetForm();
  };

  const handleExcluir = () => {
    if (!selectedMovement) {
      toast({
        title: "Atenção",
        description: "Selecione um lançamento para excluir.",
        variant: "destructive",
      });
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmExcluir = async () => {
    setShowDeleteConfirm(false);
    try {
      const account = cashAccounts.find((a) => a.id === selectedAccount);
      const balanceChange =
        selectedMovement.type === "receita"
          ? -selectedMovement.amount
          : selectedMovement.amount;

      await CashMovement.delete(selectedMovement.id);
      await CashAccount.update(selectedAccount, {
        balance: (account?.balance || 0) + balanceChange,
      });

      toast({
        title: "Sucesso",
        description: "Lançamento excluído com sucesso!",
      });
      resetForm();
      loadData();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro",
        description: "Falha ao excluir.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentTypeChange = (paymentTypeId) => {
    const pt = paymentTypes.find((p) => p.id === paymentTypeId);
    setFormData((prev) => ({
      ...prev,
      paymentTypeId: paymentTypeId,
      paymentTypeName: pt?.name || "",
      installments: pt?.maxInstallments > 1 ? prev.installments : 1,
      firstDueDate: pt?.maxInstallments > 1 ? prev.firstDueDate : "",
    }));
  };

  const selectedPaymentType = paymentTypes.find(
    (p) => p.id === formData.paymentTypeId,
  );
  const isInstallmentPayment = selectedPaymentType?.maxInstallments > 1;

  const handleSubmit = async () => {
    if (isSaving) return; // Evita duplo clique

    if (!formData.movementDate) {
      toast({
        title: "Erro",
        description: "Data é obrigatória.",
        variant: "destructive",
      });
      return;
    }
    if (formData.amount <= 0) {
      toast({
        title: "Erro",
        description: "Valor deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedAccount) {
      toast({
        title: "Erro",
        description: "Selecione uma conta.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.paymentTypeId) {
      toast({
        title: "Erro",
        description: "Selecione uma forma de pagamento.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.subgroupId) {
      toast({
        title: "Erro",
        description: "Selecione um sub grupo.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.groupId) {
      toast({
        title: "Erro",
        description: "Selecione um grupo.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.sectorId) {
      toast({
        title: "Erro",
        description: "Selecione um setor.",
        variant: "destructive",
      });
      return;
    }

    // Se for parcelado, o fluxo é diferente - usa a janela de parcelas
    if (isInstallmentPayment && formData.installments > 1) {
      toast({
        title: "Atenção",
        description:
          "Para pagamentos parcelados, use o botão 'Calcular' para gerar as parcelas.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const account = cashAccounts.find((a) => a.id === selectedAccount);
      const movementType = activeTab === "receber" ? "receita" : "despesa";

      // Verifica se é pagamento a prazo (forma de pagamento que permite parcelamento)
      // Se for despesa com pagamento a prazo, registra em Contas a Pagar ao invés do caixa
      if (movementType === "despesa" && isInstallmentPayment) {
        // Registrar em Contas a Pagar
        await ContasAPagar.create({
          supplierId: formData.personId,
          supplierName: formData.personName,
          description: formData.description,
          dueDate: formData.firstDueDate || formData.movementDate,
          amount: Number(formData.amount),
          status: "aberto",
          paymentTypeId: formData.paymentTypeId,
          paymentTypeName: formData.paymentTypeName,
          groupId: formData.groupId,
          groupName: formData.groupName,
          subgroupId: formData.subgroupId,
          subgroupName: formData.subgroupName,
          documentNumber: formData.documentNumber,
          companyId: currentUser.companyId,
          companyName: currentUser.companyName,
          createdByName: currentUser.name,
        });

        toast({
          title: "Sucesso",
          description: "Despesa registrada em Contas a Pagar!",
        });

        resetForm();
        setEditMode("none");
        loadData();
        return;
      }

      // Fluxo normal para pagamentos à vista
      const movementData = {
        cashAccountId: selectedAccount,
        cashAccountName: account?.name || "",
        type: movementType,
        description: formData.description,
        amount: Number(formData.amount),
        movementDate: formData.movementDate,
        sectorId: formData.sectorId,
        sectorName: formData.sectorName,
        personId: formData.personId,
        personName: formData.personName,
        groupId: formData.groupId,
        groupName: formData.groupName,
        subgroupId: formData.subgroupId,
        subgroupName: formData.subgroupName,
        documentNumber: formData.documentNumber,
        competenceMonth: formData.competenceMonth,
        paymentTypeId: formData.paymentTypeId,
        paymentTypeName: formData.paymentTypeName,
        isAccounting: formData.isAccounting,
        companyId: currentUser.companyId,
        companyName: currentUser.companyName,
        createdByName: currentUser.name,
      };

      if (selectedMovement) {
        await CashMovement.update(selectedMovement.id, movementData);
      } else {
        await CashMovement.create(movementData);

        const balanceChange =
          movementType === "receita"
            ? Number(formData.amount)
            : -Number(formData.amount);
        await CashAccount.update(selectedAccount, {
          balance: (account?.balance || 0) + balanceChange,
        });
      }

      toast({
        title: "Sucesso",
        description: selectedMovement
          ? "Lançamento atualizado!"
          : "Lançamento criado!",
      });

      resetForm();
      setEditMode("none");
      loadData();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar lançamento.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCalculateInstallments = () => {
    if (formData.installments <= 0 || formData.amount <= 0) return;
    if (!formData.firstDueDate) {
      toast({
        title: "Erro",
        description: "Informe a data do 1º vencimento.",
        variant: "destructive",
      });
      return;
    }

    const entryValue = Number(formData.entryValue) || 0;
    const totalAmount = Number(formData.amount);
    const remainingValue = totalAmount - entryValue;
    const interestRate = Number(formData.interestRate) || 0;
    const totalWithInterest = remainingValue * (1 + interestRate / 100);
    const installmentValue = totalWithInterest / formData.installments;

    const installments = [];

    // Data base para todas as parcelas (incluindo entrada)
    const baseDueDate = new Date(formData.firstDueDate + "T12:00:00");
    const dayOfMonth = baseDueDate.getDate();

    // Adiciona entrada se houver - usa a mesma data informada pelo usuário
    if (entryValue > 0) {
      installments.push({
        number: 0,
        description: "Entrada",
        dueDate: formData.firstDueDate, // Usa a data informada no campo VCTO ENTRADA
        amount: entryValue,
        isEntry: true,
      });
    }

    // Adiciona as parcelas
    for (let i = 0; i < formData.installments; i++) {
      let dueDate;

      if (i === 0) {
        // Primeira parcela: mesmo dia da entrada, mas no mês seguinte
        dueDate = new Date(baseDueDate);
        dueDate.setMonth(baseDueDate.getMonth() + 1);
        const lastDayOfMonth = new Date(
          dueDate.getFullYear(),
          dueDate.getMonth() + 1,
          0,
        ).getDate();
        dueDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
      } else {
        // Parcelas seguintes: mesmo dia nos meses seguintes
        dueDate = new Date(baseDueDate);
        dueDate.setMonth(baseDueDate.getMonth() + 1 + i);
        const lastDayOfMonth = new Date(
          dueDate.getFullYear(),
          dueDate.getMonth() + 1,
          0,
        ).getDate();
        dueDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
      }

      installments.push({
        number: i + 1,
        description: `Parcela ${i + 1}/${formData.installments}`,
        dueDate: format(dueDate, "yyyy-MM-dd"),
        amount: Math.round(installmentValue * 100) / 100,
        isEntry: false,
      });
    }

    setCalculatedInstallments(installments);
    setShowInstallmentsModal(true);
  };

  const handleInstallmentChange = (index, field, value) => {
    setCalculatedInstallments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleConfirmInstallments = async () => {
    if (calculatedInstallments.length === 0) return;
    if (isSaving) return;

    setIsSaving(true);
    try {
      const account = cashAccounts.find((a) => a.id === selectedAccount);
      const movementType = activeTab === "receber" ? "receita" : "despesa";

      // Processa cada parcela/entrada
      for (const installment of calculatedInstallments) {
        if (installment.isEntry && installment.amount > 0) {
          // Entrada vai direto para o caixa
          await CashMovement.create({
            cashAccountId: selectedAccount,
            cashAccountName: account?.name || "",
            type: movementType,
            description: `${formData.description} (Entrada)`,
            amount: Number(installment.amount),
            movementDate: installment.dueDate,
            sectorId: formData.sectorId,
            sectorName: formData.sectorName,
            personId: formData.personId,
            personName: formData.personName,
            groupId: formData.groupId,
            groupName: formData.groupName,
            subgroupId: formData.subgroupId,
            subgroupName: formData.subgroupName,
            documentNumber: formData.documentNumber,
            competenceMonth: formData.competenceMonth,
            paymentTypeId: formData.paymentTypeId,
            paymentTypeName: formData.paymentTypeName,
            companyId: currentUser.companyId,
            companyName: currentUser.companyName,
            createdByName: currentUser.name,
          });

          // Atualiza saldo da conta
          const balanceChange =
            movementType === "receita"
              ? Number(installment.amount)
              : -Number(installment.amount);
          await CashAccount.update(selectedAccount, {
            balance: (account?.balance || 0) + balanceChange,
          });
        } else if (!installment.isEntry) {
          // Parcelas vão para contas a pagar/receber
          if (activeTab === "receber") {
            await AccountsReceivable.create({
              personId: formData.personId,
              personName: formData.personName,
              description: `${formData.description} - ${installment.description}`,
              dueDate: installment.dueDate,
              amount: Number(installment.amount),
              installmentNumber: installment.number,
              status: "pendente",
              paymentTypeId: formData.paymentTypeId,
              paymentTypeName: formData.paymentTypeName,
              companyId: currentUser.companyId,
              companyName: currentUser.companyName,
              createdByName: currentUser.name,
            });
          } else {
            await ContasAPagar.create({
              supplierId: formData.personId,
              supplierName: formData.personName,
              description: `${formData.description} - ${installment.description}`,
              dueDate: installment.dueDate,
              amount: Number(installment.amount),
              installmentNumber: installment.number,
              status: "aberto",
              paymentTypeId: formData.paymentTypeId,
              paymentTypeName: formData.paymentTypeName,
              companyId: currentUser.companyId,
              companyName: currentUser.companyName,
              createdByName: currentUser.name,
            });
          }
        }
      }

      const entryAmount =
        calculatedInstallments.find((i) => i.isEntry)?.amount || 0;
      const parcelsCount = calculatedInstallments.filter(
        (i) => !i.isEntry,
      ).length;

      toast({
        title: "Sucesso",
        description: `Lançamento criado! ${entryAmount > 0 ? "Entrada registrada. " : ""}${parcelsCount} parcela(s) gerada(s) em ${activeTab === "receber" ? "Contas a Receber" : "Contas a Pagar"}.`,
      });

      setShowInstallmentsModal(false);
      setCalculatedInstallments([]);
      resetForm();
      setEditMode("none");
      loadData();
    } catch (error) {
      console.error("Erro ao salvar parcelas:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar parcelas.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const validateTransfer = () => {
    if (!transferData.fromAccountId) {
      toast({
        title: "Erro",
        description: "Selecione a conta de origem.",
        variant: "destructive",
      });
      return false;
    }
    if (!transferData.toAccountId) {
      toast({
        title: "Erro",
        description: "Selecione a conta de destino.",
        variant: "destructive",
      });
      return false;
    }
    if (transferData.fromAccountId === transferData.toAccountId) {
      toast({
        title: "Erro",
        description: "Conta de origem e destino não podem ser iguais.",
        variant: "destructive",
      });
      return false;
    }
    if (transferData.amount <= 0) {
      toast({
        title: "Erro",
        description: "Valor deve ser maior que zero.",
        variant: "destructive",
      });
      return false;
    }
    if (!transferData.transferDate) {
      toast({
        title: "Erro",
        description: "Data é obrigatória.",
        variant: "destructive",
      });
      return false;
    }
    if (!transferData.groupId) {
      toast({
        title: "Erro",
        description: "Selecione um grupo.",
        variant: "destructive",
      });
      return false;
    }
    if (!transferData.subgroupId) {
      toast({
        title: "Erro",
        description: "Selecione um sub-grupo.",
        variant: "destructive",
      });
      return false;
    }

    const fromAccount = cashAccounts.find(
      (a) => a.id === transferData.fromAccountId,
    );
    if (fromAccount && (fromAccount.balance || 0) < transferData.amount) {
      toast({
        title: "Erro",
        description: "Saldo insuficiente na conta de origem.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleTransferSubmit = async () => {
    if (isSaving) return;
    if (!validateTransfer()) return;
    setShowTransferConfirm(true);
  };

  const confirmTransfer = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const fromAccount = cashAccounts.find(
        (a) => a.id === transferData.fromAccountId,
      );
      const toAccount = cashAccounts.find(
        (a) => a.id === transferData.toAccountId,
      );

      await CashMovement.create({
        cashAccountId: transferData.fromAccountId,
        cashAccountName: fromAccount?.name || "",
        type: "despesa",
        description: `Transferência para ${toAccount?.name}`,
        amount: Number(transferData.amount),
        movementDate: transferData.transferDate,
        sectorId: transferData.sectorId,
        sectorName: transferData.sectorName || "TRANSFERÊNCIA",
        groupId: transferData.groupId,
        groupName: transferData.groupName,
        subgroupId: transferData.subgroupId,
        subgroupName: transferData.subgroupName,
        isTransfer: true,
        transferToAccountId: transferData.toAccountId,
        notes: transferData.notes,
        companyId: currentUser.companyId,
        companyName: currentUser.companyName,
        createdByName: currentUser.name,
      });

      await CashMovement.create({
        cashAccountId: transferData.toAccountId,
        cashAccountName: toAccount?.name || "",
        type: "receita",
        description: `Transferência de ${fromAccount?.name}`,
        amount: Number(transferData.amount),
        movementDate: transferData.transferDate,
        sectorId: transferData.sectorId,
        sectorName: transferData.sectorName || "TRANSFERÊNCIA",
        groupId: transferData.groupId,
        groupName: transferData.groupName,
        subgroupId: transferData.subgroupId,
        subgroupName: transferData.subgroupName,
        isTransfer: true,
        transferFromAccountId: transferData.fromAccountId,
        notes: transferData.notes,
        companyId: currentUser.companyId,
        companyName: currentUser.companyName,
        createdByName: currentUser.name,
      });

      await CashAccount.update(transferData.fromAccountId, {
        balance: (fromAccount?.balance || 0) - Number(transferData.amount),
      });
      await CashAccount.update(transferData.toAccountId, {
        balance: (toAccount?.balance || 0) + Number(transferData.amount),
      });

      toast({
        title: "Sucesso",
        description: "Transferência realizada com sucesso!",
      });
      setShowTransferConfirm(false);
      resetTransferForm();
      setEditMode("none");
      loadData();
    } catch (error) {
      console.error("Erro na transferência:", error);
      toast({
        title: "Erro",
        description: "Falha ao realizar transferência.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const masterSector = sectors.find((s) => s.isOwnStock);

  const isFormDisabled = editMode === "none";
  const disabledInputClass = isFormDisabled
    ? "bg-slate-100 text-slate-500 cursor-not-allowed"
    : "bg-white";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header - Filtros */}
      <div className="bg-white border-b border-slate-300 p-4">
        <div className="max-w-full mx-auto">
          <h1 className="text-xl font-bold text-slate-800 mb-4">
            Lançamentos Financeiros
          </h1>

          <div className="flex flex-wrap items-end gap-4">
            <div className="w-52">
              <Label className="text-xs font-medium">Conta</Label>
              <Select
                value={selectedAccount}
                onValueChange={setSelectedAccount}
              >
                <SelectTrigger className="h-9 bg-white border-slate-300">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {cashAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <div>
                <Label className="text-xs font-medium">Período</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 w-36 bg-white border-slate-300"
                />
              </div>
              <span className="text-slate-500 pb-2">a</span>
              <div>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 w-36 bg-white border-slate-300"
                />
              </div>
            </div>

            <div className="ml-auto text-right">
              <Label className="text-xs font-medium text-slate-600">
                Saldo Anterior
              </Label>
              <p
                className={`text-xl font-bold ${openingBalance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(openingBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-full mx-auto space-y-4">
          {/* Grid de Transações */}
          <Card className="bg-white border-slate-300">
            <CardContent className="p-0">
              <div className="max-h-72 overflow-auto">
                <Table>
                  <TableHeader className="bg-slate-100 sticky top-0">
                    <TableRow>
                      <TableHead className="w-16 text-xs">Cod</TableHead>
                      <TableHead className="w-12 text-xs">Parc.</TableHead>
                      <TableHead className="w-20 text-xs">Data</TableHead>
                      <TableHead className="w-24 text-xs">Setor</TableHead>
                      <TableHead className="text-xs">Favorecido</TableHead>
                      <TableHead className="w-24 text-right text-xs">
                        Gastar
                      </TableHead>
                      <TableHead className="w-24 text-right text-xs">
                        Receber
                      </TableHead>
                      <TableHead className="w-28 text-right text-xs">
                        Saldo
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-slate-500 py-8"
                        >
                          Nenhum lançamento encontrado para o período
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMovements.map((mov, idx) => {
                        const runningBalance =
                          openingBalance +
                          movements
                            .slice(
                              0,
                              movements.findIndex((m) => m.id === mov.id) + 1,
                            )
                            .reduce(
                              (acc, m) =>
                                acc +
                                (m.type === "receita" ? m.amount : -m.amount),
                              0,
                            );

                        return (
                          <TableRow
                            key={mov.id}
                            className={`cursor-pointer hover:bg-blue-50 ${selectedMovement?.id === mov.id ? "bg-blue-100" : ""}`}
                            onClick={() => handleRowClick(mov)}
                          >
                            <TableCell className="text-xs font-mono">
                              {String(idx + 1).padStart(4, "0")}
                            </TableCell>
                            <TableCell className="text-xs">
                              {mov.installmentNumber || "-"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {format(mov.movementDate, "dd/MM/yy")}
                            </TableCell>
                            <TableCell className="text-xs">
                              {mov.sectorName || "-"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {mov.personName || mov.description}
                            </TableCell>
                            <TableCell className="text-right text-xs font-mono text-red-600">
                              {mov.type === "despesa"
                                ? formatCurrency(mov.amount)
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right text-xs font-mono text-green-600">
                              {mov.type === "receita"
                                ? formatCurrency(mov.amount)
                                : "-"}
                            </TableCell>
                            <TableCell
                              className={`text-right text-xs font-mono font-bold ${runningBalance >= 0 ? "text-green-700" : "text-red-700"}`}
                            >
                              {formatCurrency(runningBalance)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Abas + Formulário unidos */}
          <Card className="bg-white border-slate-300 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full justify-start rounded-none bg-slate-100 h-10 p-0 border-b-0">
                <TabsTrigger
                  value="gastar"
                  className="rounded-none rounded-t-lg border border-b-0 border-transparent data-[state=active]:border-slate-300 data-[state=active]:bg-white data-[state=active]:border-b-white px-6 h-10 -mb-px"
                >
                  Gastar
                </TabsTrigger>
                <TabsTrigger
                  value="receber"
                  className="rounded-none rounded-t-lg border border-b-0 border-transparent data-[state=active]:border-slate-300 data-[state=active]:bg-white data-[state=active]:border-b-white px-6 h-10 -mb-px"
                >
                  Receber
                </TabsTrigger>
                <TabsTrigger
                  value="transferencia"
                  className="rounded-none rounded-t-lg border border-b-0 border-transparent data-[state=active]:border-slate-300 data-[state=active]:bg-white data-[state=active]:border-b-white px-6 h-10 -mb-px"
                >
                  Transferência
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <CardContent className="p-4 border-t border-slate-300">
              {activeTab === "transferencia" ? (
                <div
                  className={`space-y-3 ${isFormDisabled ? "opacity-60" : ""}`}
                >
                  {/* Linha 1: De + Data */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium flex items-center gap-1">
                        <Upload className="w-3 h-3" /> De:{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={transferData.fromAccountId}
                        onValueChange={(v) =>
                          setTransferData((prev) => ({
                            ...prev,
                            fromAccountId: v,
                            toAccountId:
                              prev.toAccountId === v ? "" : prev.toAccountId,
                          }))
                        }
                        disabled={isFormDisabled}
                      >
                        <SelectTrigger
                          className={`h-8 border-slate-300 ${disabledInputClass}`}
                        >
                          <SelectValue placeholder="Selecionar conta origem..." />
                        </SelectTrigger>
                        <SelectContent>
                          {cashAccounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">
                        Data <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={transferData.transferDate}
                        onChange={(e) =>
                          setTransferData((prev) => ({
                            ...prev,
                            transferDate: e.target.value,
                          }))
                        }
                        className={`h-8 border-slate-300 ${disabledInputClass}`}
                        disabled={isFormDisabled}
                      />
                    </div>
                  </div>

                  {/* Linha 2: Para + Sub-Grupo */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium flex items-center gap-1">
                        <Download className="w-3 h-3" /> Para:{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={transferData.toAccountId}
                        onValueChange={(v) =>
                          setTransferData((prev) => ({
                            ...prev,
                            toAccountId: v,
                          }))
                        }
                        disabled={isFormDisabled}
                      >
                        <SelectTrigger
                          className={`h-8 border-slate-300 ${disabledInputClass}`}
                        >
                          <SelectValue placeholder="Selecionar conta destino..." />
                        </SelectTrigger>
                        <SelectContent>
                          {cashAccounts
                            .filter(
                              (acc) => acc.id !== transferData.fromAccountId,
                            )
                            .map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">
                        Sub-Grupo <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={transferData.subgroupId}
                        onValueChange={(v) => {
                          const sg = subgroups.find((s) => s.id === v);
                          const group = sg
                            ? groups.find((g) => g.id === sg.financialGroupId)
                            : null;
                          setTransferData((prev) => ({
                            ...prev,
                            subgroupId: v,
                            subgroupName: sg?.name || "",
                            subgroupCode: sg?.id.slice(-6) || "",
                            subgroupError: "",
                            groupId: group?.id || prev.groupId,
                            groupName: group?.name || prev.groupName,
                          }));
                        }}
                        disabled={isFormDisabled}
                      >
                        <SelectTrigger
                          className={`h-8 border-slate-300 ${disabledInputClass}`}
                        >
                          <SelectValue placeholder="Selecionar sub-grupo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {subgroups
                            .filter(
                              (sg) =>
                                !transferData.groupId ||
                                sg.financialGroupId === transferData.groupId,
                            )
                            .map((sg) => (
                              <SelectItem key={sg.id} value={sg.id}>
                                {sg.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Linha 3: Grupo + Setor */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium">
                        Grupo <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={transferData.groupId}
                        onValueChange={(v) => {
                          const g = groups.find((gr) => gr.id === v);
                          setTransferData((prev) => ({
                            ...prev,
                            groupId: v,
                            groupName: g?.name || "",
                            subgroupId: "",
                            subgroupName: "",
                          }));
                        }}
                        disabled={isFormDisabled}
                      >
                        <SelectTrigger
                          className={`h-8 border-slate-300 ${disabledInputClass}`}
                        >
                          <SelectValue placeholder="Selecionar grupo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">
                        Setor <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={transferData.sectorId}
                        onValueChange={(v) => {
                          const sector = sectors.find((s) => s.id === v);
                          const sectorMaster = sectorMasters.find(
                            (sm) => sm.id === v,
                          );
                          setTransferData((prev) => ({
                            ...prev,
                            sectorId: v,
                            sectorName:
                              sector?.name || sectorMaster?.name || "",
                          }));
                        }}
                        disabled={isFormDisabled}
                      >
                        <SelectTrigger
                          className={`h-8 border-slate-300 ${disabledInputClass}`}
                        >
                          <SelectValue placeholder="Selecionar setor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sectorMasters.length > 0 &&
                            sectorMasters.map((sm) => (
                              <SelectItem key={sm.id} value={sm.id}>
                                {sm.name} (Master)
                              </SelectItem>
                            ))}
                          {sectors.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Linha 4: Valor + Obs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium">
                        Valor <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={
                          typeof transferData.amount === "number"
                            ? formatMoneyDisplay(transferData.amount)
                            : transferData.amount
                        }
                        onChange={(e) =>
                          handleMoneyChange(e, "amount", setTransferData)
                        }
                        onBlur={() =>
                          handleMoneyBlur(
                            "amount",
                            setTransferData,
                            transferData.amount,
                          )
                        }
                        placeholder="0,00"
                        className={`h-8 border-slate-300 text-right ${disabledInputClass}`}
                        disabled={isFormDisabled}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Obs.:</Label>
                      <Input
                        value={transferData.notes}
                        onChange={(e) =>
                          setTransferData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="Observações da transferência..."
                        className={`h-8 border-slate-300 ${disabledInputClass}`}
                        disabled={isFormDisabled}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isFormDisabled ? "opacity-60" : ""}`}
                  >
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium">
                          Setor <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2 items-center">
                          <Select
                            value={formData.sectorId}
                            onValueChange={handleSectorChange}
                            disabled={isFormDisabled}
                          >
                            <SelectTrigger
                              className={`h-8 border-slate-300 flex-1 ${disabledInputClass}`}
                            >
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {sectorMasters.length > 0 && (
                                <>
                                  {sectorMasters.map((sm) => (
                                    <SelectItem key={sm.id} value={sm.id}>
                                      {sm.name} (Master)
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                              {sectors.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {masterSector &&
                            formData.sectorId === masterSector.id && (
                              <Badge variant="secondary" className="text-xs">
                                (Master)
                              </Badge>
                            )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-medium">Descrição</Label>
                        <Input
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Digite a descrição"
                          className={`h-8 border-slate-300 ${disabledInputClass}`}
                          disabled={isFormDisabled}
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium">
                          Sub Grupo <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.subgroupId}
                          onValueChange={handleSubgroupChange}
                          disabled={isFormDisabled}
                        >
                          <SelectTrigger
                            className={`h-8 border-slate-300 ${disabledInputClass}`}
                          >
                            <SelectValue placeholder="Selecionar sub grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            {subgroups
                              .filter(
                                (sg) =>
                                  !formData.groupId ||
                                  sg.financialGroupId === formData.groupId,
                              )
                              .map((sg) => (
                                <SelectItem key={sg.id} value={sg.id}>
                                  {sg.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs font-medium">
                          Grupo <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.groupId}
                          onValueChange={handleGroupChange}
                          disabled={isFormDisabled}
                        >
                          <SelectTrigger
                            className={`h-8 border-slate-300 ${disabledInputClass}`}
                          >
                            <SelectValue placeholder="Selecionar grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs font-medium">
                          Valor <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={
                            typeof formData.amount === "number"
                              ? formatMoneyDisplay(formData.amount)
                              : formData.amount
                          }
                          onChange={(e) =>
                            handleMoneyChange(e, "amount", setFormData)
                          }
                          onBlur={() =>
                            handleMoneyBlur(
                              "amount",
                              setFormData,
                              formData.amount,
                            )
                          }
                          placeholder="0,00"
                          className={`h-8 border-slate-300 text-right ${disabledInputClass}`}
                          disabled={isFormDisabled}
                        />
                      </div>

                      {activeTab === "receber" ? (
                        <div>
                          <Label className="text-xs font-medium">Sacado</Label>
                          <RadioGroup
                            value={sacadoType}
                            onValueChange={(v) => {
                              setSacadoType(v);
                              setFormData((prev) => ({
                                ...prev,
                                personId: "",
                                personName: "",
                              }));
                              setSacadoError("");
                            }}
                            className="flex gap-4 mt-1"
                            disabled={isFormDisabled}
                          >
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem
                                value="cliente"
                                id="sacadoCliente"
                                disabled={isFormDisabled}
                              />
                              <Label
                                htmlFor="sacadoCliente"
                                className="text-xs"
                              >
                                Cliente
                              </Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem
                                value="pontoVenda"
                                id="sacadoPdv"
                                disabled={isFormDisabled}
                              />
                              <Label htmlFor="sacadoPdv" className="text-xs">
                                Pto. Venda
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      <div className="text-right mb-4">
                        <Label className="text-xs font-medium text-slate-600">
                          Saldo Atual...
                        </Label>
                        <p
                          className={`text-xl font-bold ${currentBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {formatCurrency(currentBalance)}
                        </p>
                      </div>

                      <div>
                        <Label className="text-xs font-medium">Doc.</Label>
                        <Input
                          value={formData.documentNumber}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              documentNumber: e.target.value,
                            }))
                          }
                          placeholder="Número do documento"
                          className={`h-8 border-slate-300 ${disabledInputClass}`}
                          disabled={isFormDisabled}
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium">
                          Mês de Competência
                        </Label>
                        <Input
                          value={formData.competenceMonth}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              competenceMonth: e.target.value,
                            }))
                          }
                          placeholder="MM/AAAA"
                          className={`h-8 border-slate-300 ${disabledInputClass}`}
                          disabled={isFormDisabled}
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium">
                          Data <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={formData.movementDate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              movementDate: e.target.value,
                            }))
                          }
                          className={`h-8 border-slate-300 ${disabledInputClass}`}
                          disabled={isFormDisabled}
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium">
                          Forma de Pagamento{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.paymentTypeId}
                          onValueChange={handlePaymentTypeChange}
                          disabled={isFormDisabled}
                        >
                          <SelectTrigger
                            className={`h-8 border-slate-300 ${disabledInputClass}`}
                          >
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentTypes.map((pt) => (
                              <SelectItem key={pt.id} value={pt.id}>
                                {pt.name}{" "}
                                {pt.maxInstallments > 1
                                  ? `(até ${pt.maxInstallments}x)`
                                  : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {activeTab === "receber" ? (
                        <div>
                          <Label className="text-xs font-medium">
                            {sacadoType === "cliente"
                              ? "Cliente"
                              : "Pto. Venda"}
                          </Label>
                          <Input
                            value={
                              formData.personId
                                ? `${formData.personName}`
                                : formData.sacadoInput || ""
                            }
                            onFocus={() => setSacadoFieldFocused(true)}
                            onBlur={() =>
                              setTimeout(
                                () => setSacadoFieldFocused(false),
                                200,
                              )
                            }
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                sacadoInput: e.target.value,
                                personId: "",
                                personName: "",
                              }));
                              setSacadoError("");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const code = formData.sacadoInput?.trim();
                                if (!code) return;

                                const found = people.find(
                                  (p) =>
                                    p.type === sacadoType &&
                                    (p.personNumber === code ||
                                      p.id.endsWith(code)),
                                );

                                if (found) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    personId: found.id,
                                    personName: found.name,
                                    sacadoInput: "",
                                  }));
                                  setSacadoError("");
                                } else {
                                  setSacadoError(
                                    "Código não encontrado. Use o botão Pesquisar.",
                                  );
                                }
                              }
                            }}
                            placeholder="Digite o código e pressione ENTER"
                            className={`h-8 ${disabledInputClass} ${sacadoError ? "border-red-500" : sacadoFieldFocused ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-300"}`}
                            disabled={isFormDisabled}
                          />
                          {sacadoError && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {sacadoError}
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Seção de Parcelamento */}
                  {isInstallmentPayment && (
                    <div
                      className={`mt-4 pt-4 border-t border-slate-200 ${isFormDisabled ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      {/* Campo Fornecedor para aba Gastar com pagamento a prazo */}
                      {activeTab === "gastar" && (
                        <div className="mb-4">
                          <Label className="text-xs font-medium">
                            Fornecedor
                          </Label>
                          <Input
                            value={
                              formData.personId
                                ? `${formData.personName}`
                                : formData.fornecedorInput || ""
                            }
                            onFocus={() => setSacadoFieldFocused(true)}
                            onBlur={() =>
                              setTimeout(
                                () => setSacadoFieldFocused(false),
                                200,
                              )
                            }
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                fornecedorInput: e.target.value,
                                personId: "",
                                personName: "",
                              }));
                              setSacadoError("");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const code = formData.fornecedorInput?.trim();
                                if (!code) return;

                                const found = people.find(
                                  (p) =>
                                    p.type === "fornecedor" &&
                                    (p.personNumber === code ||
                                      p.id.endsWith(code)),
                                );

                                if (found) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    personId: found.id,
                                    personName: found.name,
                                    fornecedorInput: "",
                                  }));
                                  setSacadoError("");
                                } else {
                                  setSacadoError(
                                    "Código não encontrado. Use o botão Pesquisar.",
                                  );
                                }
                              }
                            }}
                            placeholder="Informe o fornecedor"
                            className={`h-8 ${disabledInputClass} ${sacadoError ? "border-red-500" : sacadoFieldFocused ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-300"}`}
                            disabled={isFormDisabled}
                          />
                          {sacadoError && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {sacadoError}
                            </p>
                          )}
                        </div>
                      )}

                      <h3 className="text-sm font-semibold text-slate-700 mb-3">
                        Parcelamento{" "}
                        {selectedPaymentType
                          ? `(até ${selectedPaymentType.maxInstallments}x)`
                          : ""}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs font-medium">
                            Vcto. Entrada{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="date"
                            value={formData.firstDueDate}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                firstDueDate: e.target.value,
                              }))
                            }
                            className={`h-8 border-slate-300 ${disabledInputClass}`}
                            disabled={isFormDisabled}
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-medium">
                            Vl. Entrada
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={
                                typeof formData.entryValue === "number"
                                  ? formatMoneyDisplay(formData.entryValue)
                                  : formData.entryValue
                              }
                              onChange={(e) =>
                                handleMoneyChange(e, "entryValue", setFormData)
                              }
                              onBlur={() =>
                                handleMoneyBlur(
                                  "entryValue",
                                  setFormData,
                                  formData.entryValue,
                                )
                              }
                              placeholder="0,00"
                              className={`h-8 border-slate-300 text-right ${disabledInputClass}`}
                              disabled={isFormDisabled}
                            />
                            <span className="text-slate-700 font-bold text-base pb-0.5">
                              +
                            </span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-medium">
                            Nº Parcelas
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            max={selectedPaymentType?.maxInstallments || 1}
                            value={formData.installments}
                            onChange={(e) => {
                              const max =
                                selectedPaymentType?.maxInstallments || 1;
                              const value = Math.min(
                                Number(e.target.value),
                                max,
                              );
                              setFormData((prev) => ({
                                ...prev,
                                installments: value,
                              }));
                            }}
                            className={`h-8 border-slate-300 ${disabledInputClass}`}
                            disabled={isFormDisabled}
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-medium">&nbsp;</Label>
                          <Button
                            type="button"
                            variant="secondary"
                            className="w-full h-8 text-xs"
                            onClick={handleCalculateInstallments}
                            disabled={isFormDisabled}
                          >
                            <Calculator className="w-4 h-4 mr-1" />
                            Calcular
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Barra de Ações */}
      <div className="bg-slate-200 border-t border-slate-300 p-2">
        <div className="flex flex-wrap gap-1 items-center">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1"
            disabled={!selectedMovement || editMode !== "none"}
            onClick={handleModificar}
          >
            <Edit className="w-4 h-4" /> Alterar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1 text-red-600 hover:bg-red-50"
            disabled={!selectedMovement || editMode !== "none"}
            onClick={handleExcluir}
          >
            <Trash2 className="w-4 h-4" /> Excluir
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1"
            disabled={editMode !== "none"}
            onClick={handleIncluir}
          >
            <Plus className="w-4 h-4" /> Incluir
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1"
            disabled={editMode === "none"}
            onClick={() => {
              if (activeTab === "receber" || activeTab === "gastar") {
                setShowSearchModal(true);
              }
            }}
          >
            <Search className="w-4 h-4" /> Pesquisar
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-9 text-xs gap-1 text-white hover:opacity-90"
            style={{ backgroundColor: "#e78b3a" }}
            disabled={editMode === "none" || isSaving}
            onClick={
              activeTab === "transferencia"
                ? handleTransferSubmit
                : handleSubmit
            }
            type="button"
          >
            <Save className="w-4 h-4" /> {isSaving ? "Salvando..." : "Ok"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1"
            disabled={editMode === "none"}
            onClick={handleCancelar}
          >
            <X className="w-4 h-4" /> Cancelar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1"
            disabled={editMode !== "none"}
            onClick={() => {
              if (onComplete) {
                onComplete();
              } else {
                window.location.href = createPageUrl("Dashboard");
              }
            }}
          >
            <LogOut className="w-4 h-4" /> Sair
          </Button>

          <div className="w-px h-6 bg-slate-400 mx-1" />

          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1"
            disabled={editMode !== "none"}
          >
            <Printer className="w-4 h-4" /> Imprimir
          </Button>

          <div className="w-px h-6 bg-slate-400 mx-1" />

          <Link to={createPageUrl("FinancialGroups")}>
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1">
              <FolderOpen className="w-4 h-4" /> Grupo
            </Button>
          </Link>
          <Link to={createPageUrl("FinancialSubgroups")}>
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1">
              <Folder className="w-4 h-4" /> SubGrupo
            </Button>
          </Link>

          <div className="w-px h-6 bg-slate-400 mx-1" />

          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1"
            onClick={() => setShowContasAReceberModal(true)}
          >
            <TrendingUp className="w-4 h-4" /> Ctas.Rec
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1"
            onClick={() => setShowContasAPagarModal(true)}
          >
            <TrendingDown className="w-4 h-4" /> Ctas.Pag
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1"
            onClick={() => setShowFuelingModal(true)}
          >
            <Fuel className="w-4 h-4" /> Abastec
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs gap-1">
            <CreditCard className="w-4 h-4" /> Bx.Cartao
          </Button>

          <div className="w-px h-6 bg-slate-400 mx-1" />

          <Link
            to={
              createPageUrl("CustomerRegistration") +
              "?type=fornecedor&return=cashMovements"
            }
          >
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1">
              <Factory className="w-4 h-4" /> Fornecedor
            </Button>
          </Link>
          <Link
            to={
              createPageUrl("CustomerRegistration") +
              "?type=pontoVenda&return=cashMovements"
            }
          >
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1">
              <Store className="w-4 h-4" /> PDV
            </Button>
          </Link>
          <Link
            to={
              createPageUrl("CustomerRegistration") +
              "?type=cliente&return=cashMovements"
            }
          >
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1">
              <User className="w-4 h-4" /> Cliente
            </Button>
          </Link>
        </div>
      </div>

      <Dialog open={showTransferConfirm} onOpenChange={setShowTransferConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Transferência</DialogTitle>
          </DialogHeader>

          <div className="py-4 text-center">
            <p className="text-lg mb-4">
              Confirmar transferência de{" "}
              <span className="font-bold text-blue-600">
                {formatCurrency(transferData.amount)}
              </span>
            </p>
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="font-medium">
                {cashAccounts.find((a) => a.id === transferData.fromAccountId)
                  ?.name || "Origem"}
              </span>
              <ArrowRight className="w-5 h-5 text-blue-500" />
              <span className="font-medium">
                {cashAccounts.find((a) => a.id === transferData.toAccountId)
                  ?.name || "Destino"}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTransferConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              className="text-white hover:opacity-90"
              style={{ backgroundColor: "#223f61" }}
              onClick={confirmTransfer}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Pesquisar{" "}
              {activeTab === "gastar"
                ? "Fornecedor"
                : sacadoType === "cliente"
                  ? "Cliente"
                  : "Ponto de Venda"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Buscar por nome, código ou documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />

            <div className="max-h-96 overflow-auto border rounded">
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
                  {people
                    .filter((p) =>
                      activeTab === "gastar"
                        ? p.type === "fornecedor"
                        : p.type === sacadoType,
                    )
                    .filter((p) => {
                      if (!searchTerm) return true;
                      const term = searchTerm.toLowerCase();
                      return (
                        p.name?.toLowerCase().includes(term) ||
                        p.document?.toLowerCase().includes(term) ||
                        p.personNumber?.toLowerCase().includes(term) ||
                        (p.phone && p.phone[0]?.includes(term))
                      );
                    })
                    .map((p) => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer hover:bg-blue-50"
                        onDoubleClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            personId: p.id,
                            personName: p.name,
                            fornecedorInput: "",
                            sacadoInput: "",
                          }));
                          setSacadoError("");
                          setShowSearchModal(false);
                          setSearchTerm("");
                        }}
                      >
                        <TableCell className="text-xs font-mono">
                          {p.personNumber || p.id.slice(-6)}
                        </TableCell>
                        <TableCell className="text-xs">{p.name}</TableCell>
                        <TableCell className="text-xs">
                          {p.document || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.phone?.[0] || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  {people.filter((p) =>
                    activeTab === "gastar"
                      ? p.type === "fornecedor"
                      : p.type === sacadoType,
                  ).length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-slate-500 py-8"
                      >
                        Nenhum{" "}
                        {activeTab === "gastar"
                          ? "fornecedor"
                          : sacadoType === "cliente"
                            ? "cliente"
                            : "ponto de venda"}{" "}
                        cadastrado
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
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-center text-slate-600">
              Tem certeza que deseja excluir este lançamento?
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmExcluir}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Alterações</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-center text-slate-600">
              Deseja cancelar? Alterações não salvas serão perdidas.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(false)}
            >
              Não
            </Button>
            <Button variant="destructive" onClick={confirmCancelar}>
              Sim, Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FuelingModal
        open={showFuelingModal}
        onOpenChange={setShowFuelingModal}
        currentUser={currentUser}
        selectedAccount={selectedAccount}
        cashAccounts={cashAccounts}
        onFuelingCreated={() => {
          loadData();
        }}
      />

      <ContasAPagarModal
        open={showContasAPagarModal}
        onOpenChange={setShowContasAPagarModal}
        currentUser={currentUser}
        cashAccounts={cashAccounts}
        preSelectedAccountId={selectedAccount}
        onPaymentComplete={(accountId) => {
          loadData();
        }}
      />

      <AccountsReceivableFullModal
        open={showContasAReceberModal}
        onOpenChange={setShowContasAReceberModal}
        currentUser={currentUser}
        onPaymentComplete={(accountId) => {
          loadData();
        }}
      />

      {/* Modal de Parcelas */}
      <Dialog
        open={showInstallmentsModal}
        onOpenChange={setShowInstallmentsModal}
      >
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Parcelas do Lançamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Valor Total:</span>
                  <span className="font-bold ml-2">
                    {formatCurrency(formData.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Entrada:</span>
                  <span className="font-bold ml-2">
                    {formatCurrency(formData.entryValue)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Parcelas:</span>
                  <span className="font-bold ml-2">
                    {formData.installments}x
                  </span>
                </div>
              </div>
            </div>

            <div className="max-h-80 overflow-auto border rounded">
              <Table>
                <TableHeader className="bg-slate-100 sticky top-0">
                  <TableRow>
                    <TableHead className="w-20 text-xs">Nº</TableHead>
                    <TableHead className="text-xs">Descrição</TableHead>
                    <TableHead className="w-40 text-xs">Vencimento</TableHead>
                    <TableHead className="w-36 text-xs text-right">
                      Valor
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculatedInstallments.map((inst, idx) => (
                    <TableRow
                      key={idx}
                      className={inst.isEntry ? "bg-green-50" : ""}
                    >
                      <TableCell className="text-xs font-mono">
                        {inst.isEntry ? "ENT" : inst.number}
                      </TableCell>
                      <TableCell className="text-xs">
                        {inst.description}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) =>
                            handleInstallmentChange(
                              idx,
                              "dueDate",
                              e.target.value,
                            )
                          }
                          className="h-7 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={inst.amount}
                          onChange={(e) =>
                            handleInstallmentChange(
                              idx,
                              "amount",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-7 text-xs text-right"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-sm">
                <span className="text-slate-600">Total das parcelas:</span>
                <span className="font-bold ml-2 text-lg">
                  {formatCurrency(
                    calculatedInstallments.reduce(
                      (sum, i) => sum + (Number(i.amount) || 0),
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowInstallmentsModal(false);
                setCalculatedInstallments([]);
              }}
            >
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
            <Button
              className="text-white hover:opacity-90"
              style={{ backgroundColor: "#223f61" }}
              onClick={handleConfirmInstallments}
            >
              <Check className="w-4 h-4 mr-1" /> Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
