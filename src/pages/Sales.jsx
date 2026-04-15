import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Trash2, Edit2,
  Save, X, Printer
} from "lucide-react";
import * as entities from "@/entities";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const initialSaleState = {
  saleNumber: '',
  personId: '',
  personName: '',
  sectorId: '',
  sectorName: '',
  status: 'concluida',
  saleDate: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
  items: [],
  paymentMethods: [], // Initial state is empty, PaymentModal will add first one if needed
  totalAmount: 0,
  createdByName: '',
  orderId: null,
  orderNumber: null,
  conveniadaId: '',
  conveniadaName: ''
};

// Helper function to generate installment details
const generateInstallmentDetails = (paymentMethod, paymentTypes, saleDate) => {
  const paymentType = paymentTypes.find(pt => pt.id === paymentMethod.paymentTypeId);
  const isImmediatePaymentType = paymentType && ['dinheiro', 'pix', 'cartaoDebito'].includes(paymentType.type);
  const amount = parseFloat(paymentMethod.amount) || 0;
  const installments = parseInt(paymentMethod.installments) || 1;

  if (isImmediatePaymentType || installments <= 1) {
    return {
      ...paymentMethod,
      installments: 1, // Force 1 installment for immediate payments
      installmentsDetails: [{
        number: 1,
        dueDate: saleDate,
        amount: amount,
        status: 'pendente'
      }]
    };
  } else {
    const installmentAmount = amount / installments;
    const newDetails = [];
    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(saleDate);
      dueDate.setMonth(dueDate.getMonth() + i); // Add months for subsequent installments
      newDetails.push({
        number: i + 1,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        amount: installmentAmount,
        status: 'pendente'
      });
    }
    return { ...paymentMethod, installmentsDetails: newDetails };
  }
};

