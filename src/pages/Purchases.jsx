import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ShoppingCart, Search, Plus, Trash2, Save, Package, X,
  Upload, UserPlus
} from "lucide-react";
import * as entities from "@/entities";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
// Added import
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PurchasesPage() {
  const { toast } = useToast();

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [sectorMasters, setSectorMasters] = useState([]); // Added state
  const [cashAccounts, setCashAccounts] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [purchaseType, setPurchaseType] = useState('cadastrado');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchSupplier, setSearchSupplier] = useState('');

  const initialPurchaseState = {
    purchaseNumber: '',
    supplierId: '', // Changed from personId
    supplierName: '', // Changed from personName
    sectorId: '',
    sectorName: '',
    cashAccountId: '',
    cashAccountName: '',
    status: 'rascunho',
    items: [],
    freight: 0,
    taxes: 0,
    totalDiscount: 0,
    subtotal: 0,
    totalAmount: 0,
    paymentTypeId: '',
    paymentTypeName: '',
    installments: 1,
    installmentsDetails: [],
    paymentDiscount: 0,
    finalTotal: 0,
    notes: '',
    nfeReceived: false,
    nfeNumber: '',
    nfeSeries: '001',
    nfeDate: format(new Date(), 'yyyy-MM-dd'),
    createdByName: '',
    purchaseDate: format(new Date(), 'yyyy-MM-dd')
  };

  const [currentPurchase, setCurrentPurchase] = useState(initialPurchaseState);

  const [currentItem, setCurrentItem] = useState({
    productId: '',
    productCode: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    subtotal: 0,
    stockOnly: false,
    vasilhameLoanQuantity: 0,
    quantityToPickup: 0
  });

  const loadData = useCallback(async () => {
    try {
      const user = await entities.User.me();
      setCurrentUser(user);

      const [allPeople, productsData, sectorsData, sectorMastersData, cashAccountsData, paymentTypesData] = await Promise.all([
        entities.Person.filter({ companyId: user.companyId }),
        entities.Product.filter({ companyId: user.companyId, active: true }),
        entities.Sector.filter({ companyId: user.companyId, active: true }),
        entities.SectorMaster.filter({ companyId: user.companyId }),
        entities.CashAccount.filter({ companyId: user.companyId, active: true }),
        entities.PaymentType.filter({ companyId: user.companyId, active: true })
      ]);

      const suppliersList = allPeople.filter(p => p.type === 'fornecedor');
      setSuppliers(suppliersList);
      setProducts(productsData);
      setSectors(sectorsData);
      setSectorMasters(sectorMastersData);
      setCashAccounts(cashAccountsData);
      setPaymentTypes(paymentTypesData);

      // Código sequencial será gerado apenas no momento do salvamento

      // Verificar se há um supplierId na URL para auto-selecionar
      const urlParams = new URLSearchParams(window.location.search);
      const supplierId = urlParams.get('supplierId');
      if (supplierId) {
        const supplier = suppliersList.find(s => s.id === supplierId);
        if (supplier) {
          setSelectedSupplier(supplier);
          setCurrentPurchase(prev => ({
            ...prev,
            supplierId: supplier.id,
            supplierName: supplier.name
          }));
          toast({ title: "Fornecedor selecionado", description: supplier.name });
          // Limpar o parâmetro da URL para evitar re-seleção em recarregamentos
          urlParams.delete('supplierId');
          window.history.replaceState({}, document.title, `${window.location.pathname}?${urlParams.toString()}`);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os dados.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Effect to calculate main financial totals (subtotal, taxes, totalAmount, finalTotal)
  useEffect(() => {
    const itemsSubtotal = currentPurchase.items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscount = currentPurchase.items.reduce((sum, item) => sum + item.discount, 0);
    const total = itemsSubtotal + currentPurchase.freight;
    const finalTotal = total - currentPurchase.paymentDiscount;

    setCurrentPurchase(prev => ({
      ...prev,
      subtotal: itemsSubtotal,
      totalDiscount: totalDiscount,
      taxes: 0,
      totalAmount: total,
      finalTotal: finalTotal
    }));
  }, [currentPurchase.items, currentPurchase.freight, currentPurchase.paymentDiscount]);

  // Effect to update installment amounts when finalTotal or number of installments changes
  useEffect(() => {
    if (currentPurchase.paymentTypeId && currentPurchase.installments > 0 && !isNaN(currentPurchase.finalTotal)) {
      const selectedPaymentType = paymentTypes.find(pt => pt.id === currentPurchase.paymentTypeId);
      if (selectedPaymentType) {
        const isImmediatePayment = ['dinheiro', 'pix', 'cartao_debito'].includes(selectedPaymentType.type);

        // If it's an immediate payment type, ensure installments is 1
        if (isImmediatePayment && currentPurchase.installments !== 1) {
          setCurrentPurchase(prev => ({ ...prev, installments: 1 }));
          return; // Exit to let the next render cycle with updated installments handle the details
        }

        const newInstallmentAmount = currentPurchase.finalTotal / currentPurchase.installments;

        // Only update if amounts actually need changing to avoid unnecessary state updates
        // and if installmentsDetails exists
        if (currentPurchase.installmentsDetails.length > 0 && currentPurchase.installmentsDetails[0].amount !== newInstallmentAmount) {
            const updatedInstallmentsDetails = currentPurchase.installmentsDetails.map(detail => ({
                ...detail,
                amount: newInstallmentAmount // Update amount based on new finalTotal
            }));
            setCurrentPurchase(prev => ({
                ...prev,
                installmentsDetails: updatedInstallmentsDetails
            }));
        }
      }
    }
  }, [currentPurchase.finalTotal, currentPurchase.paymentTypeId, currentPurchase.installments, paymentTypes, currentPurchase.installmentsDetails]);


  const handleSearchSupplier = () => {
    if (!searchSupplier.trim()) {
      toast({ title: "Atenção", description: "Digite um CNPJ ou Nome para buscar.", variant: "destructive" });
      return;
    }

    const found = suppliers.find(s =>
      s.document?.includes(searchSupplier) ||
      s.name.toLowerCase().includes(searchSupplier.toLowerCase())
    );

    if (found) {
      setSelectedSupplier(found);
      setCurrentPurchase(prev => ({
        ...prev,
        supplierId: found.id, // Changed from personId
        supplierName: found.name // Changed from personName
      }));
      toast({ title: "Fornecedor encontrado", description: found.name });
    } else {
      toast({ title: "Não encontrado", description: "Fornecedor não encontrado.", variant: "destructive" });
    }
  };

  const handleProductCodeChange = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setCurrentItem(prev => ({
        ...prev,
        productId: product.id,
        productCode: product.code || '',
        productName: product.name,
        unitPrice: product.costPrice || 0,
        subtotal: prev.quantity * (product.costPrice || 0) - prev.discount
      }));
    } else {
      setCurrentItem(prev => ({
        ...prev,
        productId: '',
        productCode: '', // Reset product code as well
        productName: '',
        unitPrice: 0,
        subtotal: (prev.quantity * 0) - prev.discount
      }));
    }
  };

  const updateItemField = (field, value) => {
    setCurrentItem(prev => {
      const updated = { ...prev, [field]: value };

      if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
        updated.subtotal = (updated.quantity * updated.unitPrice) - updated.discount;
      }
      return updated;
    });
  };

  const addItem = () => {
    if (!currentItem.productId) {
      toast({ title: "Atenção", description: "Selecione um produto.", variant: "destructive" });
      return;
    }

    const itemExists = currentPurchase.items.find(item => item.productId === currentItem.productId);
    if (itemExists) {
      toast({ title: "Atenção", description: "Este produto já foi adicionado.", variant: "destructive" });
      return;
    }

    setCurrentPurchase(prev => ({
      ...prev,
      items: [...prev.items, { ...currentItem }]
    }));

    setCurrentItem({
      productId: '',
      productCode: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      subtotal: 0,
      stockOnly: false,
      vasilhameLoanQuantity: 0,
      quantityToPickup: 0
    });
  };

  const removeItem = (index) => {
    setCurrentPurchase(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...currentPurchase.items];
    const numericValue = ['quantity', 'unitPrice', 'discount', 'vasilhameLoanQuantity', 'quantityToPickup'].includes(field) ? parseFloat(value) || 0 : value;

    newItems[index][field] = numericValue;

    const item = newItems[index];
    item.subtotal = (item.quantity * item.unitPrice) - item.discount;

    setCurrentPurchase(prev => ({ ...prev, items: newItems }));
  };

  const handlePaymentTypeChange = (paymentTypeId) => {
    const paymentType = paymentTypes.find(pt => pt.id === paymentTypeId);
    if (!paymentType) return;

    const isImmediatePayment = ['dinheiro', 'pix', 'cartao_debito'].includes(paymentType.type);
    const maxInstallments = paymentType.maxInstallments || 1;
    const installments = isImmediatePayment ? 1 : maxInstallments;

    // Gerar detalhes das parcelas
    const installmentsDetails = [];
    const totalAmountPerInstallment = currentPurchase.finalTotal / installments;
    for (let i = 0; i < installments; i++) {
      const dueDate = new Date(currentPurchase.purchaseDate);
      dueDate.setDate(dueDate.getDate() + (i * 30)); // Assuming 30 days per installment for simplicity
      installmentsDetails.push({
        number: i + 1,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        amount: totalAmountPerInstallment,
        status: 'pendente'
      });
    }

    setCurrentPurchase(prev => ({
      ...prev,
      paymentTypeId: paymentTypeId,
      paymentTypeName: paymentType.name,
      installments: installments,
      installmentsDetails: installmentsDetails
    }));
  };

  const handleInstallmentsChange = (newInstallments) => {
    const numInstallments = Math.max(1, newInstallments); // Ensure at least 1 installment
    const installmentsDetails = [];
    const totalAmountPerInstallment = currentPurchase.finalTotal / numInstallments;
    for (let i = 0; i < numInstallments; i++) {
      const dueDate = new Date(currentPurchase.purchaseDate);
      dueDate.setDate(dueDate.getDate() + (i * 30)); // Assuming 30 days per installment for simplicity
      installmentsDetails.push({
        number: i + 1,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        amount: totalAmountPerInstallment,
        status: 'pendente'
      });
    }

    setCurrentPurchase(prev => ({
      ...prev,
      installments: numInstallments,
      installmentsDetails: installmentsDetails
    }));
  };

  const updateInstallmentDetail = (index, field, value) => {
    const newDetails = [...currentPurchase.installmentsDetails];
    // Ensure numeric fields are parsed correctly
    newDetails[index][field] = (field === 'amount' ? parseFloat(value) || 0 : value);
    setCurrentPurchase(prev => ({
      ...prev,
      installmentsDetails: newDetails
    }));
  };

  const handleSavePurchase = async () => {
    if (purchaseType === 'cadastrado' && !currentPurchase.supplierId) { // Updated validation
      toast({ title: "Erro", description: "Selecione um fornecedor.", variant: "destructive" });
      return;
    }

    if (currentPurchase.items.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos um item.", variant: "destructive" });
      return;
    }

    if (!currentPurchase.sectorId) {
      toast({ title: "Erro", description: "Selecione o setor de estoque.", variant: "destructive" });
      return;
    }

    if (!currentPurchase.cashAccountId) {
      toast({ title: "Erro", description: "Selecione a conta de movimento.", variant: "destructive" });
      return;
    }

    if (!currentPurchase.paymentTypeId) {
      toast({ title: "Erro", description: "Selecione a forma de pagamento.", variant: "destructive" });
      return;
    }

    try {
      const user = await entities.User.me();

      // Gerar próximo código sequencial
      const allPurchases = await entities.Purchase.filter({ companyId: user.companyId });
      const maxNumber = allPurchases.reduce((max, p) => {
        const num = parseInt(p.purchaseNumber, 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      const newNumber = String(maxNumber + 1);

      // Para compra avulsa, usar dados genéricos
      const purchaseData = {
        ...currentPurchase,
        purchaseNumber: newNumber,
        supplierId: purchaseType === 'avulsa' ? 'avulsa' : currentPurchase.supplierId, // Handled 'avulsa'
        supplierName: purchaseType === 'avulsa' ? 'Compra Avulsa' : currentPurchase.supplierName, // Handled 'avulsa'
        companyId: user.companyId,
        companyName: user.companyName,
        createdByName: user.fullName
      };

      const createdPurchase = await entities.Purchase.create(purchaseData);

      // Verificar se é pagamento a prazo
      const selectedPaymentType = paymentTypes.find(pt => pt.id === currentPurchase.paymentTypeId);
      const isAPrazo = selectedPaymentType && !['dinheiro', 'pix', 'cartao_debito'].includes(selectedPaymentType.type);

      if (isAPrazo && currentPurchase.installmentsDetails.length > 0) {
        // Registrar cada parcela em Contas a Pagar
        for (const installment of currentPurchase.installmentsDetails) {
          await entities.ContasAPagar.create({
            supplierId: purchaseData.supplierId,
            supplierName: purchaseData.supplierName,
            description: `Compra ${currentPurchase.purchaseNumber} - Parcela ${installment.number}/${currentPurchase.installments}`,
            dueDate: installment.dueDate,
            amount: installment.amount,
            status: 'aberto',
            paymentTypeId: currentPurchase.paymentTypeId,
            paymentTypeName: currentPurchase.paymentTypeName,
            installmentNumber: installment.number,
            purchaseId: createdPurchase.id,
            nfeNumber: currentPurchase.nfeNumber || '',
            companyId: user.companyId,
            companyName: user.companyName,
            createdByName: user.fullName
          });
        }
        toast({ title: "Sucesso", description: `Compra #${createdPurchase.purchaseNumber} salva! ${currentPurchase.installments} parcela(s) registrada(s) em Contas a Pagar.` });
      } else {
        toast({ title: "Sucesso", description: `Compra #${createdPurchase.purchaseNumber} salva com sucesso!` });
      }

      setCurrentPurchase(initialPurchaseState);
      setSelectedSupplier(null);
      setSearchSupplier('');
      loadData();
    } catch (error) {
      console.error("Erro ao salvar compra:", error);
      toast({ title: "Erro", description: "Erro ao salvar compra.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-[1600px] mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Compras</h1>
            <p className="text-slate-600">Gerencie as compras de produtos</p>
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Dados da Compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label>Setor *</Label>
                <Select
                  value={currentPurchase.sectorId}
                  onValueChange={(value) => {
                    // Procurar em setores normais e master
                    const sector = sectors.find(s => s.id === value);
                    const sectorMaster = sectorMasters.find(sm => sm.id === value);
                    const selectedSector = sector || sectorMaster;

                    setCurrentPurchase(prev => ({
                      ...prev,
                      sectorId: value,
                      sectorName: selectedSector?.name || ''
                    }));
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectorMasters.length > 0 && (
                      <>
                        <SelectItem value="master-header" disabled className="font-semibold text-blue-600">
                          --- Setores Master ---
                        </SelectItem>
                        {sectorMasters.map(sectorMaster => (
                          <SelectItem key={sectorMaster.id} value={sectorMaster.id}>
                            {sectorMaster.name} (Master)
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {sectors.length > 0 && (
                      <>
                        <SelectItem value="normal-header" disabled className="font-semibold text-green-600">
                          --- Setores ---
                        </SelectItem>
                        {sectors.map(sector => (
                          <SelectItem key={sector.id} value={sector.id}>
                            {sector.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Conta Movimento *</Label>
                <Select
                  value={currentPurchase.cashAccountId || ''}
                  onValueChange={(value) => {
                    const account = cashAccounts.find(a => a.id === value);
                    setCurrentPurchase(prev => ({
                      ...prev,
                      cashAccountId: value,
                      cashAccountName: account?.name || ''
                    }));
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashAccounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={currentPurchase.purchaseDate}
                  onChange={(e) => setCurrentPurchase(prev => ({...prev, purchaseDate: e.target.value}))}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-800">Fornecedor</h3>

              <div className="mb-4">
                <Label className="mb-2 block">Tipo de Compra:</Label>
                <RadioGroup value={purchaseType} onValueChange={setPurchaseType} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cadastrado" id="cad" />
                    <Label htmlFor="cad" className="cursor-pointer">Fornecedor Cadastrado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="avulsa" id="avu" />
                    <Label htmlFor="avu" className="cursor-pointer">Compra Avulsa</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="mb-4">
                <Label>Fornecedor</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por CNPJ/Nome"
                    value={searchSupplier}
                    onChange={(e) => setSearchSupplier(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSupplier()}
                    className="bg-white"
                    disabled={purchaseType === 'avulsa'}
                  />
                  <Button onClick={handleSearchSupplier} variant="outline" size="icon" disabled={purchaseType === 'avulsa'}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {selectedSupplier && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="mb-2"><strong>Nome:</strong> {selectedSupplier.name}</p>
                  <p className="mb-2"><strong>CNPJ:</strong> {selectedSupplier.document || 'N/A'}</p>
                  <p><strong>Tel:</strong> {Array.isArray(selectedSupplier.phone) ? selectedSupplier.phone[0] : selectedSupplier.phone || 'N/A'}</p>
                </div>
              )}
              {purchaseType === 'avulsa' && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="font-semibold text-slate-700">Fornecedor: Compra Avulsa</p>
                  <p className="text-sm text-slate-600">Não associado a um fornecedor cadastrado.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Adicionar Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Linha única: Código, Quantidade, Descrição, Custo, Desconto e Botão Adicionar */}
            <div className="grid grid-cols-12 gap-4 mb-4">
              <div className="col-span-2">
                <Label>Código</Label>
                <Select
                  value={currentItem.productId}
                  onValueChange={(value) => handleProductCodeChange(value)}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.code ? `${product.code} - ${product.name}` : product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Label>Qtd</Label>
                <Input
                  type="number"
                  value={currentItem.quantity}
                  onChange={(e) => updateItemField('quantity', parseInt(e.target.value) || 0)}
                  className="bg-white"
                />
              </div>
              <div className="col-span-3"> {/* Changed from col-span-4 to col-span-3 */}
                <Label>Descrição do Produto</Label>
                <Input
                  value={currentItem.productName}
                  readOnly
                  placeholder="Selecione um produto"
                  className="bg-slate-50"
                />
              </div>
              <div className="col-span-2">
                <Label>Custo Unit.</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={currentItem.unitPrice}
                  onChange={(e) => updateItemField('unitPrice', parseFloat(e.target.value) || 0)}
                  className="bg-white"
                />
              </div>
              <div className="col-span-2"> {/* Moved Desconto here */}
                <Label>Desconto</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={currentItem.discount}
                  onChange={(e) => updateItemField('discount', parseFloat(e.target.value) || 0)}
                  className="bg-white"
                />
              </div>
              <div className="col-span-2 flex items-end"> {/* Changed from col-span-3 to col-span-2 */}
                <Button onClick={addItem} className="w-full text-white hover:opacity-90" style={{ backgroundColor: '#e78b3a' }}>
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Linha: Checkbox Somente Estoque */}
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={currentItem.stockOnly || false}
                onCheckedChange={(checked) => updateItemField('stockOnly', checked)}
                id="stockOnly"
              />
              <Label htmlFor="stockOnly" className="cursor-pointer text-sm">
                Somente Estoque
              </Label>
            </div>
          </CardContent>
        </Card>

        {currentPurchase.items.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 mb-6">
            <CardHeader>
              <CardTitle>Itens da Compra ({currentPurchase.items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
                <Table>
                  <TableHeader>
                    <TableRow style={{ background: '#F3F4F6' }}>
                      <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Código</TableHead>
                      <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Descrição</TableHead>
                      <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Qtde</TableHead>
                      <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Custo Un.</TableHead>
                      <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Valor Total</TableHead>
                      <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Desconto</TableHead>
                      <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Vas</TableHead>
                      <TableHead className="text-xs font-semibold" style={{ color: '#374151' }}>Ret</TableHead>
                      <TableHead className="text-xs font-semibold text-right" style={{ color: '#374151' }}>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPurchase.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-sm">{item.productCode || '-'}</TableCell>
                        <TableCell className="text-sm">{item.productName}</TableCell>
                        <TableCell className="text-sm">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell className="text-sm">R$ {item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-sm font-semibold" style={{ color: '#10B981' }}>
                          R$ {item.subtotal.toFixed(2)}
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
                          <Input
                            type="number"
                            value={item.vasilhameLoanQuantity || 0}
                            onChange={(e) => updateItem(index, 'vasilhameLoanQuantity', e.target.value)}
                            className="w-16"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          <Input
                            type="number"
                            value={item.quantityToPickup || 0}
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
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seção Observações */}
        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 mb-6">
          <CardContent className="p-4">
            <Label className="text-xs font-medium" style={{ color: '#374151' }}>Observação da Compra:</Label>
            <Textarea
              value={currentPurchase.notes}
              onChange={(e) => setCurrentPurchase(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="mt-1"
              placeholder="Digite observações sobre a compra..."
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle>Condições e Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
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
                      {paymentTypes.map(pt => (
                        <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentPurchase.paymentTypeId && (() => {
                  const selectedPaymentType = paymentTypes.find(pt => pt.id === currentPurchase.paymentTypeId);
                  const isAPrazo = selectedPaymentType && !['dinheiro', 'pix', 'cartao_debito'].includes(selectedPaymentType.type);

                  return isAPrazo && (
                    <>
                      <div>
                        <Label>Número de Parcelas</Label>
                        <Input
                          type="number"
                          min="1"
                          max={selectedPaymentType.maxInstallments || 12} // Default max 12 if not specified
                          value={currentPurchase.installments}
                          onChange={(e) => handleInstallmentsChange(parseInt(e.target.value) || 1)}
                          className="bg-white"
                        />
                      </div>

                      {currentPurchase.installmentsDetails.length > 0 && (
                        <div className="border rounded-lg p-4 bg-slate-50">
                          <h4 className="text-sm font-semibold mb-3">Detalhes das Parcelas</h4>
                          <div className="space-y-2">
                            {currentPurchase.installmentsDetails.map((detail, index) => (
                              <div key={index} className="grid grid-cols-3 gap-2 items-center">
                                <div className="text-sm font-medium">
                                  Parcela {detail.number}
                                </div>
                                <div>
                                  <Input
                                    type="date"
                                    value={detail.dueDate}
                                    onChange={(e) => updateInstallmentDetail(index, 'dueDate', e.target.value)}
                                    className="bg-white text-xs"
                                  />
                                </div>
                                <div>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={detail.amount.toFixed(2)}
                                    onChange={(e) => updateInstallmentDetail(index, 'amount', parseFloat(e.target.value) || 0)}
                                    className="bg-white text-xs"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={currentPurchase.nfeReceived}
                    onCheckedChange={(checked) => setCurrentPurchase(prev => ({...prev, nfeReceived: checked}))}
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
                        onChange={(e) => setCurrentPurchase(prev => ({...prev, nfeNumber: e.target.value}))}
                        placeholder="000123456"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label>Série</Label>
                      <Input
                        value={currentPurchase.nfeSeries}
                        onChange={(e) => setCurrentPurchase(prev => ({...prev, nfeSeries: e.target.value}))}
                        className="bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal Produtos:</span>
                  <span className="font-semibold">R$ {currentPurchase.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-red-600">
                  <span>Desconto Total:</span>
                  <span className="font-semibold">R$ {currentPurchase.totalDiscount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Frete/Transporte:</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={currentPurchase.freight}
                    onChange={(e) => setCurrentPurchase(prev => ({...prev, freight: parseFloat(e.target.value) || 0}))}
                    className="w-32 text-right bg-white"
                  />
                </div>

                <div className="border-t pt-3 flex justify-between text-lg">
                  <span className="font-bold">TOTAL A PAGAR:</span>
                  <span className="font-bold text-blue-600">R$ {currentPurchase.totalAmount.toFixed(2)}</span>
                </div>

                <div className="mt-4 space-y-2">
                  <div>
                    <Label>Desconto Final (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentPurchase.paymentDiscount}
                      onChange={(e) => setCurrentPurchase(prev => ({...prev, paymentDiscount: parseFloat(e.target.value) || 0}))}
                      className="bg-white"
                    />
                  </div>

                  <div className="flex justify-between text-green-600">
                    <span className="font-semibold">Total Líquido:</span>
                    <span className="font-bold text-lg">R$ {currentPurchase.finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-2">
          <Button onClick={handleSavePurchase} className="text-white hover:opacity-90" style={{ backgroundColor: '#e78b3a' }}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Consultar
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Anexar NF-e
          </Button>
          <Link to={`${createPageUrl("CustomerRegistration")}?module=gerencial&return=purchases`}>
            <Button variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Cadastrar Fornecedor
            </Button>
          </Link>
          <Button variant="outline">
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}