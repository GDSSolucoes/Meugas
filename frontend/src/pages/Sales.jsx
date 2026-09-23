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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, X } from "lucide-react";
import * as entities from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useLocation } from "react-router-dom"; // Added useLocation
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ProductEntryPanel from "@/components/products/ProductEntryPanel";
import ProductItemsTable from "@/components/products/ProductItemsTable";
import PersonSelector from "@/components/people/PersonSelector";
import { formatDateOnly } from "@/utils";

const initialSaleState = {
  saleNumber: "",
  personId: "",
  personName: "",
  sectorId: "",
  sectorName: "",
  status: "concluida",
  saleDate: formatDateOnly(new Date(), "yyyy-MM-dd"),
  notes: "",
  items: [],
  paymentMethods: [], // Initial state is empty, PaymentModal will add first one if needed
  totalAmount: 0,
  createdByName: "",
  orderId: null,
  orderNumber: null,
  conveniadaId: "",
  conveniadaName: "",
};

// Helper function to generate installment details
const generateInstallmentDetails = (paymentMethod, paymentTypes, saleDate) => {
  const paymentType = paymentTypes.find(
    (pt) => pt.id === paymentMethod.paymentTypeId,
  );
  const isImmediatePaymentType =
    paymentType &&
    ["dinheiro", "pix", "cartao_debito"].includes(paymentType.type);
  const amount = parseFloat(paymentMethod.amount) || 0;
  const installments = parseInt(paymentMethod.installments) || 1;

  if (isImmediatePaymentType || installments <= 1) {
    return {
      ...paymentMethod,
      installments: 1, // Force 1 installment for immediate payments
      installmentsDetails: [
        {
          number: 1,
          dueDate: saleDate,
          amount: amount,
          status: "pendente",
        },
      ],
    };
  } else {
    const installmentAmount = amount / installments;
    const newDetails = [];
    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(saleDate);
      dueDate.setMonth(dueDate.getMonth() + (i + 1)); // Add months for subsequent installments
      newDetails.push({
        number: i + 1,
        dueDate: formatDateOnly(dueDate, "yyyy-MM-dd"),
        amount: installmentAmount,
        status: "pendente",
      });
    }
    return { ...paymentMethod, installmentsDetails: newDetails };
  }
};