// PaymentModal component definition
const PaymentModal = ({ isOpen, onClose, onConfirm, totalAmount, paymentTypes, cashAccounts, saleNumber, customerName, initialNotes, initialPaymentMethods, saleDate, isSaving }) => {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [observations, setObservations] = useState(initialNotes);

  useEffect(() => {
    if (isOpen) {
      let methodsToSet = initialPaymentMethods;
      if (initialPaymentMethods.length === 0 && totalAmount > 0) {
        // If no initial methods, create one default
        methodsToSet = [{
          paymentTypeId: '',
          paymentTypeName: '',
          amount: totalAmount,
          installments: 1,
          cashAccountId: '',
          installmentsDetails: [] // Initialize empty, will be generated
        }];
      }

      // Ensure installmentsDetails are correctly generated/updated on open
      const updatedMethods = methodsToSet.map(pm => generateInstallmentDetails(pm, paymentTypes, saleDate));
      setPaymentMethods(updatedMethods);
      setObservations(initialNotes);
    }
  }, [isOpen, initialPaymentMethods, initialNotes, totalAmount, paymentTypes, saleDate]);

  const totalPaymentsMade = paymentMethods.reduce((sum, pm) => sum + (parseFloat(pm.amount) || 0), 0);
  const totalRemaining = totalAmount - totalPaymentsMade;

  const addPaymentMethod = () => {
    const remaining = totalAmount - totalPaymentsMade;
    const newPaymentMethod = {
      paymentTypeId: '',
      paymentTypeName: '',
      amount: remaining > 0 ? remaining : 0,
      installments: 1,
      cashAccountId: '',
      installmentsDetails: []
    };
    setPaymentMethods(prev => ([
      ...prev,
      generateInstallmentDetails(newPaymentMethod, paymentTypes, saleDate) // Generate details for new method
    ]));
  };

  const updatePaymentMethod = (index, field, value) => {
    const newPayments = [...paymentMethods];
    const currentPaymentMethod = newPayments[index];
    currentPaymentMethod[field] = value;

    const paymentType = paymentTypes.find(pt => pt.id === currentPaymentMethod.paymentTypeId);
    const isImmediatePaymentType = paymentType && ['dinheiro', 'pix', 'cartaoDebito'].includes(paymentType.type);

    if (field === 'paymentTypeId') {
      currentPaymentMethod.paymentTypeName = paymentType?.name || '';
      if (isImmediatePaymentType) {
        currentPaymentMethod.cashAccountId = cashAccounts.length > 0 ? cashAccounts[0].id : '';
        currentPaymentMethod.installments = 1; // Force 1 installment for immediate
      } else {
        currentPaymentMethod.cashAccountId = ''; // Clear cash account for non-immediate
      }
    }

    // Ensure installments for immediate payments are always 1
    if (isImmediatePaymentType && field === 'installments' && value !== 1) {
      currentPaymentMethod.installments = 1;
    }

    const oldInstallmentsCount = paymentMethods[index]?.installmentsDetails?.length || 0;
    const newInstallmentsCount = parseInt(currentPaymentMethod.installments) || 1;
    const newPaymentAmount = parseFloat(currentPaymentMethod.amount) || 0;

    // Regenerate full details if payment type or installments count changes
    if (field === 'paymentTypeId' || (field === 'installments' && oldInstallmentsCount !== newInstallmentsCount)) {
      newPayments[index] = generateInstallmentDetails(currentPaymentMethod, paymentTypes, saleDate);
    } else if (field === 'amount') {
      // If amount changes, redistribute to existing installments or update single installment
      if (!isImmediatePaymentType && newInstallmentsCount > 1 && currentPaymentMethod.installmentsDetails.length > 0) {
        const perInstallmentAmount = newPaymentAmount / newInstallmentsCount;
        newPayments[index].installmentsDetails = newPayments[index].installmentsDetails.map(det => ({
          ...det,
          amount: perInstallmentAmount
        }));
      } else if (currentPaymentMethod.installmentsDetails.length > 0) {
        // For single installment, just update its amount
        newPayments[index].installmentsDetails[0].amount = newPaymentAmount;
      }
    }

    setPaymentMethods(newPayments);
  };

  const updateInstallmentDetail = (paymentMethodIndex, installmentIndex, field, value) => {
    const newPayments = [...paymentMethods];
    const detail = newPayments[paymentMethodIndex].installmentsDetails[installmentIndex];
    detail[field] = value;

    // Recalculate payment method amount if an installment amount is changed directly
    if (field === 'amount') {
      const totalInstallmentAmount = newPayments[paymentMethodIndex].installmentsDetails.reduce((sum, det) => sum + (parseFloat(det.amount) || 0), 0);
      newPayments[paymentMethodIndex].amount = totalInstallmentAmount;
    }

    setPaymentMethods(newPayments);
  };

  const removePaymentMethod = (index) => {
    setPaymentMethods(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (paymentMethods.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos um método de pagamento.", variant: "destructive" });
      return;
    }
    if (Math.abs(totalRemaining) > 0.01) {
      toast({ title: "Erro", description: `O total dos pagamentos (R$ ${totalPaymentsMade.toFixed(2)}) deve ser igual ao total da venda (R$ ${totalAmount.toFixed(2)}).`, variant: "destructive" });
      return;
    }

    // Validate installment details sum for each payment method
    for (const pm of paymentMethods) {
      if (pm.installmentsDetails && pm.installmentsDetails.length > 0) {
        const totalInstallmentsAmount = pm.installmentsDetails.reduce((sum, det) => sum + (parseFloat(det.amount) || 0), 0);
        if (Math.abs(totalInstallmentsAmount - (parseFloat(pm.amount) || 0)) > 0.01) {
          toast({ title: "Erro", description: `O total das parcelas para "${pm.paymentTypeName}" (R$ ${totalInstallmentsAmount.toFixed(2)}) não corresponde ao valor total do pagamento (R$ ${pm.amount.toFixed(2)}).`, variant: "destructive" });
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
          <DialogTitle className="text-xl font-bold" style={{ color: '#1E3A8A' }}>Finalizar Venda #{saleNumber}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Cliente: <span className="text-gray-900">{customerName}</span></p>
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-lg font-bold text-green-700">Total da Venda: <span className="text-green-900">R$ {totalAmount.toFixed(2)}</span></p>
          </div>

          <h4 className="text-md font-semibold mt-4 mb-2" style={{ color: '#1E3A8A' }}>Formas de Pagamento</h4>
          <div className="space-y-3">
            {paymentMethods.map((payment, index) => {
              const paymentType = paymentTypes.find(pt => pt.id === payment.paymentTypeId);
              const isImmediatePaymentType = paymentType && ['dinheiro', 'pix', 'cartaoDebito'].includes(paymentType.type);

              return (
                <div key={index} className="flex flex-col gap-3 p-3 border rounded-lg bg-gray-50">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[150px]">
                      <Label htmlFor={`payment-type-${index}`} className="sr-only">Forma de Pagamento</Label>
                      <Select
                        value={payment.paymentTypeId}
                        onValueChange={(value) => updatePaymentMethod(index, 'paymentTypeId', value)}
                        id={`payment-type-${index}`}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Forma de Pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentTypes.map(pt => (
                            <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {isImmediatePaymentType && (
                      <div className="flex-1 min-w-[150px]">
                        <Label htmlFor={`cash-account-${index}`} className="sr-only">Conta/Caixa</Label>
                        <Select
                          value={payment.cashAccountId || ''}
                          onValueChange={(value) => updatePaymentMethod(index, 'cashAccountId', value)}
                          id={`cash-account-${index}`}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Conta/Caixa" />
                          </SelectTrigger>
                          <SelectContent>
                            {cashAccounts.map(ca => (
                              <SelectItem key={ca.id} value={ca.id}>{ca.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="w-32 min-w-[100px]">
                      <Label htmlFor={`amount-${index}`} className="sr-only">Valor</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Valor"
                        value={payment.amount || ''}
                        onChange={(e) => updatePaymentMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                        id={`amount-${index}`}
                      />
                    </div>

                    <div className="w-24 min-w-[80px]">
                      <Label htmlFor={`installments-${index}`} className="sr-only">Parcelas</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Parcelas"
                        value={payment.installments || 1}
                        onChange={(e) => updatePaymentMethod(index, 'installments', parseInt(e.target.value) || 1)}
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

                  {!isImmediatePaymentType && parseInt(payment.installments) > 1 && payment.installmentsDetails && payment.installmentsDetails.length > 0 && (
                    <div className="w-full mt-2 p-3 border rounded-md bg-white">
                      <h5 className="text-sm font-semibold mb-2" style={{ color: '#1E3A8A' }}>Detalhes das Parcelas</h5>
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Parc.</TableHead>
                            <TableHead className="text-xs">Vencimento</TableHead>
                            <TableHead className="text-xs text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payment.installmentsDetails.map((detail, detIndex) => (
                            <TableRow key={detIndex}>
                              <TableCell className="text-xs w-1/4">{detail.number}</TableCell>
                              <TableCell className="text-xs w-1/3">
                                <Input
                                  type="date"
                                  value={detail.dueDate}
                                  onChange={(e) => updateInstallmentDetail(index, detIndex, 'dueDate', e.target.value)}
                                  className="w-full h-8 text-xs"
                                />
                              </TableCell>
                              <TableCell className="text-xs text-right w-1/3">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={parseFloat(detail.amount).toFixed(2)}
                                  onChange={(e) => updateInstallmentDetail(index, detIndex, 'amount', parseFloat(e.target.value) || 0)}
                                  className="w-full h-8 text-xs text-right"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Button onClick={addPaymentMethod} variant="outline" className="w-full mt-2" style={{ borderColor: '#e78b3a', color: '#e78b3a' }}>
            <Plus className="w-4 h-4 mr-2" /> Adicionar Forma de Pagamento
          </Button>

          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-gray-100">
              <Label className="text-xs text-gray-600">Total Pagamentos</Label>
              <p className="text-lg font-bold mt-1 text-gray-800">
                R$ {totalPaymentsMade.toFixed(2)}
              </p>
            </div>
            <div className={`text-center p-3 rounded-lg ${Math.abs(totalRemaining) < 0.01 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <Label className="text-xs text-gray-600">Falta Pagar</Label>
              <p className={`text-lg font-bold mt-1 ${Math.abs(totalRemaining) < 0.01 ? 'text-green-700' : 'text-red-700'}`}>
                R$ {totalRemaining.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="payment-notes" className="text-xs font-medium" style={{ color: '#374151' }}>Observações do Pagamento:</Label>
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
          <Button onClick={handleConfirm} disabled={isSaving} style={{ background: '#e78b3a', color: 'white' }}>
            {isSaving ? 'Salvando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function SalesPage({ onSaleComplete }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [people, setPeople] = useState([]);
  const [products, setProducts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [conveniadas, setConveniadas] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [currentSale, setCurrentSale] = useState(initialSaleState);
  const [customerSelected, setCustomerSelected] = useState(false);
  const [customerFound, setCustomerFound] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [productCode, setProductCode] = useState('');
  const [productQuantity, setProductQuantity] = useState('1');
  const [productPrice, setProductPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [selectedProductObj, setSelectedProductObj] = useState(null);

  const [temConvenio, setTemConvenio] = useState('nao');

  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const user = await entities.User.me();
      setCurrentUser(user);
      const companyId = user.companyId;

      setCurrentSale(prev => ({
        ...prev,
        createdByName: user.fullName
      }));

      const [allPeople, productsData, sectorsData, paymentTypesData, cashAccountsData, ordersData] = await Promise.all([
        entities.Person.filter({ companyId: companyId }),
        entities.Product.filter({ companyId: companyId, active: true }),
        entities.Sector.filter({ companyId: companyId, active: true }),
        entities.PaymentType.filter({ companyId: companyId, active: true }),
        entities.CashAccount.filter({ companyId: companyId, active: true }),
        entities.Order.filter({ companyId: companyId, status: ['pendente', 'emAtendimento', 'finalizado'] }, '-createdDate', 100).catch(() => [])
      ]);

      setPeople(allPeople.filter(p => p.type === 'cliente'));
      setConveniadas(allPeople.filter(p => p.type === 'conveniada' && p.active));
      setProducts(productsData);
      setSectors(sectorsData);
      setPaymentTypes(paymentTypesData);
      setCashAccounts(cashAccountsData);
      setOrders(ordersData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os dados.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProductCodeChange = (code) => {
    setProductCode(code);
    const product = products.find(p => p.code === code || p.id === code);
    if (product) {
      setSelectedProductObj(product);
      setProductDescription(product.name);
      setProductPrice(product.unitPrice.toString());
    }
  };

  const handleAddProduct = () => {
    if (!selectedProductObj) {
      toast({ title: "Atenção", description: "Selecione um produto válido.", variant: "warning" });
      return;
    }

    const qty = parseFloat(productQuantity) || 0;
    const price = parseFloat(productPrice) || 0;

    if (qty <= 0 || price <= 0) {
      toast({ title: "Atenção", description: "Quantidade e preço devem ser maiores que zero.", variant: "warning" });
      return;
    }

    const itemExists = currentSale.items.find(item => item.productId === selectedProductObj.id);
    if (itemExists) {
      toast({ title: "Atenção", description: "Este produto já foi adicionado.", variant: "warning" });
      return;
    }

    const newItem = {
      productId: selectedProductObj.id,
      productCode: selectedProductObj.code || '',
      productName: selectedProductObj.name,
      category: selectedProductObj.category,
      vasilhameId: selectedProductObj.vasilhameId || '',
      vasilhameName: selectedProductObj.vasilhameName || '',
      quantity: qty,
      unitPrice: price,
      discount: 0,
      total: qty * price,
      quantityToPickup: 0,
      vasilhameLoanQuantity: 0
    };

    setCurrentSale(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setProductCode('');
    setProductQuantity('1');
    setProductPrice('');
    setProductDescription('');
    setSelectedProductObj(null);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...currentSale.items];
    const numericValue = ['quantity', 'unitPrice', 'discount', 'quantityToPickup', 'vasilhameLoanQuantity'].includes(field) ? parseFloat(value) || 0 : value;

    newItems[index][field] = numericValue;

    const item = newItems[index];
    item.total = (item.quantity * item.unitPrice) - item.discount;

    setCurrentSale(prev => ({ ...prev, items: newItems }));
  };

  const removeItem = (index) => {
    setCurrentSale(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSelectClient = (client) => {
    setCustomerSelected(true);
    setCustomerFound(client);
    setCurrentSale(prev => ({
      ...prev,
      personId: client.id,
      personName: client.name,
      conveniadaId: client.conveniadaId || '',
      conveniadaName: client.conveniadaName || ''
    }));

    if (client.conveniadaId) {
      setTemConvenio('sim');
    } else {
      setTemConvenio('nao');
    }

    setShowClientSearch(false);
    setClientSearchTerm('');
  };

  const clearCustomer = () => {
    setCustomerSelected(false);
    setCustomerFound(null);
    setCurrentSale(prev => ({
      ...prev,
      personId: '',
      personName: '',
      conveniadaId: '',
      conveniadaName: ''
    }));
    setTemConvenio('nao');
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);

    if (!orderId) {
      resetForm();
      return;
    }

    const order = orders.find(o => o.id === orderId);
    if (!order) {
      toast({ title: "Erro", description: "Pedido não encontrado.", variant: "destructive" });
      resetForm();
      return;
    }

    const customer = people.find(p => p.id === order.personId);
    if (customer) {
      setCustomerFound(customer);
      setCustomerSelected(true);
    } else {
      setCustomerFound(null);
      setCustomerSelected(false);
      toast({ title: "Atenção", description: "Cliente do pedido não encontrado.", variant: "warning" });
    }

    let orderSector = null;
    if (order.employeeId) {
      orderSector = sectors.find(s => s.employeeId === order.employeeId);

      if (!orderSector) {
        toast({
          title: "Atenção",
          description: `Não foi encontrado um setor vinculado ao entregador ${order.employeeName || ''}. Por favor, selecione um setor manualmente.`,
          variant: "warning"
        });
      }
    } else {
      toast({
        title: "Atenção",
        description: `O pedido não possui entregador definido. Por favor, selecione um setor manualmente.`,
        variant: "warning"
      });
    }

    const saleItems = order.items.map(item => {
      const productDetails = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productCode: productDetails?.code || '',
        productName: item.productName,
        category: productDetails?.category || '',
        vasilhameId: productDetails?.vasilhameId || '',
        vasilhameName: productDetails?.vasilhameName || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        total: (item.quantity * item.unitPrice) - (item.discount || 0),
        quantityToPickup: 0,
        vasilhameLoanQuantity: 0
      };
    });

    const orderConveniadaId = order.conveniadaId || customer?.conveniadaId || '';
    const orderConveniadaName = order.conveniadaName || customer?.conveniadaName || '';

    const orderTotal = order.totalAmount;

    setCurrentSale({
      ...initialSaleState,
      saleNumber: `VEN-${Date.now()}`,
      personId: order.personId,
      personName: order.personName,
      sectorId: orderSector ? orderSector.id : '',
      sectorName: orderSector ? orderSector.name : '',
      status: 'concluida',
      saleDate: order.deliveryDate ? format(new Date(order.deliveryDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      notes: order.notes || '',
      items: saleItems,
      paymentMethods: [{
        paymentTypeId: '',
        paymentTypeName: '',
        amount: orderTotal,
        installments: 1,
        cashAccountId: '',
        installmentsDetails: [] // Initialize for order payment methods
      }],
      totalAmount: orderTotal,
      createdByName: currentUser?.fullName || '',
      orderId: order.id,
      orderNumber: order.orderNumber,
      conveniadaId: orderConveniadaId,
      conveniadaName: orderConveniadaName
    });
    setTemConvenio(orderConveniadaId ? 'sim' : 'nao');

    toast({
      title: "Pedido Carregado",
      description: `Pedido ${order.orderNumber} carregado com sucesso. ${orderSector ? `Setor: ${orderSector.name}` : 'Selecione o setor de estoque.'}`,
      variant: "success"
    });
  };

  const handleOpenPaymentModal = () => {
    if (!customerSelected) {
      toast({ title: "Erro", description: "Selecione um cliente.", variant: "destructive" });
      return;
    }

    if (!currentSale.sectorId) {
      toast({ title: "Erro", description: "Selecione o setor.", variant: "destructive" });
      return;
    }

    if (currentSale.items.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos um produto.", variant: "destructive" });
      return;
    }

    if (temConvenio === 'sim' && customerFound && customerFound.conveniadaId && !currentSale.conveniadaId) {
      toast({ title: "Erro", description: "Selecione a empresa conveniada.", variant: "destructive" });
      return;
    }

    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (payments, modalObservations) => {
    if (isSaving) return; // Bloqueia duplo clique
    
    const totalSale = currentSale.items.reduce((sum, item) => sum + item.total, 0);
    const totalPayments = payments.reduce((sum, pm) => sum + (parseFloat(pm.amount) || 0), 0);

    if (Math.abs(totalPayments - totalSale) > 0.01) {
      toast({ title: "Erro", description: "O total dos pagamentos deve ser igual ao total da venda.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const companyId = currentUser.companyId;
      const companyName = currentUser.companyName;

      // Gerar próximo código sequencial
      const allSales = await entities.Sale.filter({ companyId: companyId });
      const maxSaleNumber = allSales.reduce((max, sale) => {
        const currentNum = parseInt(sale.saleNumber, 10);
        return !isNaN(currentNum) && currentNum > max ? currentNum : max;
      }, 0);
      const newSaleNumber = String(maxSaleNumber + 1);

      const saleData = {
        ...currentSale,
        saleNumber: newSaleNumber,
        totalAmount: totalSale,
        paymentMethods: payments, // Payments now include installmentsDetails
        notes: modalObservations,
        companyId: companyId,
        companyName: companyName,
        createdByName: currentUser.fullName,
        orderId: selectedOrderId,
        orderNumber: currentSale.orderNumber,
        conveniadaId: (temConvenio === 'sim' && currentSale.conveniadaId) ? currentSale.conveniadaId : null,
        conveniadaName: (temConvenio === 'sim' && currentSale.conveniadaName) ? currentSale.conveniadaName : null
      };

      const savedSale = await entities.Sale.create(saleData);

      if (selectedOrderId) {
        try {
          await entities.Order.update(selectedOrderId, {
            status: 'finalizado',
            finalizedAt: new Date().toISOString()
          });
          loadData();
        } catch (error) {
          console.error("Erro ao atualizar status do pedido:", error);
          toast({ title: "Atenção", description: "Não foi possível atualizar o status do pedido original.", variant: "warning" });
        }
      }

      for (const item of currentSale.items) {
        try {
          const stockEntries = await entities.ProductStock.filter({
            productId: item.productId,
            sectorId: currentSale.sectorId,
            companyId: companyId
          });

          if (stockEntries.length > 0) {
            const stockEntry = stockEntries[0];
            const newQuantity = (stockEntry.quantity || 0) - item.quantity;
            await entities.ProductStock.update(stockEntry.id, { quantity: newQuantity });
          } else {
            await entities.ProductStock.create({
              productId: item.productId,
              productName: item.productName,
              sectorId: currentSale.sectorId,
              sectorName: currentSale.sectorName,
              quantity: -item.quantity,
              initialDate: currentSale.saleDate,
              companyId: companyId,
              companyName: companyName,
              createdByName: currentUser.fullName
            });
          }
        } catch (error) {
          console.error("Erro ao atualizar estoque:", error);
          toast({ title: "Atenção", description: `Erro ao atualizar estoque para o produto ${item.productName}.`, variant: "warning" });
        }
      }

      for (const item of currentSale.items) {
        if (item.vasilhameLoanQuantity > 0 && item.vasilhameId) {
          await entities.VasilhameLoan.create({
            saleId: savedSale.id,
            personId: savedSale.personId,
            personName: savedSale.personName,
            vasilhameId: item.vasilhameId,
            vasilhameName: item.vasilhameName,
            loanQuantity: item.vasilhameLoanQuantity,
            returnedQuantity: 0,
            loanDate: savedSale.saleDate,
            status: 'pendente',
            companyId: companyId,
            companyName: companyName,
            createdByName: currentUser.fullName
          });
        }

        if (item.quantityToPickup > 0) {
          await entities.ProductPickup.create({
            saleId: savedSale.id,
            personId: savedSale.personId,
            personName: savedSale.personName,
            productId: item.productId,
            productName: item.productName,
            pickupQuantity: item.quantityToPickup,
            saleDate: savedSale.saleDate,
            companyId: companyId,
            companyName: companyName,
            createdByName: currentUser.fullName
          });
        }
      }

      let revenueGroup = await entities.FinancialGroup.filter({ name: 'Receitas de Vendas', type: 'receita', companyId: companyId });
      if (revenueGroup.length === 0) {
        revenueGroup = [await entities.FinancialGroup.create({
          name: 'Receitas de Vendas',
          type: 'receita',
          active: true,
          companyId: companyId,
          companyName: companyName,
          createdByName: currentUser.fullName
        })];
      }

      for (const paymentMethod of payments) {
        const paymentType = paymentTypes.find(p => p.id === paymentMethod.paymentTypeId);

        const isImmediatePaymentType = paymentType && ['dinheiro', 'pix', 'cartaoDebito'].includes(paymentType.type);
        if (paymentMethod.installments === 1 && isImmediatePaymentType && paymentMethod.cashAccountId) {
          try {
            const cashAccount = cashAccounts.find(ca => ca.id === paymentMethod.cashAccountId);
            if (cashAccount) {
              const newBalance = (cashAccount.balance || 0) + paymentMethod.amount;
              await entities.CashAccount.update(cashAccount.id, {
                balance: newBalance
              });

              await entities.CashMovement.create({
                cashAccountId: cashAccount.id,
                cashAccountName: cashAccount.name,
                type: 'receita',
                description: `Recebimento da Venda #${savedSale.saleNumber}`,
                amount: paymentMethod.amount,
                personId: savedSale.personId,
                personName: savedSale.personName,
                movementDate: savedSale.saleDate,
                groupId: revenueGroup[0].id,
                groupName: revenueGroup[0].name,
                companyId: companyId,
                companyName: companyName,
                createdByName: currentUser.fullName
              });
            }
          } catch (error) {
            console.error("Erro ao atualizar conta/caixa:", error);
            toast({ title: "Atenção", description: `Erro ao processar pagamento imediato para ${paymentMethod.paymentTypeName}.`, variant: "warning" });
          }
        }

        const isAPrazoPaymentType = paymentType && ['boleto', 'cheque', 'cartaoCredito', 'convenio'].includes(paymentType.type);
        if (isAPrazoPaymentType && paymentMethod.installmentsDetails && paymentMethod.installmentsDetails.length > 0) {
          const targetPersonId = (paymentType?.type === 'convenio' && savedSale.conveniadaId) ?
            savedSale.conveniadaId : savedSale.personId;
          const targetPersonName = (paymentType?.type === 'convenio' && savedSale.conveniadaName) ?
            savedSale.conveniadaName : savedSale.personName;

          if (!targetPersonId) {
            console.error("Target person ID is missing for accounts receivable.");
            toast({ title: "Erro", description: "Não foi possível identificar o cliente para as contas a receber.", variant: "destructive" });
            continue;
          }

          // Use the already generated and potentially edited installmentsDetails from the payment method
          for (const installment of paymentMethod.installmentsDetails) {
            try {
              await entities.AccountsReceivable.create({
                saleId: savedSale.id,
                personId: targetPersonId,
                personName: targetPersonName,
                installmentNumber: installment.number,
                dueDate: installment.dueDate,
                amount: installment.amount,
                status: 'pendente', // Status is always pending on creation
                companyId: companyId,
                companyName: companyName,
                createdByName: currentUser.fullName
              });
            } catch (error) {
              console.error("Erro ao criar conta a receber:", error);
              toast({ title: "Atenção", description: `Erro ao criar conta a receber para ${paymentMethod.paymentTypeName}.`, variant: "warning" });
            }
          }
        }
      }

      toast({ title: "Sucesso!", description: `Venda #${savedSale.saleNumber} realizada com sucesso.` });
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
      toast({ title: "Erro", description: "Erro ao realizar venda.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setCurrentSale({
      ...initialSaleState,
      saleNumber: '',
      createdByName: currentUser?.fullName || ''
    });
    setCustomerSelected(false);
    setCustomerFound(null);
    setProductCode('');
    setProductQuantity('1');
    setProductPrice('');
    setProductDescription('');
    setSelectedProductObj(null);
    setTemConvenio('nao');
    setSelectedOrderId(null);
    setShowPaymentModal(false);
  };

  const totalVenda = currentSale.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalDesconto = currentSale.items.reduce((sum, item) => sum + item.discount, 0);
  const totalPagar = currentSale.items.reduce((sum, item) => sum + item.total, 0);

  const filteredClients = people.filter(p =>
    p.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    (p.address?.street || '').toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: '#F3F4F6' }}>
      <div className="max-w-[1400px] mx-auto p-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Vendas</h1>
        
        {/* Seção Pedido */}
        <Card className="mb-4" style={{ background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-medium" style={{ color: '#374151' }}>Pedido:</Label>
                <Select value={selectedOrderId || ''} onValueChange={handleSelectOrder}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Nova venda ou selecione pedido..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>🆕 Nova Venda</SelectItem>
                    {orders.map(order => (
                      <SelectItem key={order.id} value={order.id}>
                        #{order.orderNumber} - {order.personName} - R$ {order.totalAmount.toFixed(2)} - {order.status === 'pendente' ? '⏳ Pendente' : order.status === 'emAtendimento' ? '🚚 Em Atendimento' : '✅ Finalizado'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium" style={{ color: '#374151' }}>Data: <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={currentSale.saleDate}
                  onChange={(e) => setCurrentSale(prev => ({ ...prev, saleDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-medium" style={{ color: '#374151' }}>Setor: <span className="text-red-500">*</span></Label>
                <Select
                  value={currentSale.sectorId || ''}
                  onValueChange={(value) => {
                    const sector = sectors.find(s => s.id === value);
                    setCurrentSale(prev => ({
                      ...prev,
                      sectorId: value,
                      sectorName: sector ? sector.name : ''
                    }));
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map(sector => (
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

        {/* Seção Produtos */}
        <Card className="mb-4" style={{ background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-4 items-end">
              <div className="md:col-span-2">
                <Label className="text-xs font-medium" style={{ color: '#374151' }}>Código:</Label>
                <Select value={productCode} onValueChange={handleProductCodeChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.code || product.id}>
                        {product.code} - {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-1">
                <Label className="text-xs font-medium" style={{ color: '#374151' }}>Qtde:</Label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(Math.floor(parseFloat(e.target.value) || 1).toString())}
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs font-medium" style={{ color: '#374151' }}>Preço Un.:</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-4">
                <Label className="text-xs font-medium" style={{ color: '#374151' }}>Descrição:</Label>
                <Input
                  value={productDescription}
                  readOnly
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div className="md:col-span-3">
                <Button
                  onClick={handleAddProduct}
                  className="w-full mt-1"
                  style={{ background: '#e78b3a', color: 'white' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ background: '#F3F4F6' }}>
                    <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Código</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Descrição</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Qtde</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Preço Un.</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Valor Total</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Desconto</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Vasilhame</TableHead>
                    <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>A Retirar</TableHead>
                    <TableHead className="text-xs font-semibold text-right" style={{ color: '#374151' }}>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentSale.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm">{item.productCode || '-'}</TableCell>
                      <TableCell className="text-sm">{item.productName}</TableCell>
                      <TableCell className="text-sm">
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Math.floor(parseFloat(e.target.value) || 1))}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell className="text-sm">R$ {item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-sm font-semibold" style={{ color: '#10B981' }}>
                        R$ {item.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.category === 'glp' && item.vasilhameId ? (
                          <Input
                            type="number"
                            value={item.vasilhameLoanQuantity}
                            onChange={(e) => updateItem(index, 'vasilhameLoanQuantity', e.target.value)}
                            className="w-16"
                            placeholder="0"
                          />
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Input
                          type="number"
                          value={item.quantityToPickup}
                          onChange={(e) => updateItem(index, 'quantityToPickup', e.target.value)}
                          className="w-16"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {currentSale.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        Nenhum produto adicionado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Seção Observações */}
        <Card className="mb-4" style={{ background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <CardContent className="p-4">
            <Label className="text-xs font-medium" style={{ color: '#374151' }}>Observação do Pedido:</Label>
            <Textarea
              value={currentSale.notes}
              onChange={(e) => setCurrentSale(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="mt-1"
              placeholder="Digite observações sobre o pedido..."
            />
          </CardContent>
        </Card>

        {/* Seção Cliente e Convênio */}
        <Card className="mb-4" style={{ background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Venda Para */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#1E3A8A' }}>Venda Para: <span className="text-red-500">*</span></h3>
                {!customerSelected ? (
                  <div className="flex gap-2">
                    <Input
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      placeholder="Buscar cliente..."
                      className="flex-1"
                    />
                    <Button
                      onClick={() => setShowClientSearch(true)}
                      style={{ background: '#223f61', color: 'white' }}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#15803D' }}>
                        {customerFound.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {customerFound.address?.street}, {customerFound.address?.number}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearCustomer}
                      className="text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Modal de Busca */}
                {showClientSearch && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                      <div className="p-4 border-b" style={{ background: '#1E3A8A' }}>
                        <h3 className="text-lg font-semibold text-white">Selecionar Cliente</h3>
                      </div>
                      <div className="p-4">
                        <Input
                          value={clientSearchTerm}
                          onChange={(e) => setClientSearchTerm(e.target.value)}
                          placeholder="Digite para buscar..."
                          className="mb-4"
                        />
                        <div className="max-h-96 overflow-y-auto">
                          {filteredClients.map(client => (
                            <div
                              key={client.id}
                              onClick={() => handleSelectClient(client)}
                              className="p-3 border-b cursor-pointer hover:bg-gray-50"
                            >
                              <p className="font-medium">{client.name}</p>
                              <p className="text-sm text-gray-600">
                                {client.address?.street}, {client.address?.number} - {client.address?.neighborhood}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 border-t flex justify-end">
                        <Button onClick={() => setShowClientSearch(false)} variant="outline">
                          Fechar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Convênio - só aparece se o cliente tiver conveniada vinculada */}
              {customerFound && customerFound.conveniadaId && (
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#1E3A8A' }}>Convênio:</h3>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="convenio"
                        value="sim"
                        checked={temConvenio === 'sim'}
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
                        checked={temConvenio === 'nao'}
                        onChange={(e) => {
                          setTemConvenio(e.target.value);
                          setCurrentSale(prev => ({
                            ...prev,
                            conveniadaId: '',
                            conveniadaName: ''
                          }));
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Não</span>
                    </label>
                  </div>

                  {temConvenio === 'sim' && (
                    <div>
                      <Label className="text-xs font-medium mb-1 block" style={{ color: '#374151' }}>Empresa Conveniada: <span className="text-red-500">*</span></Label>
                      <Select
                        value={currentSale.conveniadaId || ''}
                        onValueChange={(value) => {
                          const conveniada = conveniadas.find(c => c.id === value);
                          setCurrentSale(prev => ({
                            ...prev,
                            conveniadaId: value,
                            conveniadaName: conveniada ? conveniada.name : ''
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa conveniada" />
                        </SelectTrigger>
                        <SelectContent>
                          {conveniadas.map(conveniada => (
                            <SelectItem key={conveniada.id} value={conveniada.id}>
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
        <Card className="mb-4" style={{ background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg" style={{ background: '#F9FAFB' }}>
                <Label className="text-xs" style={{ color: '#6B7280' }}>Total da Venda</Label>
                <p className="text-lg font-semibold mt-1" style={{ color: '#1F2937' }}>
                  R$ {totalVenda.toFixed(2)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: '#F9FAFB' }}>
                <Label className="text-xs" style={{ color: '#6B7280' }}>Vlr. Desconto</Label>
                <p className="text-lg font-semibold mt-1" style={{ color: '#1F2937' }}>
                  R$ {totalDesconto.toFixed(2)}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: '#F9FAFB' }}>
                <Label className="text-xs" style={{ color: '#6B7280' }}>Cred. Resíduos</Label>
                <p className="text-lg font-semibold mt-1" style={{ color: '#1F2937' }}>
                  0,00
                </p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <Label className="text-xs font-semibold" style={{ color: '#15803D' }}>Total a Pagar</Label>
                <p className="text-xl font-bold mt-1" style={{ color: '#10B981' }}>
                  R$ {totalPagar.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé com Botões */}
        <div className="p-4 rounded-lg" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" className="flex items-center gap-2">
              <Edit2 className="w-4 h-4" />
              <span className="text-sm">Alterar</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Excluir</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span className="text-sm">Pesquisar</span>
            </Button>
            <Button
                onClick={handleOpenPaymentModal}
                className="flex items-center gap-2"
                style={{ background: '#e78b3a', color: 'white' }}
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
            <Button variant="outline" className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              <span className="text-sm">Imprimir</span>
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