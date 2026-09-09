import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Save, UserPlus, X } from "lucide-react";
import * as entities from "@/entities";
import { useToast } from "@/components/ui/use-toast";
// Added import
import { Link } from "react-router-dom";
import { createPageUrl, formatDateOnly } from "@/utils";
import ProductEntryPanel from "@/components/products/ProductEntryPanel";
import ProductItemsTable from "@/components/products/ProductItemsTable";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const immediatePaymentTypes = ["dinheiro", "pix", "cartao_debito"];

const createInstallmentsDetails = (amount, installments, purchaseDate) => {
  const totalInstallments = Math.max(1, parseInt(installments, 10) || 1);
  const installmentAmount = (parseFloat(amount) || 0) / totalInstallments;

  return Array.from({ length: totalInstallments }, (_, index) => {
    const dueDate = new Date(purchaseDate);
    dueDate.setMonth(dueDate.getMonth() + 1 + index);
    dueDate.setDate(10);
    return {
      number: index + 1,
      dueDate: formatDateOnly(dueDate, "yyyy-MM-dd"),
      amount: installmentAmount,
      status: "pendente",
    };
  });
};

function PurchasePaymentModal({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  paymentTypes,
  cashAccounts,
  supplierName,
  initialNotes,
  initialPayment,
  purchaseDate,
  isSaving,
}) {
  const { toast } = useToast();
  const [payment, setPayment] = useState(initialPayment);
  const [observations, setObservations] = useState(initialNotes);

  useEffect(() => {
    if (isOpen) setPayment(initialPayment);
  }, [isOpen, initialPayment]);

  const selectedType = paymentTypes.find(
    (paymentType) => paymentType.id === payment.paymentTypeId,
  );
  const isImmediate =
    selectedType && immediatePaymentTypes.includes(selectedType.type);
  const totalRemaining = totalAmount - (parseFloat(payment.amount) || 0);

  const updatePayment = (field, value) => {
    const nextPayment = { ...payment, [field]: value };
    const nextType =
      field === "paymentTypeId"
        ? paymentTypes.find((paymentType) => paymentType.id === value)
        : selectedType;
    const nextIsImmediate =
      nextType && immediatePaymentTypes.includes(nextType.type);

    if (field === "paymentTypeId") {
      nextPayment.paymentTypeName = nextType?.name || "";
      nextPayment.installments = nextIsImmediate
        ? 1
        : payment.installments || 1;
      nextPayment.cashAccountId = nextIsImmediate
        ? cashAccounts[0]?.id || ""
        : "";
    }

    if (
      field === "amount" ||
      field === "installments" ||
      field === "paymentTypeId"
    ) {
      nextPayment.installmentsDetails = createInstallmentsDetails(
        nextPayment.amount,
        nextIsImmediate ? 1 : nextPayment.installments,
        purchaseDate,
      );
    }

    setPayment(nextPayment);
  };

  const updateInstallment = (index, field, value) => {
    const installmentsDetails = payment.installmentsDetails.map(
      (detail, detailIndex) =>
        detailIndex === index ? { ...detail, [field]: value } : detail,
    );
    setPayment({
      ...payment,
      installmentsDetails,
      ...(field === "amount"
        ? {
            amount: installmentsDetails.reduce(
              (sum, detail) => sum + (parseFloat(detail.amount) || 0),
              0,
            ),
          }
        : {}),
    });
  };

  const handleConfirm = () => {
    if (!payment.paymentTypeId) {
      toast({
        title: "Erro",
        description: "Selecione a forma de pagamento.",
        variant: "destructive",
      });
      return;
    }
    if (!isImmediate && !payment.installmentsDetails.length) {
      toast({
        title: "Erro",
        description: "Informe as parcelas do pagamento.",
        variant: "destructive",
      });
      return;
    }
    if (isImmediate && !payment.cashAccountId) {
      toast({
        title: "Erro",
        description: "Selecione a conta de movimento.",
        variant: "destructive",
      });
      return;
    }
    if (Math.abs(totalRemaining) > 0.01) {
      toast({
        title: "Erro",
        description: `O pagamento deve ser igual ao total da compra (R$ ${totalAmount.toFixed(2)}).`,
        variant: "destructive",
      });
      return;
    }
    onConfirm(payment);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: "#1E3A8A" }}>
            Finalizar Compra
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-lg font-bold text-green-700">
              Total da Compra:{" "}
              <span className="text-green-900">
                R$ {totalAmount.toFixed(2)}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-gray-50 p-3">
            <div className="min-w-[180px] flex-1">
              <Label className="sr-only">Forma de Pagamento</Label>
              <Select
                value={payment.paymentTypeId}
                onValueChange={(value) => updatePayment("paymentTypeId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Forma de Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((paymentType) => (
                    <SelectItem key={paymentType.id} value={paymentType.id}>
                      {paymentType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isImmediate && (
              <div className="min-w-[180px] flex-1">
                <Label className="sr-only">Conta/Caixa</Label>
                <Select
                  value={payment.cashAccountId || ""}
                  onValueChange={(value) =>
                    updatePayment("cashAccountId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Conta/Caixa" />
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
            )}
            <Input
              className="w-32"
              type="number"
              step="0.01"
              value={payment.amount}
              onChange={(event) =>
                updatePayment("amount", parseFloat(event.target.value) || 0)
              }
              placeholder="Valor"
            />
            <Input
              className="w-24"
              type="number"
              min="1"
              value={payment.installments}
              disabled={isImmediate}
              onChange={(event) =>
                updatePayment(
                  "installments",
                  parseInt(event.target.value, 10) || 1,
                )
              }
              placeholder="Parcelas"
            />
          </div>
          {!isImmediate && payment.installmentsDetails.length > 0 && (
            <div className="rounded-lg border bg-slate-50 p-3">
              <h4 className="mb-2 text-sm font-semibold">
                Detalhes das Parcelas
              </h4>
              <div className="space-y-2">
                {payment.installmentsDetails.map((detail, index) => (
                  <div
                    key={detail.number}
                    className="grid grid-cols-3 items-center gap-2"
                  >
                    <span className="text-sm">Parcela {detail.number}</span>
                    <Input
                      type="date"
                      value={detail.dueDate}
                      onChange={(event) =>
                        updateInstallment(index, "dueDate", event.target.value)
                      }
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={Number(detail.amount).toFixed(2)}
                      onChange={(event) =>
                        updateInstallment(
                          index,
                          "amount",
                          parseFloat(event.target.value) || 0,
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div
            className={`rounded-lg p-3 text-center ${Math.abs(totalRemaining) < 0.01 ? "border border-green-200 bg-green-50 text-green-700" : "border border-red-200 bg-red-50 text-red-700"}`}
          >
            Falta pagar: <strong>R$ {totalRemaining.toFixed(2)}</strong>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSaving}
            style={{ background: "#e78b3a", color: "white" }}
          >
            {isSaving ? "Salvando..." : "Confirmar Pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PurchasesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [purchaseType, setPurchaseType] = useState("cadastrado");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchSupplier, setSearchSupplier] = useState("");
  const [showSupplierSearch, setShowSupplierSearch] = useState(false);

  const initialPurchaseState = {
    invoiceNumber: "",
    supplierId: "", // Changed from personId
    supplierName: "", // Changed from personName
    sectorId: "",
    sectorName: "",
    cashAccountId: "",
    cashAccountName: "",
    status: "rascunho",
    items: [],
    freight: 0,
    taxes: 0,
    totalDiscount: 0,
    subtotal: 0,
    totalAmount: 0,
    paymentTypeId: "",
    paymentTypeName: "",
    installments: 1,
    installmentsDetails: [],
    paymentDiscount: 0,
    finalTotal: 0,
    notes: "",
    nfeReceived: false,
    nfeNumber: "",
    nfeSeries: "001",
    nfeDate: formatDateOnly(new Date(), "yyyy-MM-dd"),
    createdByName: "",
    purchaseDate: formatDateOnly(new Date(), "yyyy-MM-dd"),
  };

  const [currentPurchase, setCurrentPurchase] = useState(initialPurchaseState);

  const [currentItem, setCurrentItem] = useState({
    productId: "",
    productCode: "",
    productName: "",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    subtotal: 0,
    stockOnly: false,
  });

  const loadData = useCallback(async () => {
    try {
      const user = await entities.User.me();
      setCurrentUser(user);

      const [
        allPeople,
        productsData,
        sectorsData,
        cashAccountsData,
        paymentTypesData,
      ] = await Promise.all([
        entities.Person.filter({ companyId: user.companyId }),
        entities.Product.filter({ companyId: user.companyId, active: true }),
        entities.Sector.filter({
          companyId: user.companyId,
          active: true,
          isOwnStock: true,
        }), // Only include sectors that have their own stock
        entities.CashAccount.filter({
          companyId: user.companyId,
          active: true,
        }),
        entities.PaymentType.filter({
          companyId: user.companyId,
          active: true,
        }),
      ]);

      const suppliersList = allPeople.filter((p) => p.type === "fornecedor");
      setSuppliers(suppliersList);
      setProducts(productsData);
      setSectors(sectorsData);
      setCashAccounts(cashAccountsData);
      setPaymentTypes(paymentTypesData);

      // Código sequencial será gerado apenas no momento do salvamento

      // Verificar se há um supplierId na URL para auto-selecionar
      const urlParams = new URLSearchParams(window.location.search);
      const supplierId = urlParams.get("supplierId");
      if (supplierId) {
        const supplier = suppliersList.find((s) => s.id === supplierId);
        if (supplier) {
          setSelectedSupplier(supplier);
          setCurrentPurchase((prev) => ({
            ...prev,
            supplierId: supplier.id,
            supplierName: supplier.name,
          }));
          toast({
            title: "Fornecedor selecionado",
            description: supplier.name,
          });
          // Limpar o parâmetro da URL para evitar re-seleção em recarregamentos
          urlParams.delete("supplierId");
          window.history.replaceState(
            {},
            document.title,
            `${window.location.pathname}?${urlParams.toString()}`,
          );
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Effect to calculate main financial totals (subtotal, taxes, totalAmount, finalTotal)
  useEffect(() => {
    const itemsSubtotal = currentPurchase.items.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const totalDiscount = currentPurchase.items.reduce(
      (sum, item) => sum + item.discount,
      0,
    );
    const total = itemsSubtotal + currentPurchase.freight;
    const finalTotal = total - currentPurchase.paymentDiscount;

    setCurrentPurchase((prev) => ({
      ...prev,
      subtotal: itemsSubtotal,
      totalDiscount: totalDiscount,
      taxes: 0,
      totalAmount: total,
      finalTotal: finalTotal,
    }));
  }, [
    currentPurchase.items,
    currentPurchase.freight,
    currentPurchase.paymentDiscount,
  ]);

  // Effect to update installment amounts when finalTotal or number of installments changes
  useEffect(() => {
    if (
      currentPurchase.paymentTypeId &&
      currentPurchase.installments > 0 &&
      !isNaN(currentPurchase.finalTotal)
    ) {
      const selectedPaymentType = paymentTypes.find(
        (pt) => pt.id === currentPurchase.paymentTypeId,
      );
      if (selectedPaymentType) {
        const isImmediatePayment = [
          "dinheiro",
          "pix",
          "cartao_debito",
        ].includes(selectedPaymentType.type);

        // If it's an immediate payment type, ensure installments is 1
        if (isImmediatePayment && currentPurchase.installments !== 1) {
          setCurrentPurchase((prev) => ({ ...prev, installments: 1 }));
          return; // Exit to let the next render cycle with updated installments handle the details
        }

        const newInstallmentAmount =
          currentPurchase.finalTotal / currentPurchase.installments;

        // Only update if amounts actually need changing to avoid unnecessary state updates
        // and if installmentsDetails exists
        if (
          currentPurchase.installmentsDetails.length > 0 &&
          currentPurchase.installmentsDetails[0].amount !== newInstallmentAmount
        ) {
          const updatedInstallmentsDetails =
            currentPurchase.installmentsDetails.map((detail) => ({
              ...detail,
              amount: newInstallmentAmount, // Update amount based on new finalTotal
            }));
          setCurrentPurchase((prev) => ({
            ...prev,
            installmentsDetails: updatedInstallmentsDetails,
          }));
        }
      }
    }
  }, [
    currentPurchase.finalTotal,
    currentPurchase.paymentTypeId,
    currentPurchase.installments,
    paymentTypes,
    currentPurchase.installmentsDetails,
  ]);

  const handleSelectSupplier = (supplier) => {
    setShowSupplierSearch(false);
    setSelectedSupplier(supplier);
    setCurrentPurchase((prev) => ({
      ...prev,
      supplierId: supplier.id,
      supplierName: supplier.name,
    }));
    toast({ title: "Fornecedor selecionado", description: supplier.name });
  };

  const clearSelectedSupplier = () => {
    setSelectedSupplier(null);
    setCurrentPurchase((prev) => ({
      ...prev,
      supplierId: "",
      supplierName: "",
    }));
  };

  const handleSearchSupplier = () => {
    if (!searchSupplier.trim()) {
      toast({
        title: "Atenção",
        description: "Digite um CNPJ ou Nome para buscar.",
        variant: "destructive",
      });
      return;
    }

    const found = suppliers.find(
      (s) =>
        s.document?.includes(searchSupplier) ||
        s.name.toLowerCase().includes(searchSupplier.toLowerCase()),
    );

    if (found) {
      handleSelectSupplier(found);
      toast({ title: "Fornecedor encontrado", description: found.name });
    } else {
      toast({
        title: "Não encontrado",
        description: "Fornecedor não encontrado.",
        variant: "destructive",
      });
    }
  };

  const handleProductCodeChange = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setCurrentItem((prev) => ({
        ...prev,
        productId: product.id,
        productCode: product.code || "",
        productName: product.name,
        unitPrice: product.costPrice || 0,
        subtotal: prev.quantity * (product.costPrice || 0) - prev.discount,
      }));
    } else {
      setCurrentItem((prev) => ({
        ...prev,
        productId: "",
        productCode: "", // Reset product code as well
        productName: "",
        unitPrice: 0,
        subtotal: prev.quantity * 0 - prev.discount,
      }));
    }
  };

  const updateItemField = (field, value) => {
    setCurrentItem((prev) => {
      const updated = { ...prev, [field]: value };

      if (
        field === "quantity" ||
        field === "unitPrice" ||
        field === "discount"
      ) {
        updated.subtotal =
          updated.quantity * updated.unitPrice - updated.discount;
      }
      return updated;
    });
  };

  const addItem = () => {
    if (!currentItem.productId) {
      toast({
        title: "Atenção",
        description: "Selecione um produto.",
        variant: "destructive",
      });
      return;
    }

    const itemExists = currentPurchase.items.find(
      (item) => item.productId === currentItem.productId,
    );
    if (itemExists) {
      toast({
        title: "Atenção",
        description: "Este produto já foi adicionado.",
        variant: "destructive",
      });
      return;
    }

    setCurrentPurchase((prev) => ({
      ...prev,
      items: [...prev.items, { ...currentItem }],
    }));

    setCurrentItem({
      productId: "",
      productCode: "",
      productName: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      subtotal: 0,
      stockOnly: false,
      vasilhameLoanQuantity: 0,
      quantityToPickup: 0,
    });
  };

  const handleProductSelect = (product) => {
    handleProductCodeChange(product?.id || "");
  };

  const purchaseProductColumns = [
    {
      key: "productCode",
      header: "Código",
      render: (item) => item.productCode || "-",
    },
    { key: "productName", header: "Descrição" },
    {
      key: "quantity",
      header: "Qtde",
      render: (item, index) => (
        <Input
          type="number"
          step="1"
          value={item.quantity}
          onChange={(event) =>
            updateItem(index, "quantity", event.target.value)
          }
          className="w-20"
        />
      ),
    },
    {
      key: "unitPrice",
      header: "Custo Un.",
      render: (item) => `R$ ${Number(item.unitPrice || 0).toFixed(2)}`,
    },
    {
      key: "subtotal",
      header: "Valor Total",
      render: (item) => `R$ ${Number(item.subtotal || 0).toFixed(2)}`,
    },
    {
      key: "discount",
      header: "Desconto",
      render: (item, index) => (
        <Input
          type="number"
          step="0.01"
          value={item.discount}
          onChange={(event) =>
            updateItem(index, "discount", event.target.value)
          }
          className="w-20"
        />
      ),
    },
  ];

  const removeItem = (index) => {
    setCurrentPurchase((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...currentPurchase.items];
    const numericValue = ["quantity", "unitPrice", "discount"].includes(field)
      ? parseFloat(value) || 0
      : value;

    newItems[index][field] = numericValue;

    const item = newItems[index];
    item.subtotal = item.quantity * item.unitPrice - item.discount;

    setCurrentPurchase((prev) => ({ ...prev, items: newItems }));
  };

  const getDueDateForInstallment = (purchaseDate, installmentIndex) => {
    const purchase = new Date(purchaseDate);
    const baseDate = new Date(
      purchase.getFullYear(),
      purchase.getMonth() + 1 + installmentIndex,
      10,
    );
    return formatDateOnly(baseDate, "yyyy-MM-dd");
  };

  const handlePaymentTypeChange = (paymentTypeId) => {
    const paymentType = paymentTypes.find((pt) => pt.id === paymentTypeId);
    if (!paymentType) return;

    const installments = 1; // Default to 1 installment for all payment selections

    const installmentsDetails = [];
    const totalAmountPerInstallment = currentPurchase.finalTotal / installments;
    for (let i = 0; i < installments; i++) {
      installmentsDetails.push({
        number: i + 1,
        dueDate: getDueDateForInstallment(currentPurchase.purchaseDate, i),
        amount: totalAmountPerInstallment,
        status: "pendente",
      });
    }

    setCurrentPurchase((prev) => ({
      ...prev,
      paymentTypeId: paymentTypeId,
      paymentTypeName: paymentType.name,
      installments: installments,
      installmentsDetails: installmentsDetails,
    }));
  };

  const handleInstallmentsChange = (newInstallments) => {
    const numInstallments = Math.max(1, newInstallments); // Ensure at least 1 installment
    const installmentsDetails = [];
    const totalAmountPerInstallment =
      currentPurchase.finalTotal / numInstallments;
    for (let i = 0; i < numInstallments; i++) {
      installmentsDetails.push({
        number: i + 1,
        dueDate: getDueDateForInstallment(currentPurchase.purchaseDate, i),
        amount: totalAmountPerInstallment,
        status: "pendente",
      });
    }

    setCurrentPurchase((prev) => ({
      ...prev,
      installments: numInstallments,
      installmentsDetails: installmentsDetails,
    }));
  };

  const updateInstallmentDetail = (index, field, value) => {
    const newDetails = [...currentPurchase.installmentsDetails];
    // Ensure numeric fields are parsed correctly
    newDetails[index][field] =
      field === "amount" ? parseFloat(value) || 0 : value;
    setCurrentPurchase((prev) => ({
      ...prev,
      installmentsDetails: newDetails,
    }));
  };

  const handleOpenPaymentModal = () => {
    if (purchaseType === "cadastrado" && !currentPurchase.supplierId) {
      toast({
        title: "Erro",
        description: "Selecione um fornecedor.",
        variant: "destructive",
      });
      return;
    }

    if (currentPurchase.items.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item.",
        variant: "destructive",
      });
      return;
    }

    if (!currentPurchase.sectorId) {
      toast({
        title: "Erro",
        description: "Selecione o setor de estoque.",
        variant: "destructive",
      });
      return;
    }

    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (payment) => {
    if (isSaving) return;

    const purchaseData = {
      ...currentPurchase,
      ...payment,
      supplierId:
        purchaseType === "avulsa" ? "avulsa" : currentPurchase.supplierId,
      supplierName:
        purchaseType === "avulsa"
          ? "Compra Avulsa"
          : currentPurchase.supplierName,
    };

    // Backend irá:
    // 1. Gerar invoiceNumber automaticamente
    // 2. Criar purchase e purchaseItems
    // 3. Atualizar stocks de produtos
    // 4. Se à prazo: criar contasAPagar
    // 5. Se à vista: criar cashMovement e atualizar saldo da conta
    setIsSaving(true);
    setLoading(true);
    try {
      const createdPurchase = await entities.Purchase.create(purchaseData);
      toast({
        title: "Sucesso",
        description: `Compra #${createdPurchase.invoiceNumber} salva com sucesso!`,
      });

      setCurrentPurchase(initialPurchaseState);
      setSelectedSupplier(null);
      setSearchSupplier("");
      setShowPaymentModal(false);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar compra:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao salvar compra.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#F3F4F6" }}>
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-slate-800 mb-6">Compras</h1>
        </div>

        <Card
          className="mb-4"
          style={{
            background: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label
                  className="text-xs font-medium"
                  style={{ color: "#374151" }}
                >
                  Data <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={currentPurchase.purchaseDate}
                  onChange={(e) =>
                    setCurrentPurchase((prev) => ({
                      ...prev,
                      purchaseDate: e.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label
                  className="text-xs font-medium"
                  style={{ color: "#374151" }}
                >
                  Setor <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={currentPurchase.sectorId}
                  onValueChange={(value) => {
                    const sector = sectors.find((s) => s.id === value);
                    setCurrentPurchase((prev) => ({
                      ...prev,
                      sectorId: sector?.id,
                      sectorName: sector?.name,
                    }));
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value={null}
                      className="font-semibold text-green-600"
                    >
                      Selecione o setor
                    </SelectItem>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* <div>
                <Label
                    className="text-xs font-medium"
                    style={{ color: "#374151" }}
                    >
                  Conta Movimento <span className="text-red-500">*</span>
                  </Label>
                <Select
                  value={currentPurchase.cashAccountId || ""}
                  onValueChange={(value) => {
                    const account = cashAccounts.find((a) => a.id === value);
                    setCurrentPurchase((prev) => ({
                      ...prev,
                      cashAccountId: value,
                      cashAccountName: account?.name || "",
                    }));
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div> */}
            </div>
          </CardContent>
        </Card>

        <Card
          className="mb-4"
          style={{
            background: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <CardContent className="p-4">
            <ProductEntryPanel
              products={products}
              variant="purchase"
              draft={currentItem}
              onDraftChange={updateItemField}
              onProductSelect={handleProductSelect}
              onAdd={addItem}
            />
            <ProductItemsTable
              items={currentPurchase.items}
              columns={purchaseProductColumns}
              onRemove={removeItem}
            />
          </CardContent>
        </Card>

        {/* Seção Observações */}
        <Card
          className="mb-4"
          style={{
            background: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <CardContent className="p-4">
            <Label className="text-xs font-medium" style={{ color: "#374151" }}>
              Observação da Compra:
            </Label>
            <Textarea
              value={currentPurchase.notes}
              onChange={(e) =>
                setCurrentPurchase((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              rows={3}
              className="mt-1"
              placeholder="Digite observações sobre a compra..."
            />
          </CardContent>
        </Card>

        {/* Seção Fornecedor e tipo compra */}
        <Card
          className="mb-4"
          style={{
            background: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="mb-4">
                <Label
                  className="text-xs font-medium"
                  style={{ color: "#374151" }}
                >
                  Tipo de Compra:
                </Label>
                <RadioGroup
                  value={purchaseType}
                  onValueChange={setPurchaseType}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cadastrado" id="cad" />
                    <Label htmlFor="cad" className="cursor-pointer">
                      Fornecedor Cadastrado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="avulsa" id="avu" />
                    <Label htmlFor="avu" className="cursor-pointer">
                      Compra Avulsa
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                {purchaseType === "cadastrado" && (
                  <div className="mb-4">
                    <Label
                      className="text-xs font-medium"
                      style={{ color: "#374151" }}
                    >
                      Fornecedor <span className="text-red-500">*</span>
                    </Label>
                    {!selectedSupplier ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Buscar por CNPJ/Nome"
                          value={searchSupplier}
                          onChange={(e) => setSearchSupplier(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSearchSupplier()
                          }
                          className="bg-white"
                          disabled={purchaseType === "avulsa"}
                        />
                        <Button
                          onClick={() => setShowSupplierSearch((prev) => !prev)}
                          variant="outline"
                          size="icon"
                          disabled={purchaseType === "avulsa"}
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{
                          background: "#F0FDF4",
                          border: "1px solid #BBF7D0",
                        }}
                      >
                        <div>
                          <p
                            className="font-semibold text-sm"
                            style={{ color: "#15803D" }}
                          >
                            {selectedSupplier.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            <strong>CNPJ:</strong>{" "}
                            {selectedSupplier.document || "N/A"}
                          </p>
                          <p className="text-xs text-gray-600">
                            <strong>Tel:</strong>{" "}
                            {Array.isArray(selectedSupplier.phone)
                              ? selectedSupplier.phone[0]
                              : selectedSupplier.phone || "N/A"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={clearSelectedSupplier}
                          className="text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {purchaseType === "avulsa" && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="font-semibold text-slate-700">
                      Fornecedor: Compra Avulsa
                    </p>
                    <p className="text-sm text-slate-600">
                      Não associado a um fornecedor cadastrado.
                    </p>
                  </div>
                )}

                {showSupplierSearch && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                      <div
                        className="p-4 border-b"
                        style={{ background: "#1E3A8A" }}
                      >
                        <h3 className="text-lg font-semibold text-white">
                          Selecionar Fornecedor
                        </h3>
                      </div>
                      <div className="p-4">
                        <Input
                          value={searchSupplier}
                          onChange={(e) => setSearchSupplier(e.target.value)}
                          placeholder="Buscar por CNPJ/Nome..."
                          className="mb-4"
                        />
                        <div className="max-h-96 overflow-y-auto">
                          {suppliers
                            .filter(
                              (supplier) =>
                                searchSupplier === "" ||
                                supplier.document?.includes(searchSupplier) ||
                                supplier.name
                                  .toLowerCase()
                                  .includes(searchSupplier.toLowerCase()),
                            )
                            .map((supplier) => (
                              <div
                                key={supplier.id}
                                onClick={() => handleSelectSupplier(supplier)}
                                className="p-3 border-b cursor-pointer hover:bg-gray-50"
                              >
                                <p className="font-medium">{supplier.name}</p>
                                <p className="text-sm text-gray-600">
                                  {supplier.document || "N/A"}
                                  {Array.isArray(supplier.phone)
                                    ? supplier.phone[0]
                                    : supplier.phone || "N/A"}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                      <div className="p-4 border-t flex justify-end">
                        <Button
                          onClick={() => setShowSupplierSearch(false)}
                          variant="outline"
                        >
                          Fechar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="mb-4"
          style={{
            background: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                className="text-center p-3 rounded-lg"
                style={{ background: "#F9FAFB" }}
              >
                <Label className="text-xs" style={{ color: "#6B7280" }}>
                  Subtotal
                </Label>
                <p
                  className="text-lg font-semibold mt-1"
                  style={{ color: "#1F2937" }}
                >
                  R$ {currentPurchase.subtotal.toFixed(2)}
                </p>
              </div>

              <div
                className="text-center p-3 rounded-lg"
                style={{ background: "#F9FAFB" }}
              >
                <Label className="text-xs" style={{ color: "#6B7280" }}>
                  Frete/Transporte
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={currentPurchase.freight}
                  onChange={(e) =>
                    setCurrentPurchase((prev) => ({
                      ...prev,
                      freight: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-32 text-right bg-white"
                />
              </div>

              <div
                className="text-center p-3 rounded-lg"
                style={{ background: "#F9FAFB" }}
              >
                <Label className="text-xs" style={{ color: "#6B7280" }}>
                  Vlr. Desconto
                </Label>
                <p
                  className="text-lg font-semibold mt-1"
                  style={{ color: "#1F2937" }}
                >
                  R$ {currentPurchase.totalDiscount.toFixed(2)}
                </p>
              </div>

              <div
                className="text-center p-3 rounded-lg"
                style={{ background: "#F9FAFB" }}
              >
                <Label className="text-xs" style={{ color: "#6B7280" }}>
                  Total Líquido:
                </Label>
                <p className="text-lg font-semibold mt-1 text-green-600">
                  R$ {currentPurchase.finalTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="hidden grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <Label>Forma de Pagamento *</Label>
                  <Select
                    value={currentPurchase.paymentTypeId}
                    onValueChange={handlePaymentTypeChange}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypes.map((pt) => (
                        <SelectItem key={pt.id} value={pt.id}>
                          {pt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentPurchase.paymentTypeId &&
                  (() => {
                    const selectedPaymentType = paymentTypes.find(
                      (pt) => pt.id === currentPurchase.paymentTypeId,
                    );
                    const isAPrazo =
                      selectedPaymentType &&
                      !["dinheiro", "pix", "cartao_debito"].includes(
                        selectedPaymentType.type,
                      );

                    return (
                      isAPrazo && (
                        <>
                          <div>
                            <Label>Número de Parcelas</Label>
                            <Input
                              type="number"
                              min="1"
                              max={selectedPaymentType.maxInstallments || 12} // Default max 12 if not specified
                              value={currentPurchase.installments}
                              onChange={(e) =>
                                handleInstallmentsChange(
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="bg-white"
                            />
                          </div>

                          {currentPurchase.installmentsDetails.length > 0 && (
                            <div className="border rounded-lg p-4 bg-slate-50">
                              <h4 className="text-sm font-semibold mb-3">
                                Detalhes das Parcelas
                              </h4>
                              <div className="space-y-2">
                                {currentPurchase.installmentsDetails.map(
                                  (detail, index) => (
                                    <div
                                      key={index}
                                      className="grid grid-cols-3 gap-2 items-center"
                                    >
                                      <div className="text-sm font-medium">
                                        Parcela {detail.number}
                                      </div>
                                      <div>
                                        <Input
                                          type="date"
                                          value={detail.dueDate}
                                          onChange={(e) =>
                                            updateInstallmentDetail(
                                              index,
                                              "dueDate",
                                              e.target.value,
                                            )
                                          }
                                          className="bg-white text-xs"
                                        />
                                      </div>
                                      <div>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={detail.amount.toFixed(2)}
                                          onChange={(e) =>
                                            updateInstallmentDetail(
                                              index,
                                              "amount",
                                              parseFloat(e.target.value) || 0,
                                            )
                                          }
                                          className="bg-white text-xs"
                                        />
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )
                    );
                  })()}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={currentPurchase.nfeReceived}
                    onCheckedChange={(checked) =>
                      setCurrentPurchase((prev) => ({
                        ...prev,
                        nfeReceived: checked,
                      }))
                    }
                    id="nfe"
                  />
                  <Label htmlFor="nfe" className="cursor-pointer font-semibold">
                    NF-e Recebida
                  </Label>
                </div>

                {currentPurchase.nfeReceived && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Número</Label>
                      <Input
                        value={currentPurchase.nfeNumber}
                        onChange={(e) =>
                          setCurrentPurchase((prev) => ({
                            ...prev,
                            nfeNumber: e.target.value,
                          }))
                        }
                        placeholder="000123456"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label>Série</Label>
                      <Input
                        value={currentPurchase.nfeSeries}
                        onChange={(e) =>
                          setCurrentPurchase((prev) => ({
                            ...prev,
                            nfeSeries: e.target.value,
                          }))
                        }
                        className="bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-2">
          <Button
            onClick={handleOpenPaymentModal}
            className="text-white hover:opacity-90"
            disabled={loading}
            style={{ backgroundColor: "#e78b3a" }}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Link
            to={`${createPageUrl("CustomerRegistration")}?module=gerencial&return=purchases`}
          >
            <Button variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Cadastrar Fornecedor
            </Button>
          </Link>
        </div>
      </div>
      <PurchasePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleConfirmPayment}
        totalAmount={currentPurchase.finalTotal}
        paymentTypes={paymentTypes}
        cashAccounts={cashAccounts}
        purchaseDate={currentPurchase.purchaseDate}
        initialPayment={{
          paymentTypeId: currentPurchase.paymentTypeId,
          paymentTypeName: currentPurchase.paymentTypeName,
          amount: currentPurchase.finalTotal,
          installments: currentPurchase.installments || 1,
          cashAccountId: currentPurchase.cashAccountId || "",
          installmentsDetails: currentPurchase.installmentsDetails || [],
        }}
        isSaving={isSaving}
      />
    </div>
  );
}