// PaymentModal component definition
const PaymentModal = ({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  paymentTypes,
  cashAccounts,
  saleNumber,
  customerName,
  initialNotes,
  initialPaymentMethods,
  saleDate,
  isSaving,
}) => {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [observations, setObservations] = useState(initialNotes);

  useEffect(() => {
    if (isOpen) {
      let methodsToSet = initialPaymentMethods;
      if (initialPaymentMethods.length === 0 && totalAmount > 0) {
        // If no initial methods, create one default
        methodsToSet = [
          {
            paymentTypeId: "",
            paymentTypeName: "",
            amount: totalAmount,
            installments: 1,
            cashAccountId: "",
            installmentsDetails: [], // Initialize empty, will be generated
          },
        ];
      }

      // Ensure installmentsDetails are correctly generated/updated on open
      const updatedMethods = methodsToSet.map((pm) =>
        generateInstallmentDetails(pm, paymentTypes, saleDate),
      );
      setPaymentMethods(updatedMethods);
      setObservations(initialNotes);
    }
  }, [
    isOpen,
    initialPaymentMethods,
    initialNotes,
    totalAmount,
    paymentTypes,
    saleDate,
  ]);

  const totalPaymentsMade = paymentMethods.reduce(
    (sum, pm) => sum + (parseFloat(pm.amount) || 0),
    0,
  );
  const totalRemaining = totalAmount - totalPaymentsMade;

  const addPaymentMethod = () => {
    const remaining = totalAmount - totalPaymentsMade;
    const newPaymentMethod = {
      paymentTypeId: "",
      paymentTypeName: "",
      amount: remaining > 0 ? remaining : 0,
      installments: 1,
      cashAccountId: "",
      installmentsDetails: [],
    };
    setPaymentMethods((prev) => [
      ...prev,
      generateInstallmentDetails(newPaymentMethod, paymentTypes, saleDate), // Generate details for new method
    ]);
  };

  const updatePaymentMethod = (index, field, value) => {
    const newPayments = [...paymentMethods];
    const currentPaymentMethod = newPayments[index];
    currentPaymentMethod[field] = value;

    const paymentType = paymentTypes.find(
      (pt) => pt.id === currentPaymentMethod.paymentTypeId,
    );
    const isImmediatePaymentType =
      paymentType &&
      ["dinheiro", "pix", "cartao_debito"].includes(paymentType.type);

    if (field === "paymentTypeId") {
      currentPaymentMethod.paymentTypeName = paymentType?.name || "";
      if (isImmediatePaymentType) {
        currentPaymentMethod.cashAccountId =
          cashAccounts.length > 0 ? cashAccounts[0].id : "";
        currentPaymentMethod.installments = 1; // Force 1 installment for immediate
      } else {
        currentPaymentMethod.cashAccountId = ""; // Clear cash account for non-immediate
      }
    }

    // Ensure installments for immediate payments are always 1
    if (isImmediatePaymentType && field === "installments" && value !== 1) {
      currentPaymentMethod.installments = 1;
    }

    const oldInstallmentsCount =
      paymentMethods[index]?.installmentsDetails?.length || 0;
    const newInstallmentsCount =
      parseInt(currentPaymentMethod.installments) || 1;
    const newPaymentAmount = parseFloat(currentPaymentMethod.amount) || 0;

    // Regenerate full details if payment type or installments count changes
    if (
      field === "paymentTypeId" ||
      (field === "installments" &&
        oldInstallmentsCount !== newInstallmentsCount)
    ) {
      newPayments[index] = generateInstallmentDetails(
        currentPaymentMethod,
        paymentTypes,
        saleDate,
      );
    } else if (field === "amount") {
      // If amount changes, redistribute to existing installments or update single installment
      if (
        !isImmediatePaymentType &&
        newInstallmentsCount > 1 &&
        currentPaymentMethod.installmentsDetails.length > 0
      ) {
        const perInstallmentAmount = newPaymentAmount / newInstallmentsCount;
        newPayments[index].installmentsDetails = newPayments[
          index
        ].installmentsDetails.map((det) => ({
          ...det,
          amount: perInstallmentAmount,
        }));
      } else if (currentPaymentMethod.installmentsDetails.length > 0) {
        // For single installment, just update its amount
        newPayments[index].installmentsDetails[0].amount = newPaymentAmount;
      }
    }

    setPaymentMethods(newPayments);
  };

  const updateInstallmentDetail = (
    paymentMethodIndex,
    installmentIndex,
    field,
    value,
  ) => {
    const newPayments = [...paymentMethods];
    const detail =
      newPayments[paymentMethodIndex].installmentsDetails[installmentIndex];
    detail[field] = value;

    // Recalculate payment method amount if an installment amount is changed directly
    if (field === "amount") {
      const totalInstallmentAmount = newPayments[
        paymentMethodIndex
      ].installmentsDetails.reduce(
        (sum, det) => sum + (parseFloat(det.amount) || 0),
        0,
      );
      newPayments[paymentMethodIndex].amount = totalInstallmentAmount;
    }

    setPaymentMethods(newPayments);
  };

  const removePaymentMethod = (index) => {
    setPaymentMethods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (paymentMethods.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um método de pagamento.",
        variant: "destructive",
      });
      return;
    }
    if (Math.abs(totalRemaining) > 0.01) {
      toast({
        title: "Erro",
        description: `O total dos pagamentos (R$ ${totalPaymentsMade.toFixed(2)}) deve ser igual ao total da venda (R$ ${totalAmount.toFixed(2)}).`,
        variant: "destructive",
      });
      return;
    }

    const paymentsWihtoutType = paymentMethods.filter((p) => !p.paymentTypeId);
    if (paymentsWihtoutType.length > 0) {
      alert("Todos os pagamentos devem ter uma forma de pagamento selecionada");
      return;
    }

    // Validate installment details sum for each payment method
    for (const pm of paymentMethods) {
      if (pm.installmentsDetails && pm.installmentsDetails.length > 0) {
        const totalInstallmentsAmount = pm.installmentsDetails.reduce(
          (sum, det) => sum + (parseFloat(det.amount) || 0),
          0,
        );
        if (
          Math.abs(totalInstallmentsAmount - (parseFloat(pm.amount) || 0)) >
          0.01
        ) {
          toast({
            title: "Erro",
            description: `O total das parcelas para "${pm.paymentTypeName}" (R$ ${totalInstallmentsAmount.toFixed(2)}) não corresponde ao valor total do pagamento (R$ ${pm.amount.toFixed(2)}).`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    onConfirm(paymentMethods, observations);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle
            className="text-xl font-bold"
            style={{ color: "#1E3A8A" }}
          >
            Finalizar Venda #{saleNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700">
            Cliente: <span className="text-gray-900">{customerName}</span>
          </p>
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-lg font-bold text-green-700">
              Total da Venda:{" "}
              <span className="text-green-900">
                R$ {totalAmount.toFixed(2)}
              </span>
            </p>
          </div>

          <h4
            className="text-md font-semibold mt-4 mb-2"
            style={{ color: "#1E3A8A" }}
          >
            Formas de Pagamento
          </h4>
          <div className="space-y-3">
            {paymentMethods.map((payment, index) => {
              const paymentType = paymentTypes.find(
                (pt) => pt.id === payment.paymentTypeId,
              );
              const isImmediatePaymentType =
                paymentType &&
                ["dinheiro", "pix", "cartao_debito"].includes(paymentType.type);

              return (
                <div
                  key={index}
                  className="flex flex-col gap-3 p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[150px]">
                      <Label
                        htmlFor={`payment-type-${index}`}
                        className="sr-only"
                      >
                        Forma de Pagamento
                      </Label>
                      <Select
                        value={payment.paymentTypeId}
                        onValueChange={(value) =>
                          updatePaymentMethod(index, "paymentTypeId", value)
                        }
                        id={`payment-type-${index}`}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Forma de Pagamento" />
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

                    {isImmediatePaymentType && (
                      <div className="flex-1 min-w-[150px]">
                        <Label
                          htmlFor={`cash-account-${index}`}
                          className="sr-only"
                        >
                          Conta/Caixa
                        </Label>
                        <Select
                          value={payment.cashAccountId || ""}
                          onValueChange={(value) =>
                            updatePaymentMethod(index, "cashAccountId", value)
                          }
                          id={`cash-account-${index}`}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Conta/Caixa" />
                          </SelectTrigger>
                          <SelectContent>
                            {cashAccounts.map((ca) => (
                              <SelectItem key={ca.id} value={ca.id}>
                                {ca.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="w-32 min-w-[100px]">
                      <Label htmlFor={`amount-${index}`} className="sr-only">
                        Valor
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Valor"
                        value={payment.amount || ""}
                        onChange={(e) =>
                          updatePaymentMethod(
                            index,
                            "amount",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        id={`amount-${index}`}
                      />
                    </div>

                    <div className="w-24 min-w-[80px]">
                      <Label
                        htmlFor={`installments-${index}`}
                        className="sr-only"
                      >
                        Parcelas
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Parcelas"
                        value={payment.installments || 1}
                        onChange={(e) =>
                          updatePaymentMethod(
                            index,
                            "installments",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        disabled={isImmediatePaymentType}
                        id={`installments-${index}`}
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePaymentMethod(index)}
                      className="text-red-500 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {!isImmediatePaymentType &&
                    parseInt(payment.installments) > 1 &&
                    payment.installmentsDetails &&
                    payment.installmentsDetails.length > 0 && (
                      <div className="w-full mt-2 p-3 border rounded-md bg-white">
                        <h5
                          className="text-sm font-semibold mb-2"
                          style={{ color: "#1E3A8A" }}
                        >
                          Detalhes das Parcelas
                        </h5>
                        <Table className="min-w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Parc.</TableHead>
                              <TableHead className="text-xs">
                                Vencimento
                              </TableHead>
                              <TableHead className="text-xs text-right">
                                Valor
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payment.installmentsDetails.map(
                              (detail, detIndex) => (
                                <TableRow key={detIndex}>
                                  <TableCell className="text-xs w-1/4">
                                    {detail.number}
                                  </TableCell>
                                  <TableCell className="text-xs w-1/3">
                                    <Input
                                      type="date"
                                      value={detail.dueDate}
                                      onChange={(e) =>
                                        updateInstallmentDetail(
                                          index,
                                          detIndex,
                                          "dueDate",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full h-8 text-xs"
                                    />
                                  </TableCell>
                                  <TableCell className="text-xs text-right w-1/3">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={parseFloat(detail.amount).toFixed(
                                        2,
                                      )}
                                      onChange={(e) =>
                                        updateInstallmentDetail(
                                          index,
                                          detIndex,
                                          "amount",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-full h-8 text-xs text-right"
                                    />
                                  </TableCell>
                                </TableRow>
                              ),
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                </div>
              );
            })}
          </div>

          <Button
            onClick={addPaymentMethod}
            variant="outline"
            className="w-full mt-2"
            style={{ borderColor: "#e78b3a", color: "#e78b3a" }}
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar Forma de Pagamento
          </Button>

          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-gray-100">
              <Label className="text-xs text-gray-600">Total Pagamentos</Label>
              <p className="text-lg font-bold mt-1 text-gray-800">
                R$ {totalPaymentsMade.toFixed(2)}
              </p>
            </div>
            <div
              className={`text-center p-3 rounded-lg ${Math.abs(totalRemaining) < 0.01 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
            >
              <Label className="text-xs text-gray-600">Falta Pagar</Label>
              <p
                className={`text-lg font-bold mt-1 ${Math.abs(totalRemaining) < 0.01 ? "text-green-700" : "text-red-700"}`}
              >
                R$ {totalRemaining.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Label
              htmlFor="payment-notes"
              className="text-xs font-medium"
              style={{ color: "#374151" }}
            >
              Observações do Pagamento:
            </Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              className="mt-1"
              placeholder="Digite observações sobre os pagamentos..."
              id="payment-notes"
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
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
};

export default function SalesPage({ onSaleComplete }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation(); // Added location

  const [people, setPeople] = useState([]);
  const [products, setProducts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [conveniadas, setConveniadas] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [currentSale, setCurrentSale] = useState(initialSaleState);
  const [editSaleId, setEditSaleId] = useState(null); // ID da venda sendo editada
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [customerSelected, setCustomerSelected] = useState(false);
  const [customerFound, setCustomerFound] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [productId, setProductId] = useState("");
  const [productQuantity, setProductQuantity] = useState("1");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [selectedProductObj, setSelectedProductObj] = useState(null);

  const [temConvenio, setTemConvenio] = useState("nao");

  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const user = await entities.User.me();
      setCurrentUser(user);
      const companyId = user.companyId;

      setCurrentSale((prev) => ({
        ...prev,
        createdByName: user.name,
      }));

      const [
        allPeople,
        productsData,
        sectorsData,
        paymentTypesData,
        cashAccountsData,
        ordersData,
      ] = await Promise.all([
        entities.Person.filter({ companyId: companyId }),
        entities.Product.filter({ companyId: companyId, active: true }),
        entities.Sector.filter({ companyId: companyId, active: true }),
        entities.PaymentType.filter({ companyId: companyId, active: true }),
        entities.CashAccount.filter({ companyId: companyId, active: true }),
        entities.Order.filter(
          {
            companyId: companyId,
            status: ["pendente", "em_atendimento", "finalizado"],
          },
          { sort: "-createdAt", limit: 100 },
        ).catch(() => []),
      ]);

      setPeople(allPeople.filter((p) => p.type === "cliente"));
      setConveniadas(
        allPeople.filter((p) => p.type === "conveniada" && p.active),
      );
      setProducts(productsData);
      setSectors(sectorsData);
      setPaymentTypes(paymentTypesData);
      setCashAccounts(cashAccountsData);
      setOrders(ordersData);
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

  // Efeito para carregar venda em modo de edição
  useEffect(() => {
    if (location.state?.editSale && sectors.length > 0 && people.length > 0) {
      const sale = location.state.editSale;
      setEditSaleId(sale.id);
      setIsEditingMode(true);

      const customer = people.find((p) => p.id === sale.personId);
      if (customer) {
        setCustomerFound(customer);
        setCustomerSelected(true);
      }

      setCurrentSale({
        ...sale,
        saleDate: sale.saleDate
          ? formatDateOnly(parseISO(sale.saleDate), "yyyy-MM-dd")
          : formatDateOnly(new Date(), "yyyy-MM-dd"),
      });

      if (sale.conveniadaId) {
        setTemConvenio("sim");
      }

      // Limpa o state do location para não carregar novamente ao navegar
      window.history.replaceState({}, document.title);
    }
  }, [location.state, sectors, people]);

  const handleProductCodeChange = (id) => {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product) {
      setSelectedProductObj(product);
      setProductDescription(product.name);
      setProductPrice(product.unitPrice.toString());
    }
  };

  const handleProductSelect = (product) => {
    handleProductCodeChange(product?.id || "");
  };

  const saleProductColumns = [
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
          min="1"
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
      header: "Preço Un.",
      render: (item) => `R$ ${Number(item.unitPrice || 0).toFixed(2)}`,
    },
    {
      key: "total",
      header: "Valor Total",
      render: (item) => `R$ ${Number(item.total || 0).toFixed(2)}`,
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
    {
      key: "vasilhameLoanQuantity",
      header: "Vasilhame",
      render: (item, index) =>
        item.category === "glp" && item.vasilhameId ? (
          <Input
            type="number"
            value={item.vasilhameLoanQuantity}
            onChange={(event) =>
              updateItem(index, "vasilhameLoanQuantity", event.target.value)
            }
            className="w-16"
          />
        ) : (
          "-"
        ),
    },
    {
      key: "quantityToPickup",
      header: "A Retirar",
      render: (item, index) => (
        <Input
          type="number"
          value={item.quantityToPickup}
          onChange={(event) =>
            updateItem(index, "quantityToPickup", event.target.value)
          }
          className="w-16"
        />
      ),
    },
  ];

  const handleAddProduct = () => {
    if (!selectedProductObj) {
      toast({
        title: "Atenção",
        description: "Selecione um produto válido.",
        variant: "warning",
      });
      return;
    }

    const qty = parseFloat(productQuantity) || 0;
    const price = parseFloat(productPrice) || 0;

    if (qty <= 0 || price <= 0) {
      toast({
        title: "Atenção",
        description: "Quantidade e preço devem ser maiores que zero.",
        variant: "warning",
      });
      return;
    }

    const itemExists = currentSale.items.find(
      (item) => item.productId === selectedProductObj.id,
    );
    if (itemExists) {
      toast({
        title: "Atenção",
        description: "Este produto já foi adicionado.",
        variant: "warning",
      });
      return;
    }

    const newItem = {
      productId: selectedProductObj.id,
      productCode: selectedProductObj.code || "",
      productName: selectedProductObj.name,
      category: selectedProductObj.category,
      vasilhameId: selectedProductObj.vasilhameId || "",
      vasilhameName: selectedProductObj.vasilhameName || "",
      quantity: qty,
      unitPrice: price,
      discount: 0,
      total: qty * price,
      quantityToPickup: 0,
      vasilhameLoanQuantity: 0,
    };

    setCurrentSale((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setProductId("");
    setProductQuantity("1");
    setProductPrice("");
    setProductDescription("");
    setSelectedProductObj(null);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...currentSale.items];
    const numericValue = [
      "quantity",
      "unitPrice",
      "discount",
      "quantityToPickup",
      "vasilhameLoanQuantity",
    ].includes(field)
      ? parseFloat(value) || 0
      : value;

    newItems[index][field] = numericValue;

    const item = newItems[index];
    item.total = item.quantity * item.unitPrice - item.discount;

    setCurrentSale((prev) => ({ ...prev, items: newItems }));
  };

  const removeItem = (index) => {
    setCurrentSale((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSelectClient = (client) => {
    setCustomerSelected(true);
    setCustomerFound(client);
    setCurrentSale((prev) => ({
      ...prev,
      personId: client.id,
      personName: client.name,
      conveniadaId: client.conveniadaId || "",
      conveniadaName: client.conveniadaName || "",
    }));

    if (client.conveniadaId) {
      setTemConvenio("sim");
    } else {
      setTemConvenio("nao");
    }

    setShowClientSearch(false);
    setClientSearchTerm("");
  };

  const clearCustomer = () => {
    setCustomerSelected(false);
    setCustomerFound(null);
    setCurrentSale((prev) => ({
      ...prev,
      personId: "",
      personName: "",
      conveniadaId: "",
      conveniadaName: "",
    }));
    setTemConvenio("nao");
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);

    if (!orderId) {
      resetForm();
      return;
    }

    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      toast({
        title: "Erro",
        description: "Pedido não encontrado.",
        variant: "destructive",
      });
      resetForm();
      return;
    }

    const customer = people.find((p) => p.id === order.personId);
    if (customer) {
      setCustomerFound(customer);
      setCustomerSelected(true);
    } else {
      setCustomerFound(null);
      setCustomerSelected(false);
      toast({
        title: "Atenção",
        description: "Cliente do pedido não encontrado.",
        variant: "warning",
      });
    }

    let orderSector = null;
    if (order.employeeId) {
      orderSector = sectors.find((s) => s.employeeId === order.employeeId);

      if (!orderSector) {
        toast({
          title: "Atenção",
          description: `Não foi encontrado um setor vinculado ao entregador ${order.employeeName || ""}. Por favor, selecione um setor manualmente.`,
          variant: "warning",
        });
      }
    } else {
      toast({
        title: "Atenção",
        description: `O pedido não possui entregador definido. Por favor, selecione um setor manualmente.`,
        variant: "warning",
      });
    }

    const saleItems = order.items.map((item) => {
      const productDetails = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productCode: productDetails?.code || "",
        productName: item.productName,
        category: productDetails?.category || "",
        vasilhameId: productDetails?.vasilhameId || "",
        vasilhameName: productDetails?.vasilhameName || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        total: item.quantity * item.unitPrice - (item.discount || 0),
        quantityToPickup: 0,
        vasilhameLoanQuantity: 0,
      };
    });

    const orderConveniadaId =
      order.conveniadaId || customer?.conveniadaId || "";
    const orderConveniadaName =
      order.conveniadaName || customer?.conveniadaName || "";

    const orderTotal = order.totalAmount;

    setCurrentSale({
      ...initialSaleState,
      saleNumber: `VEN-${Date.now()}`,
      personId: order.personId,
      personName: order.personName,
      sectorId: orderSector ? orderSector.id : "",
      sectorName: orderSector ? orderSector.name : "",
      status: "concluida",
      saleDate: order.deliveryDate
        ? formatDateOnly(new Date(order.deliveryDate), "yyyy-MM-dd")
        : formatDateOnly(new Date(), "yyyy-MM-dd"),
      notes: order.notes || "",
      items: saleItems,
      paymentMethods: [
        {
          paymentTypeId: "",
          paymentTypeName: "",
          amount: orderTotal,
          installments: 1,
          cashAccountId: "",
          installmentsDetails: [], // Initialize for order payment methods
        },
      ],
      totalAmount: orderTotal,
      createdByName: currentUser?.name || "",
      orderId: order.id,
      orderNumber: order.orderNumber,
      conveniadaId: orderConveniadaId,
      conveniadaName: orderConveniadaName,
    });
    setTemConvenio(orderConveniadaId ? "sim" : "nao");

    toast({
      title: "Pedido Carregado",
      description: `Pedido ${order.orderNumber} carregado com sucesso. ${orderSector ? `Setor: ${orderSector.name}` : "Selecione o setor de estoque."}`,
      variant: "success",
    });
  };

  const handleOpenPaymentModal = () => {
    if (!customerSelected) {
      toast({
        title: "Erro",
        description: "Selecione um cliente.",
        variant: "destructive",
      });
      return;
    }

    if (!currentSale.sectorId) {
      toast({
        title: "Erro",
        description: "Selecione o setor.",
        variant: "destructive",
      });
      return;
    }

    if (currentSale.items.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um produto.",
        variant: "destructive",
      });
      return;
    }

    if (
      temConvenio === "sim" &&
      customerFound &&
      customerFound.conveniadaId &&
      !currentSale.conveniadaId
    ) {
      toast({
        title: "Erro",
        description: "Selecione a empresa conveniada.",
        variant: "destructive",
      });
      return;
    }

    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (payments, modalObservations) => {
    if (isSaving) return; // Bloqueia duplo clique

    const totalSale = currentSale.items.reduce(
      (sum, item) => sum + item.total,
      0,
    );
    const totalPayments = payments.reduce(
      (sum, pm) => sum + (parseFloat(pm.amount) || 0),
      0,
    );

    if (Math.abs(totalPayments - totalSale) > 0.01) {
      toast({
        title: "Erro",
        description: "O total dos pagamentos deve ser igual ao total da venda.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      let savedSale;

      if (isEditingMode) {
        // Agora atualiza a venda com os novos dados
        const updateData = {
          ...currentSale,
          totalAmount: totalSale,
          paymentMethods: payments,
          notes: modalObservations,
          conveniadaId: temConvenio === "sim" ? currentSale.conveniadaId : null,
          conveniadaName:
            temConvenio === "sim" ? currentSale.conveniadaName : null,
          saleDate: currentSale.saleDate,
        };
        savedSale = await entities.Sale.update(editSaleId, updateData);
      } else {
        // MODO CRIAÇÃO (Lógica original)
        const saleData = {
          ...currentSale,
          totalAmount: totalSale,
          paymentMethods: payments, // Payments now include installmentsDetails
          notes: modalObservations,
          orderId: selectedOrderId,
          orderNumber: currentSale.orderNumber,
          conveniadaId:
            temConvenio === "sim" && currentSale.conveniadaId
              ? currentSale.conveniadaId
              : null,
          conveniadaName:
            temConvenio === "sim" && currentSale.conveniadaName
              ? currentSale.conveniadaName
              : null,
        };

        savedSale = await entities.Sale.createComplete(saleData);
      }

      toast({
        title: "Sucesso!",
        description: isEditingMode
          ? `Venda #${savedSale.saleNumber} atualizada com sucesso.`
          : `Venda #${savedSale.saleNumber} realizada com sucesso.`,
      });
      setShowPaymentModal(false);
      resetForm();

      // Se está em modo modal, chama o callback para fechar
      if (onSaleComplete) {
        setTimeout(() => {
          onSaleComplete();
        }, 1000);
      }
    } catch (error) {
      console.error("Erro ao realizar venda:", error);
      toast({
        title: "Erro",
        description: "Erro ao realizar venda.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setCurrentSale({
      ...initialSaleState,
      saleNumber: "",
      createdByName: currentUser?.name || "",
    });
    setEditSaleId(null);
    setIsEditingMode(false);
    setCustomerSelected(false);
    setCustomerFound(null);
    setProductId("");
    setProductQuantity("1");
    setProductPrice("");
    setProductDescription("");
    setSelectedProductObj(null);
    setTemConvenio("nao");
    setSelectedOrderId(null);
    setShowPaymentModal(false);
  };

  const totalVenda = currentSale.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const totalDesconto = currentSale.items.reduce(
    (sum, item) => sum + item.discount,
    0,
  );
  const totalPagar = currentSale.items.reduce(
    (sum, item) => sum + item.total,
    0,
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-[1400px] mx-auto p-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">
          {isEditingMode
            ? `Manutenção de Venda #${currentSale.saleNumber}`
            : "Vendas"}
        </h1>

        {/* Seção Pedido */}
        {!isEditingMode && (
          <Card className="mb-4 bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label
                    className="text-xs font-medium"
                    style={{ color: "#374151" }}
                  >
                    Pedido:
                  </Label>
                  <Select
                    value={selectedOrderId || ""}
                    onValueChange={handleSelectOrder}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Nova venda ou selecione pedido..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>🆕 Nova Venda</SelectItem>
                      {orders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          #{order.orderNumber} - {order.personName} - R${" "}
                          {order.totalAmount.toFixed(2)} -{" "}
                          {order.status === "pendente"
                            ? "⏳ Pendente"
                            : order.status === "em_atendimento"
                              ? "🚚 Em Atendimento"
                              : "✅ Finalizado"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label
                    className="text-xs font-medium"
                    style={{ color: "#374151" }}
                  >
                    Data: <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={currentSale.saleDate}
                    onChange={(e) =>
                      setCurrentSale((prev) => ({
                        ...prev,
                        saleDate: e.target.value,
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
                    Setor: <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={currentSale.sectorId || ""}
                    onValueChange={(value) => {
                      const sector = sectors.find((s) => s.id === value);
                      setCurrentSale((prev) => ({
                        ...prev,
                        sectorId: value,
                        sectorName: sector ? sector.name : "",
                      }));
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isEditingMode && (
          <Card
            className="mb-4"
            style={{
              background: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    className="text-xs font-medium"
                    style={{ color: "#374151" }}
                  >
                    Data da Venda: <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={currentSale.saleDate}
                    onChange={(e) =>
                      setCurrentSale((prev) => ({
                        ...prev,
                        saleDate: e.target.value,
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
                    Setor: <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={currentSale.sectorId || ""}
                    onValueChange={(value) => {
                      const sector = sectors.find((s) => s.id === value);
                      setCurrentSale((prev) => ({
                        ...prev,
                        sectorId: value,
                        sectorName: sector ? sector.name : "",
                      }));
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seção Produtos */}
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
              variant="sale"
              draft={{
                productId,
                productName: productDescription,
                quantity: productQuantity,
                unitPrice: productPrice,
                discount: 0,
              }}
              onDraftChange={(field, value) => {
                if (field === "quantity") setProductQuantity(value);
                if (field === "unitPrice") setProductPrice(value);
              }}
              onProductSelect={handleProductSelect}
              onAdd={handleAddProduct}
            />
            <ProductItemsTable
              items={currentSale.items}
              columns={saleProductColumns}
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
              Observação do Pedido:
            </Label>
            <Textarea
              value={currentSale.notes}
              onChange={(e) =>
                setCurrentSale((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              className="mt-1"
              placeholder="Digite observações sobre o pedido..."
            />
          </CardContent>
        </Card>

        {/* Seção Cliente e Convênio */}
        <Card
          className="mb-4"
          style={{
            background: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Venda Para */}
              <div>
                <h3
                  className="text-sm font-semibold mb-3"
                  style={{ color: "#1E3A8A" }}
                >
                  Venda Para: <span className="text-red-500">*</span>
                </h3>
                <PersonSelector
                  options={people}
                  selectedPerson={customerFound}
                  open={showClientSearch}
                  value={clientSearchTerm}
                  title="Selecionar Cliente"
                  inputPlaceholder="Buscar cliente..."
                  searchPlaceholder="Digite para buscar..."
                  onOpenChange={setShowClientSearch}
                  onValueChange={setClientSearchTerm}
                  onSelect={handleSelectClient}
                  onClear={clearCustomer}
                />
              </div>

              {/* Convênio - só aparece se o cliente tiver conveniada vinculada */}
              {customerFound && customerFound.conveniadaId && (
                <div>
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: "#1E3A8A" }}
                  >
                    Convênio:
                  </h3>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="convenio"
                        value="sim"
                        checked={temConvenio === "sim"}
                        onChange={(e) => setTemConvenio(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Sim</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="convenio"
                        value="nao"
                        checked={temConvenio === "nao"}
                        onChange={(e) => {
                          setTemConvenio(e.target.value);
                          setCurrentSale((prev) => ({
                            ...prev,
                            conveniadaId: "",
                            conveniadaName: "",
                          }));
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Não</span>
                    </label>
                  </div>

                  {temConvenio === "sim" && (
                    <div>
                      <Label
                        className="text-xs font-medium mb-1 block"
                        style={{ color: "#374151" }}
                      >
                        Empresa Conveniada:{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={currentSale.conveniadaId || ""}
                        onValueChange={(value) => {
                          const conveniada = conveniadas.find(
                            (c) => c.id === value,
                          );
                          setCurrentSale((prev) => ({
                            ...prev,
                            conveniadaId: value,
                            conveniadaName: conveniada ? conveniada.name : "",
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa conveniada" />
                        </SelectTrigger>
                        <SelectContent>
                          {conveniadas.map((conveniada) => (
                            <SelectItem
                              key={conveniada.id}
                              value={conveniada.id}
                            >
                              {conveniada.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seção Totais */}
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
                  Total da Venda
                </Label>
                <p
                  className="text-lg font-semibold mt-1"
                  style={{ color: "#1F2937" }}
                >
                  R$ {totalVenda.toFixed(2)}
                </p>
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
                  R$ {totalDesconto.toFixed(2)}
                </p>
              </div>
              <div
                className="text-center p-3 rounded-lg"
                style={{ background: "#F9FAFB" }}
              >
                <Label className="text-xs" style={{ color: "#6B7280" }}>
                  Cred. Resíduos
                </Label>
                <p
                  className="text-lg font-semibold mt-1"
                  style={{ color: "#1F2937" }}
                >
                  0,00
                </p>
              </div>
              <div
                className="text-center p-4 rounded-lg"
                style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
              >
                <Label
                  className="text-xs font-semibold"
                  style={{ color: "#15803D" }}
                >
                  Total a Pagar
                </Label>
                <p
                  className="text-xl font-bold mt-1"
                  style={{ color: "#10B981" }}
                >
                  R$ {totalPagar.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé com Botões */}
        <div
          className="p-4 rounded-lg"
          style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
        >
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={handleOpenPaymentModal}
              className="flex items-center gap-2"
              style={{ background: "#e78b3a", color: "white" }}
            >
              <Save className="w-4 h-4" />
              <span className="text-sm">OK</span>
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              <span className="text-sm">Cancelar</span>
            </Button>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleConfirmPayment}
        totalAmount={totalPagar}
        paymentTypes={paymentTypes}
        cashAccounts={cashAccounts}
        saleNumber={currentSale.saleNumber}
        customerName={currentSale.personName}
        saleDate={currentSale.saleDate}
        initialNotes={currentSale.notes}
        initialPaymentMethods={currentSale.paymentMethods}
        isSaving={isSaving}
      />
    </div>
  );
}
