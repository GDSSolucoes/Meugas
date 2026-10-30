import React, { useState, useEffect, useCallback } from "react";
import { Plus, Minus, XCircle } from "lucide-react";
import { Order } from "@/entities/Order";
import { Person } from "@/entities/Person";
import { Product } from "@/entities/Product";
import { Employee } from "@/entities/Employee";
import { PaymentType } from "@/entities/PaymentType";
import { AccountsReceivable } from "@/entities/AccountsReceivable";
import { User as UserEntity } from "@/entities/User";
import { format, addDays } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { formatDateOnly } from "@/utils";
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
import { Textarea } from "@/components/ui/textarea";
import ProductEntryPanel from "@/components/products/ProductEntryPanel";
import ProductItemsTable from "@/components/products/ProductItemsTable";
import PersonSelector from "@/components/people/PersonSelector";

export default function OrdersPage() {
  const { toast } = useToast();
  const [people, setPeople] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [customerFound, setCustomerFound] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [pedidoItems, setPedidoItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQuantity, setProductQuantity] = useState("1");
  const [productPrice, setProductPrice] = useState("");
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const initialOrderState = {
    personId: "",
    personName: "",
    personAddress: {}, // Add personAddress to initial state
    employeeId: "",
    employeeName: "",
    paymentTypeId: "",
    paymentTypeName: "",
    status: "pendente",
    deliveryDate: formatDateOnly(new Date(), "yyyy-MM-dd"),
    notes: "",
    items: [],
    totalAmount: 0,
    createdByName: "",
    canal: "DISK GAS",
    urgente: false,
    convenio: false,
  };

  const [currentOrder, setCurrentOrder] = useState(initialOrderState);

  const initialCustomerState = {
    name: "",
    document: "",
    email: "",
    birthday: "", // Added birthday field
    phone: [""], // Ensure phone is an array from the start
    type: "cliente",
    address: {
      zipcode: "",
      street: "",
      number: "",
      complement: "", // Added complement
      neighborhood: "",
      referencePoint: "",
      city: "",
      state: "",
    },
    glpConsumptionDays: "", // Added glpConsumptionDays
    conveniadaId: "",
    conveniadaName: "",
    createdByName: "",
    active: true,
    personNumber: "", // Added for sequential numbering
  };

  const [currentCustomer, setCurrentCustomer] = useState(initialCustomerState);

  // New function: generateReceivables
  const generateReceivables = async (order, user) => {
    if (order.paymentMethods && Array.isArray(order.paymentMethods)) {
      for (const payment of order.paymentMethods) {
        if (
          payment.installments &&
          payment.installments > 0 &&
          payment.type !== "avista"
        ) {
          for (let i = 1; i <= payment.installments; i++) {
            const baseDueDate = payment.dueDate
              ? new Date(payment.dueDate)
              : new Date(order.deliveryDate || new Date());
            await AccountsReceivable.create({
              personId: order.personId,
              personName: order.personName,
              saleId: order.id,
              installmentNumber: i,
              description: `Parcela ${i}/${payment.installments} do Pedido ${order.orderNumber}`,
              dueDate: formatDateOnly(
                addDays(baseDueDate, (i - 1) * 30),
                "yyyy-MM-dd",
              ),
              amount: payment.amount / payment.installments,
              status: "pendente",
              companyId: user.companyId,
              companyName: user.companyName,
              createdByName: user.name,
            });
          }
        }
      }
    } else {
      const paymentType = paymentTypes.find(
        (pt) => pt.id === order.paymentTypeId,
      );
      if (paymentType && paymentType.type === "aPrazo") {
        await AccountsReceivable.create({
          personId: order.personId,
          personName: order.personName,
          saleId: order.id,
          installmentNumber: 1,
          description: `Pedido ${order.orderNumber} - ${order.paymentTypeName}`,
          dueDate: format(
            addDays(new Date(order.deliveryDate || new Date()), 0),
            "yyyy-MM-dd",
          ),
          amount: order.totalAmount,
          status: "pendente",
          companyId: user.companyId,
          companyName: user.companyName,
          createdByName: user.name,
        });
      }
    }
  };

  // New function: validateOrder - encapsulates existing validation
  const validateOrder = () => {
    if (!customerFound) {
      toast({
        title: "Atenção",
        description: "Selecione um cliente antes de finalizar.",
        variant: "destructive",
      });
      return false;
    }

    if (pedidoItems.length === 0) {
      toast({
        title: "Atenção",
        description: "Adicione pelo menos um item ao pedido.",
        variant: "destructive",
      });
      return false;
    }
    if (!currentOrder.paymentTypeId) {
      toast({
        title: "Atenção",
        description: "Selecione a forma de pagamento do pedido.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // New function to search address by CEP
  const searchAddressByCEP = async (cep) => {
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setCurrentCustomer((prev) => ({
            ...prev,
            address: {
              ...prev.address,
              zipcode: cep,
              street: (data.logradouro || "").toUpperCase(),
              neighborhood: (data.bairro || "").toUpperCase(),
              city: (data.localidade || "").toUpperCase(),
              state: (data.uf || "").toUpperCase(),
              complement: prev.address.complement || "", // Preserve existing complement
            },
          }));
          toast({
            title: "CEP encontrado",
            description: "Endereço preenchido automaticamente.",
          });
        } else {
          // Clear address fields if CEP search fails
          setCurrentCustomer((prev) => ({
            ...prev,
            address: {
              ...prev.address,
              zipcode: cep,
              street: "",
              neighborhood: "",
              city: "",
              state: "",
              complement: "", // Clear complement on failed CEP search
            },
          }));
          toast({
            title: "CEP não encontrado",
            description: "CEP não existe. Preencha o endereço manualmente.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        toast({
          title: "Erro",
          description: "Não foi possível buscar o CEP. Verifique sua conexão.",
          variant: "destructive",
        });
        // Clear address fields on network error
        setCurrentCustomer((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            zipcode: cep,
            street: "",
            neighborhood: "",
            city: "",
            state: "",
            complement: "", // Clear complement on network error
          },
        }));
      }
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await UserEntity.me();
      const companyId = user.companyId;

      const [allPeople, productsData, employeesData, paymentTypesData] =
        await Promise.all([
          Person.filter({ companyId: companyId }),
          Product.filter({ companyId: companyId, active: true }),
          Employee.filter(
            { companyId: companyId, position: "entregador", active: true },
            { sort: "name" },
          ),
          PaymentType.filter({ companyId: companyId, active: true }),
        ]);

      setPeople(allPeople.filter((p) => p.type === "cliente"));
      setProducts(productsData);
      setEmployees(employeesData);
      setPaymentTypes(paymentTypesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados necessários.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleShowHistory = async () => {
    if (!customerFound) return;

    setIsHistoryLoading(true);
    setShowHistoryModal(true);
    try {
      const user = await UserEntity.me();
      const history = await Order.filter(
        {
          personId: customerFound.id,
          companyId: user.companyId,
        },
        {
          sort: "-createdAt",
          limit: 12,
        },
      );
      setCustomerHistory(history);
    } catch (error) {
      console.error("Erro ao buscar histórico do cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico do cliente.",
        variant: "destructive",
      });
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const selectCustomer = (person) => {
    setCustomerFound(person);
    setCurrentOrder((prev) => ({
      ...prev,
      personId: person.id,
      personName: person.name,
      personAddress: person.address || {},
    }));
    setClientSearchTerm("");
  };

  const handleEditCustomer = () => {
    if (customerFound) {
      // Ensure phone is always an array for editing
      const phoneArray = Array.isArray(customerFound.phone)
        ? customerFound.phone
        : customerFound.phone
          ? [customerFound.phone]
          : [""];

      setCurrentCustomer({
        ...customerFound,
        phone: phoneArray.length > 0 ? phoneArray : [""], // Ensure at least one empty field
      });
      setIsEditingCustomer(true);
      setShowCustomerForm(true);
    }
  };

  const handlePhoneChange = (index, value) => {
    const newPhones = [...currentCustomer.phone];
    newPhones[index] = value;
    setCurrentCustomer((prev) => ({ ...prev, phone: newPhones }));
  };

  const addPhone = () => {
    setCurrentCustomer((prev) => ({ ...prev, phone: [...prev.phone, ""] }));
  };

  const removePhone = (index) => {
    if (currentCustomer.phone.length > 1) {
      setCurrentCustomer((prev) => {
        const newPhones = prev.phone.filter((_, i) => i !== index);
        return { ...prev, phone: newPhones };
      });
    }
  };

  const handleSaveCustomer = async () => {
    try {
      let savedCustomer;
      const user = await UserEntity.me();

      let customerPayload = {
        ...currentCustomer,
        // Filter out empty phone numbers before saving
        phone: currentCustomer.phone.filter((p) => p.trim() !== ""),
        companyId: user.companyId,
        companyName: user.companyName,
        createdByName: user.name,
      };

      // If all phone fields are empty after filtering, ensure the phone array is not empty
      if (customerPayload.phone.length === 0) {
        customerPayload.phone = [""];
      }

      // Ensure optional fields are null if empty
      if (customerPayload.glpConsumptionDays === "") {
        customerPayload.glpConsumptionDays = null;
      }
      if (customerPayload.birthday === "") {
        customerPayload.birthday = null;
      }

      if (isEditingCustomer) {
        const { id, ...customerData } = customerPayload;
        savedCustomer = await Person.update(id, customerData);
      } else {
        // Generate sequential person number for new customers
        const allPersons = await Person.filter({ companyId: user.companyId });
        const maxPersonNumber = allPersons.reduce((max, person) => {
          const currentNum = parseInt(person.personNumber, 10);
          return !isNaN(currentNum) && currentNum > max ? currentNum : max;
        }, 0);
        const newPersonNumber = maxPersonNumber + 1;

        customerPayload = {
          ...customerPayload,
          personNumber: String(newPersonNumber),
        };

        savedCustomer = await Person.create(customerPayload);
      }

      const refreshedPeople = await Person.filter({
        companyId: user.companyId,
        type: "cliente",
      });
      setPeople(refreshedPeople);

      const updatedCustomer = refreshedPeople.find(
        (p) => p.id === (savedCustomer.id || currentCustomer.id),
      );

      selectCustomer(updatedCustomer); // Use selectCustomer for consistency
      setShowCustomerForm(false);
      resetCustomerForm();
      toast({ title: "Sucesso", description: "Cliente salvo com sucesso." });
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o cliente.",
        variant: "destructive",
      });
    }
  };

  const resetCustomerForm = () => {
    setCurrentCustomer(initialCustomerState);
    setIsEditingCustomer(false);
  };

  const clearCustomer = () => {
    setCustomerFound(null);
    setCurrentOrder((prev) => ({
      ...prev,
      personId: "",
      personName: "",
      personAddress: {}, // Clear address when clearing customer
    }));
  };

  const calcularTotal = () => {
    return pedidoItems.reduce(
      (total, item) => total + (item.qtde * item.preco - item.desconto),
      0,
    );
  };

  const handleProductSelect = (product) => {
    setSelectedProductId(product?.id || "");
    setProductPrice(product?.unitPrice?.toString() || "");
  };

  const orderProductColumns = [
    {
      key: "codigo",
      header: "Código",
    },
    {
      key: "produto",
      header: "Descrição",
    },
    {
      key: "qtde",
      header: "Qtde",
      render: (item, index) => (
        <Input
          type="number"
          min="1"
          step="1"
          value={item.qtde}
          onChange={(event) => {
            const quantity = Math.max(1, Number(event.target.value) || 1);
            setPedidoItems((previous) =>
              previous.map((currentItem, itemIndex) =>
                itemIndex === index
                  ? { ...currentItem, qtde: quantity }
                  : currentItem,
              ),
            );
          }}
          className="w-20"
        />
      ),
    },
    {
      key: "preco",
      header: "Preço Un.",
      render: (item, index) => (
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.preco}
          onChange={(event) => {
            const price = Math.max(0, Number(event.target.value) || 0);
            setPedidoItems((previous) =>
              previous.map((currentItem, itemIndex) =>
                itemIndex === index
                  ? { ...currentItem, preco: price }
                  : currentItem,
              ),
            );
          }}
          className="w-24"
        />
      ),
    },
    {
      key: "desconto",
      header: "Desconto",
      render: (item, index) => (
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.desconto}
          onChange={(event) => {
            const discount = Math.max(0, Number(event.target.value) || 0);
            setPedidoItems((previous) =>
              previous.map((currentItem, itemIndex) =>
                itemIndex === index
                  ? { ...currentItem, desconto: discount }
                  : currentItem,
              ),
            );
          }}
          className="w-24"
        />
      ),
    },
    {
      key: "total",
      header: "Valor Total",
      render: (item) =>
        `R$ ${(item.qtde * item.preco - item.desconto).toFixed(2)}`,
    },
  ];

  const handleAddProduct = () => {
    const product = products.find((item) => item.id === selectedProductId);
    const quantity = Number(productQuantity) || 0;
    const price = Number(productPrice) || 0;

    if (!product || quantity <= 0 || price < 0) {
      toast({
        title: "Atenção",
        description: "Selecione um produto e informe uma quantidade válida.",
        variant: "destructive",
      });
      return;
    }

    if (pedidoItems.some((item) => item.productId === product.id)) {
      toast({
        title: "Atenção",
        description: "Este produto já foi adicionado ao pedido.",
        variant: "destructive",
      });
      return;
    }

    setPedidoItems((previous) => [
      ...previous,
      {
        productId: product.id,
        codigo: product.code || product.id.substring(0, 6),
        produto: product.name,
        qtde: quantity,
        preco: price,
        desconto: 0,
      },
    ]);
    setSelectedProductId("");
    setProductQuantity("1");
    setProductPrice("");
  };

  const handleSaveOrder = async () => {
    if (!validateOrder()) return;

    setIsSaving(true);
    try {
      const user = await UserEntity.me();
      const orderTotal = calcularTotal();
      const paymentType = paymentTypes.find(
        (item) => item.id === currentOrder.paymentTypeId,
      );

      // Lógica para numeração sequencial
      const companyOrders = await Order.filter({ companyId: user.companyId });
      const maxOrderNumber = companyOrders.reduce((max, order) => {
        const currentNum = parseInt(order.orderNumber, 10);
        return !isNaN(currentNum) && currentNum > max ? currentNum : max;
      }, 0);
      const newOrderNumber = maxOrderNumber + 1;

      const orderToSave = {
        orderNumber: String(newOrderNumber),
        personId: currentOrder.personId,
        personName: currentOrder.personName,
        // Garante que o endereço do cliente selecionado seja salvo no pedido
        personAddress: customerFound?.address || {},
        employeeId: currentOrder.employeeId || "",
        employeeName: currentOrder.employeeName || "",
        paymentTypeId: currentOrder.paymentTypeId || "",
        paymentTypeName: paymentType?.name || "",
        status: "pendente", // Garantir que o status seja definido explicitamente
        deliveryDate: currentOrder.deliveryDate,
        notes: currentOrder.notes || "",
        canal: currentOrder.canal, // Preserve existing order properties
        urgente: currentOrder.urgente, // Preserve existing order properties
        convenio: currentOrder.convenio, // Preserve existing order properties
        items: pedidoItems.map((item) => ({
          productId: item.productId,
          productName: item.produto,
          quantity: item.qtde,
          unitPrice: item.preco,
          discount: item.desconto,
          total: item.qtde * item.preco - item.desconto,
        })),
        totalAmount: orderTotal,
        companyId: user.companyId,
        companyName: user.companyName,
        createdByName: user.name,
      };

      const newOrder = await Order.create(orderToSave);

      console.log("Pedido criado com sucesso:", newOrder); // Debug log

      await generateReceivables(newOrder, user);

      // Reset form after successful order creation
      setCurrentOrder(initialOrderState);
      setPedidoItems([]);
      setCustomerFound(null);
      setClientSearchTerm("");

      toast({
        title: "Sucesso",
        description: `Pedido ${newOrderNumber} criado com sucesso! Vá para Acompanhamento para visualizar.`,
      });
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar o pedido.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-xl font-bold" style={{ color: "#223f61" }}>
          Carregando dados...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Customer Form Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2
                className="text-xl font-bold mb-4"
                style={{ color: "#223f61" }}
              >
                {isEditingCustomer
                  ? "Editar Cliente"
                  : "Cadastrar Novo Cliente"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#223f61" }}
                  >
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={currentCustomer.name}
                    onChange={(e) =>
                      setCurrentCustomer((prev) => ({
                        ...prev,
                        name: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: "#95b4df" }}
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#223f61" }}
                  >
                    CPF/CNPJ
                  </label>
                  <input
                    type="text"
                    value={currentCustomer.document}
                    onChange={(e) =>
                      setCurrentCustomer((prev) => ({
                        ...prev,
                        document: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: "#95b4df" }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#223f61" }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={currentCustomer.email}
                    onChange={(e) =>
                      setCurrentCustomer((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: "#95b4df" }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#223f61" }}
                  >
                    Data de Aniversário
                  </label>
                  <input
                    type="date"
                    value={currentCustomer.birthday || ""}
                    onChange={(e) =>
                      setCurrentCustomer((prev) => ({
                        ...prev,
                        birthday: e.target.value,
                      }))
                    }
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: "#95b4df" }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "#223f61" }}
                  >
                    Telefones
                  </label>
                  <div className="space-y-2">
                    {currentCustomer.phone.map((phone, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) =>
                            handlePhoneChange(index, e.target.value)
                          }
                          placeholder={`Telefone ${index + 1}`}
                          className="flex-1 p-2 border-2 rounded-lg"
                          style={{ borderColor: "#95b4df" }}
                        />
                        {currentCustomer.phone.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhone(index)}
                            className="px-2 py-1 rounded text-white text-sm"
                            style={{ backgroundColor: "#dc3545" }}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                        {index === currentCustomer.phone.length - 1 && (
                          <button
                            type="button"
                            onClick={addPhone}
                            className="px-2 py-1 rounded text-white text-sm"
                            style={{ backgroundColor: "#28a745" }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: "#223f61" }}
              >
                Endereço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#223f61" }}
                  >
                    CEP
                  </label>
                  <input
                    type="text"
                    value={currentCustomer.address.zipcode}
                    onChange={(e) => {
                      const cep = e.target.value.replace(/\D/g, "");
                      setCurrentCustomer((prev) => ({
                        ...prev,
                        address: { ...prev.address, zipcode: cep },
                      }));
                      if (cep.length === 8) {
                        searchAddressByCEP(cep);
                      }
                    }}
                    placeholder="00000-000"
                    maxLength={8}
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: "#95b4df" }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Digite o CEP para preencher automaticamente
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#223f61" }}
                  >
                    Rua
                  </label>
                  <input
                    type="text"
                    value={currentCustomer.address.street}
                    onChange={(e) =>
                      setCurrentCustomer((prev) => ({
                        ...prev,
                        address: {
                          ...prev.address,
                          street: e.target.value.toUpperCase(),
                        },
                      }))
                    }
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: "#95b4df" }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#223f61" }}
                  >
                    Número
                  </label>
                  <input
                    type="text"
                    value={currentCustomer.address.number}
                    onChange={(e) =>
                      setCurrentCustomer((prev) => ({
                        ...prev,
                        address: {
                          ...prev.address,
                          number: e.target.value.toUpperCase(),
                        },
                      }))
                    }
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: "#95b4df" }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#223f61" }}
                  >
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={currentCustomer.address.complement}
                    onChange={(e) =>
                      setCurrentCustomer((prev) => ({
                        ...prev,
                        address: {
                          ...prev.address,
                          complement: e.target.value.toUpperCase(),
                        },
                      }))
                    }
                    placeholder="Apto, Bloco, Casa, etc."
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: "#95b4df" }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#223f61" }}
                  >
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={currentCustomer.address.neighborhood}
                    onChange={(e) =>
                      setCurrentCustomer((prev) => ({
                        ...prev,
                        address: {
                          ...prev.address,
                          neighborhood: e.target.value.toUpperCase(),
                        },
                      }))
                    }
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: "#95b4df" }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#223f61" }}
                  >
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={currentCustomer.address.city}
                    onChange={(e) =>
                      setCurrentCustomer((prev) => ({
                        ...prev,
                        address: {
                          ...prev.address,
                          city: e.target.value.toUpperCase(),
                        },
                      }))
                    }
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: "#95b4df" }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#223f61" }}
                  >
                    Estado
                  </label>
                  <input
                    type="text"
                    value={currentCustomer.address.state}
                    onChange={(e) =>
                      setCurrentCustomer((prev) => ({
                        ...prev,
                        address: {
                          ...prev.address,
                          state: e.target.value.toUpperCase(),
                        },
                      }))
                    }
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: "#95b4df" }}
                  />
                </div>
                <div className="md:col-span-4">
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#223f61" }}
                  >
                    Ponto de Referência
                  </label>
                  <input
                    type="text"
                    value={currentCustomer.address.referencePoint}
                    onChange={(e) =>
                      setCurrentCustomer((prev) => ({
                        ...prev,
                        address: {
                          ...prev.address,
                          referencePoint: e.target.value.toUpperCase(),
                        },
                      }))
                    }
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: "#95b4df" }}
                  />
                </div>
              </div>

              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: "#223f61" }}
              >
                Informações Complementares
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#223f61" }}
                  >
                    Consumo GLP (dias) - Opcional
                  </label>
                  <input
                    type="number"
                    value={currentCustomer.glpConsumptionDays || ""}
                    onChange={(e) =>
                      setCurrentCustomer((prev) => ({
                        ...prev,
                        glpConsumptionDays:
                          e.target.value === ""
                            ? ""
                            : parseInt(e.target.value, 10) || "",
                      }))
                    }
                    placeholder="Ex: 30 (dias para trocar o botijão)"
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: "#95b4df" }}
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Frequência em dias para troca do botijão (campo opcional)
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCustomerForm(false)}
                  className="px-4 py-2 border-2 rounded-lg font-medium"
                  style={{ borderColor: "#95b4df", color: "#223f61" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCustomer}
                  className="px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: "#28a745" }}
                >
                  {isEditingCustomer ? "Salvar Alterações" : "Salvar Cliente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold" style={{ color: "#223f61" }}>
                  Histórico de Pedidos - {customerFound?.name}
                </h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {isHistoryLoading ? (
                <div className="text-center py-10">Carregando histórico...</div>
              ) : customerHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className="border-b-2"
                        style={{ borderColor: "#95b4df" }}
                      >
                        <th
                          className="text-left py-2 font-semibold"
                          style={{ color: "#223f61" }}
                        >
                          Data
                        </th>
                        <th
                          className="text-left py-2 font-semibold"
                          style={{ color: "#223f61" }}
                        >
                          Produtos (Qtd)
                        </th>
                        <th
                          className="text-right py-2 font-semibold"
                          style={{ color: "#223f61" }}
                        >
                          Valor
                        </th>
                        <th
                          className="text-left py-2 font-semibold"
                          style={{ color: "#223f61" }}
                        >
                          Entregador
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerHistory.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-2">
                            {format(order.createdAt, "dd/MM/yy")}
                          </td>
                          <td className="py-3 px-2">
                            {order.items
                              .map(
                                (item) =>
                                  `${item.productName} (${item.quantity})`,
                              )
                              .join(", ")}
                          </td>
                          <td className="py-3 px-2 text-right font-medium">
                            R$ {order.totalAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-2">
                            {order.employeeName || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  Nenhum pedido encontrado para este cliente.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1400px] mx-auto w-full p-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Pedidos</h1>
        <div className="space-y-4">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
              <div className="md:col-span-2">
                <Label>Cliente</Label>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <PersonSelector
                      options={people}
                      selectedPerson={customerFound}
                      open={showClientSearch}
                      value={clientSearchTerm}
                      title="Selecionar Cliente"
                      inputPlaceholder="Pesquisar por telefone, nome, endereço..."
                      searchPlaceholder="Pesquisar por telefone, nome, endereço..."
                      onOpenChange={setShowClientSearch}
                      onValueChange={setClientSearchTerm}
                      onSelect={selectCustomer}
                      onClear={clearCustomer}
                      showRegistration
                      registrationLabel="Novo"
                    />
                  </div>
                  {customerFound && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleEditCustomer}
                      >
                        Editar cliente
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleShowHistory}
                      >
                        Histórico
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="order-delivery-date">Data do pedido</Label>
                <Input
                  id="order-delivery-date"
                  type="date"
                  value={currentOrder.deliveryDate}
                  onChange={(event) =>
                    setCurrentOrder((previous) => ({
                      ...previous,
                      deliveryDate: event.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Canal de vendas</Label>
                <Select
                  value={currentOrder.canal || ""}
                  onValueChange={(canal) =>
                    setCurrentOrder((previous) => ({ ...previous, canal }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {["DISK GAS", "WhatsApp", "Presencial", "Online"].map(
                      (canal) => (
                        <SelectItem key={canal} value={canal}>
                          {canal}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="space-y-4 p-4">
              <h2 className="text-sm font-semibold text-slate-800">Produtos</h2>
              <ProductEntryPanel
                products={products}
                variant="sale"
                draft={{
                  productId: selectedProductId,
                  productName:
                    products.find((item) => item.id === selectedProductId)
                      ?.name || "",
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
                items={pedidoItems}
                columns={orderProductColumns}
                onRemove={(index) =>
                  setPedidoItems((previous) =>
                    previous.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              />
              <div className="flex flex-row justify-end gap-4">
                <Label className="text-lg text-gray-600">Total de Itens</Label>
                <p className="text-lg font-semibold text-gray-600">
                  {pedidoItems.reduce((total, item) => total + item.qtde, 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 p-4">
              <div className="flex flex-col justify-center gap-3 md:min-w-40">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(currentOrder.convenio)}
                    onChange={(event) =>
                      setCurrentOrder((previous) => ({
                        ...previous,
                        convenio: event.target.checked,
                      }))
                    }
                    className="rounded"
                    style={{ accentColor: "#e78b3a" }}
                  />
                  Convênio
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(currentOrder.urgente)}
                    onChange={(event) =>
                      setCurrentOrder((previous) => ({
                        ...previous,
                        urgente: event.target.checked,
                      }))
                    }
                    className="rounded"
                    style={{ accentColor: "#e78b3a" }}
                  />
                  Urgente
                </label>
              </div>
              <div>
                <Label htmlFor="order-notes">Observações do pedido</Label>
                <Textarea
                  id="order-notes"
                  value={currentOrder.notes}
                  onChange={(event) =>
                    setCurrentOrder((previous) => ({
                      ...previous,
                      notes: event.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1"
                  placeholder="Digite observações sobre o pedido..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,1fr)_3fr] gap-4">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="space-y-4 p-4">
                <div>
                  <Label>Forma de pagamento</Label>
                  <Select
                    value={currentOrder.paymentTypeId || ""}
                    onValueChange={(paymentTypeId) => {
                      const paymentType = paymentTypes.find(
                        (item) => item.id === paymentTypeId,
                      );
                      setCurrentOrder((previous) => ({
                        ...previous,
                        paymentTypeId,
                        paymentTypeName: paymentType?.name || "",
                      }));
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a forma de pagamento" />
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
                <div>
                  <Label>Entregador</Label>
                  <Select
                    value={currentOrder.employeeId || ""}
                    onValueChange={(employeeId) => {
                      const employee = employees.find(
                        (item) => item.id === employeeId,
                      );
                      setCurrentOrder((previous) => ({
                        ...previous,
                        employeeId,
                        employeeName: employee?.name || "",
                      }));
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o entregador" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Valor Total",
                      value:
                        calcularTotal() +
                        pedidoItems.reduce(
                          (total, item) => total + item.desconto,
                          0,
                        ),
                    },
                    {
                      label: "Vlr Desconto",
                      value: pedidoItems.reduce(
                        (total, item) => total + item.desconto,
                        0,
                      ),
                    },
                    { label: "Total a Pagar", value: calcularTotal() },
                  ].map((summary) => (
                    <div
                      key={summary.label}
                      className={`text-center p-4 rounded-lg ${
                        summary.label === "Total a Pagar"
                          ? "bg-green-50 border border-green-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <Label className="text-xs text-gray-600">
                        {summary.label}
                      </Label>
                      <p className="text-lg font-semibold mt-1 text-slate-800">
                        {summary.isCount
                          ? summary.value
                          : `R$ ${summary.value.toFixed(2)}`}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <Button
                    type="button"
                    onClick={handleSaveOrder}
                    disabled={isSaving}
                    className="text-white"
                    style={{ background: "#e78b3a" }}
                  >
                    {isSaving ? "Salvando..." : "Finalizar Pedido"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => window.location.reload()}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
