import React, { useState, useEffect, useCallback } from "react";
import {
  Phone,
  MapPin,
  User,
  Package,
  Calendar,
  Truck,
  Plus,
  Minus,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  Edit,
  Gift, // Add Gift icon for birthday
} from 'lucide-react';
import { Order } from "@/entities/Order";
import { Person } from "@/entities/Person";
import { Product } from "@/entities/Product";
import { Employee } from "@/entities/Employee";
import { PaymentType } from "@/entities/PaymentType";
import { CashAccount } from "@/entities/CashAccount";
import { AccountsReceivable } from "@/entities/AccountsReceivable";
import { User as UserEntity } from "@/entities/User";
import { format, parseISO, addDays } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

export default function Orders() {
  const { toast } = useToast();
  const [people, setPeople] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [searchPhone, setSearchPhone] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [customerFound, setCustomerFound] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [pedidoItems, setPedidoItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Add new state to control search flow
  const [mustSearchByAddress, setMustSearchByAddress] = useState(false);
  const [phoneToAdd, setPhoneToAdd] = useState(''); // State to hold the new phone number

  const initialOrderState = {
    person_id: '',
    person_name: '',
    person_address: {}, // Add person_address to initial state
    employee_id: '',
    employee_name: '',
    payment_type_id: '',
    payment_type_name: '',
    cash_account_id: '',
    cash_account_name: '',
    status: 'pendente',
    delivery_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    items: [],
    total_amount: 0,
    created_by_name: '',
    canal: 'DISK GAS',
    urgente: false,
    convenio: false
  };

  const [currentOrder, setCurrentOrder] = useState(initialOrderState);

  const initialCustomerState = {
    name: '',
    document: '',
    email: '',
    birthday: '', // Added birthday field
    phone: [''], // Ensure phone is an array from the start
    type: 'cliente',
    address: {
      zipcode: '',
      street: '',
      number: '',
      complement: '', // Added complement
      neighborhood: '',
      reference_point: '',
      city: '',
      state: ''
    },
    glp_consumption_days: '', // Added glp_consumption_days
    conveniada_id: '',
    conveniada_name: '',
    created_by_name: '',
    active: true,
    person_number: '' // Added for sequential numbering
  };

  const [currentCustomer, setCurrentCustomer] = useState(initialCustomerState);

  // New function: generateReceivables
  const generateReceivables = async (order, user) => {
    if (order.payment_methods && Array.isArray(order.payment_methods)) {
        for (const payment of order.payment_methods) {
            if (payment.installments && payment.installments > 0 && payment.type !== 'avista') {
                for (let i = 1; i <= payment.installments; i++) {
                    const baseDueDate = payment.due_date ? new Date(payment.due_date) : new Date(order.delivery_date || new Date());
                    await AccountsReceivable.create({
                        person_id: order.person_id,
                        person_name: order.person_name,
                        sale_id: order.id, 
                        installment_number: i,
                        description: `Parcela ${i}/${payment.installments} do Pedido ${order.order_number}`,
                        due_date: format(addDays(baseDueDate, (i - 1) * 30), 'yyyy-MM-dd'),
                        amount: payment.amount / payment.installments,
                        status: 'pendente',
                        company_id: user.company_id,
                        company_name: user.company_name,
                        created_by_name: user.full_name,
                    });
                }
            }
        }
    } else {
        const paymentType = paymentTypes.find(pt => pt.id === currentOrder.payment_type_id);
        if (paymentType && paymentType.type === 'a_prazo') {
            await AccountsReceivable.create({
                person_id: order.person_id,
                person_name: order.person_name,
                sale_id: order.id, 
                installment_number: 1,
                description: `Pedido ${order.order_number} - ${currentOrder.payment_type_name}`,
                due_date: format(addDays(new Date(order.delivery_date || new Date()), 0), 'yyyy-MM-dd'),
                amount: order.total_amount,
                status: 'pendente',
                company_id: user.company_id,
                company_name: user.company_name,
                created_by_name: user.full_name,
            });
        }
    }
  };

  // New function: updateStock - Placeholder as implementation is not provided in outline
  const updateStock = async (items, user) => {
    console.log("Updating stock for order items:", items, "for user:", user.full_name);
    // TODO: Implement actual stock update logic (e.g., decrement product quantities)
  };

  // New function: validateOrder - encapsulates existing validation
  const validateOrder = () => {
    if (!customerFound) {
      toast({ title: "Atenção", description: "Selecione um cliente antes de finalizar.", variant: "destructive" });
      return false;
    }

    if (pedidoItems.length === 0) {
      toast({ title: "Atenção", description: "Adicione pelo menos um item ao pedido.", variant: "destructive" });
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
          setCurrentCustomer(prev => ({
            ...prev,
            address: {
              ...prev.address,
              zipcode: cep,
              street: (data.logradouro || '').toUpperCase(),
              neighborhood: (data.bairro || '').toUpperCase(),
              city: (data.localidade || '').toUpperCase(),
              state: (data.uf || '').toUpperCase(),
              complement: prev.address.complement || '' // Preserve existing complement
            }
          }));
          toast({ title: "CEP encontrado", description: "Endereço preenchido automaticamente." });
        } else {
          // Clear address fields if CEP search fails
          setCurrentCustomer(prev => ({
            ...prev,
            address: {
              ...prev.address,
              zipcode: cep,
              street: '',
              neighborhood: '',
              city: '',
              state: '',
              complement: '' // Clear complement on failed CEP search
            }
          }));
          toast({ title: "CEP não encontrado", description: "CEP não existe. Preencha o endereço manualmente.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        toast({ title: "Erro", description: "Não foi possível buscar o CEP. Verifique sua conexão.", variant: "destructive" });
        // Clear address fields on network error
        setCurrentCustomer(prev => ({
          ...prev,
          address: {
            ...prev.address,
            zipcode: cep,
            street: '',
            neighborhood: '',
            city: '',
            state: '',
            complement: '' // Clear complement on network error
          }
        }));
      }
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await UserEntity.me();
      setCurrentUser(user);
      const company_id = user.company_id;

      const [allPeople, productsData, employeesData, paymentTypesData, cashAccountsData] = await Promise.all([
        Person.filter({ company_id: company_id }),
        Product.filter({ company_id: company_id, active: true }),
        Employee.filter({ company_id: company_id, position: 'entregador', active: true }),
        PaymentType.filter({ company_id: company_id, active: true }),
        CashAccount.filter({ company_id: company_id, active: true }),
      ]);

      setPeople(allPeople.filter(p => p.type === 'cliente'));
      setProducts(productsData);
      setEmployees(employeesData);
      setPaymentTypes(paymentTypesData);
      setCashAccounts(cashAccountsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os dados necessários.", variant: "destructive" });
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
        { person_id: customerFound.id, company_id: user.company_id },
        '-created_date',
        12
      );
      setCustomerHistory(history);
    } catch (error) {
      console.error("Erro ao buscar histórico do cliente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico do cliente.",
        variant: "destructive"
      });
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const selectCustomer = (person) => {
    setCustomerFound(person);
    setCurrentOrder(prev => ({
        ...prev,
        person_id: person.id,
        person_name: person.name,
        person_address: person.address || {}
    }));
    // Reset search states
    setSearchPhone('');
    setSearchAddress('');
    setSuggestions([]);
    setShowSuggestions(false);
    setMustSearchByAddress(false);
    setPhoneToAdd(''); // Clear any pending phone to add
  };

  const addPhoneToCustomer = async (person, newPhone) => {
      try {
          const currentPhones = Array.isArray(person.phone) ? person.phone : (person.phone ? [person.phone] : []);
          const updatedPhones = [...new Set([...currentPhones, newPhone])]; // Use Set to avoid duplicates and ensure array

          await Person.update(person.id, { phone: updatedPhones });
          
          toast({ title: "Sucesso", description: `Telefone ${newPhone} adicionado a ${person.name}.` });

          // Refresh local data to reflect the change
          const user = await UserEntity.me(); // Need user to get company_id
          const updatedPeople = await Person.filter({ company_id: user.company_id, type: 'cliente' }); // Filter by type to get only clients
          setPeople(updatedPeople);
          const updatedPerson = updatedPeople.find(p => p.id === person.id);
          
          selectCustomer(updatedPerson || person); // Select the updated person, or original if update failed somehow
      } catch (error) {
          console.error("Erro ao adicionar telefone ao cliente:", error);
          toast({ title: "Erro", description: "Não foi possível adicionar o telefone.", variant: "destructive" });
          selectCustomer(person); // Select the original person anyway if update failed
      } finally {
          setPhoneToAdd('');
      }
  };

  const handleSearchCustomer = async () => {
    if (!searchPhone.trim()) {
      toast({
        title: "Atenção",
        description: "Digite um telefone para buscar.",
        variant: "destructive"
      });
      return;
    }

    const foundPerson = people.find(p => p.phone?.includes(searchPhone.trim()));

    if (foundPerson) {
      selectCustomer(foundPerson);
      setPhoneToAdd(''); // Clear any pending phone to add
    } else {
      // Phone not found - force address search first
      setMustSearchByAddress(true);
      setPhoneToAdd(searchPhone.trim()); // Store the phone that was not found
      toast({
        title: "Telefone não encontrado",
        description: "Por favor, tente buscar pelo endereço antes de cadastrar um novo cliente.",
        variant: "default"
      });
    }
  };

  const handleSearchByAddress = () => {
    const value = searchAddress.trim();
    if (!value) {
      toast({
        title: "Atenção",
        description: "Digite um endereço para buscar.",
        variant: "destructive"
      });
      return;
    }

    const cepValue = value.replace(/\D/g, '');
    let filteredSuggestions = [];

    if (cepValue.length === 8) {
      filteredSuggestions = people.filter(p => p.address?.zipcode === cepValue);
    } else {
      const normalizedQuery = normalizeString(value);
      filteredSuggestions = people.filter(p => {
        if (!p.address) return false;
        const street = normalizeString(p.address.street || '');
        const number = normalizeString(p.address.number || '');
        const neighborhood = normalizeString(p.address.neighborhood || '');
        const addressString = `${street} ${number} ${neighborhood}`.trim();
        return addressString.includes(normalizedQuery);
      });
    }

    if (filteredSuggestions.length === 0) {
      // No customer found by address either
      if (mustSearchByAddress) {
        // Only now allow creating new customer since both phone and address searches failed
        const parts = value.split(/,?\s+/);
        let street = '';
        let number = '';

        // Attempt to parse number from the end if it looks like a number
        if (parts.length > 0) {
          const lastPart = parts[parts.length - 1];
          if (!isNaN(parseInt(lastPart)) && lastPart.length < 6) {
            number = lastPart;
            street = parts.slice(0, -1).join(' ');
          } else {
            street = parts.join(' ');
          }
        }

        setCurrentCustomer(prev => ({
          ...initialCustomerState,
          phone: [searchPhone.trim()], // Use the phone that was searched
          address: {
            ...initialCustomerState.address,
            street: street.trim(),
            number: number.trim()
          }
        }));
        setIsEditingCustomer(false);
        setShowCustomerForm(true);
        setSearchAddress(''); // Clear search field
        setMustSearchByAddress(false); // Reset the flag
      } else {
        // First time searching by address, just show message
        toast({
          title: "Endereço não encontrado",
          description: "Nenhum cliente encontrado com este endereço. Tente outro endereço ou busque por telefone primeiro.",
          variant: "default"
        });
      }
    } else if (filteredSuggestions.length === 1) {
      // Exactly one customer found, select them
      handleSelectSuggestion(filteredSuggestions[0]);
      setMustSearchByAddress(false); // Reset the flag
    } else {
      // Multiple customers found, show suggestions for user to pick
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
      setMustSearchByAddress(false); // Reset the flag since we found options
    }
  };

  const handleAddressChange = (e) => {
    const value = e.target.value.toUpperCase(); // Convert input value to uppercase
    setSearchAddress(value);

    if (!value || value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const cepValue = value.replace(/\D/g, '');
      let filteredSuggestions = [];

      if (cepValue.length === 8) {
        filteredSuggestions = people.filter(p => p.address?.zipcode === cepValue);
      } else {
        const normalizedQuery = normalizeString(value);
        filteredSuggestions = people.filter(p => {
          if (!p.address) return false;

          const street = normalizeString(p.address.street || '');
          const number = normalizeString(p.address.number || '');
          const neighborhood = normalizeString(p.address.neighborhood || '');

          const addressString = `${street} ${number} ${neighborhood}`.trim();
          return addressString.includes(normalizedQuery);
        });
      }

      setSuggestions(filteredSuggestions.slice(0, 10));
      setShowSuggestions(filteredSuggestions.length > 0);
    } catch (error) {
      console.error("Erro na busca por endereço:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (person) => {
    // Ensure person.phone is an array for consistency
    const personPhones = Array.isArray(person.phone) ? person.phone : (person.phone ? [person.phone] : []);

    if (phoneToAdd && !personPhones.includes(phoneToAdd)) {
        if (window.confirm(`Deseja incluir o telefone ${phoneToAdd} ao cadastro de ${person.name}?`)) {
            addPhoneToCustomer(person, phoneToAdd); // This function will call selectCustomer internally
        } else {
            selectCustomer(person); // Select without adding phone
            setPhoneToAdd(''); // Clear phoneToAdd if user cancels
        }
    } else {
        selectCustomer(person); // Normal selection
        setPhoneToAdd(''); // Clear phoneToAdd as it's either not relevant or already processed
    }
  };

  const handleEditCustomer = () => {
    if (customerFound) {
      // Ensure phone is always an array for editing
      const phoneArray = Array.isArray(customerFound.phone) ? customerFound.phone : 
                        (customerFound.phone ? [customerFound.phone] : ['']);
      
      setCurrentCustomer({
        ...customerFound,
        phone: phoneArray.length > 0 ? phoneArray : [''] // Ensure at least one empty field
      });
      setIsEditingCustomer(true);
      setShowCustomerForm(true);
    }
  };

  const handlePhoneChange = (index, value) => {
    const newPhones = [...currentCustomer.phone];
    newPhones[index] = value;
    setCurrentCustomer(prev => ({ ...prev, phone: newPhones }));
  };

  const addPhone = () => {
    setCurrentCustomer(prev => ({ ...prev, phone: [...prev.phone, ''] }));
  };

  const removePhone = (index) => {
    if (currentCustomer.phone.length > 1) {
      setCurrentCustomer(prev => {
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
        phone: currentCustomer.phone.filter(p => p.trim() !== ''),
        company_id: user.company_id,
        company_name: user.company_name,
        created_by_name: user.full_name
      };

      // If all phone fields are empty after filtering, ensure the phone array is not empty
      if (customerPayload.phone.length === 0) {
        customerPayload.phone = [''];
      }
      
      // Ensure optional fields are null if empty
      if (customerPayload.glp_consumption_days === '') {
        customerPayload.glp_consumption_days = null;
      }
      if (customerPayload.birthday === '') {
        customerPayload.birthday = null;
      }


      if (isEditingCustomer) {
        const { id, ...customerData } = customerPayload;
        savedCustomer = await Person.update(id, customerData);
      } else {
        // Generate sequential person number for new customers
        const allPersons = await Person.filter({ company_id: user.company_id });
        const maxPersonNumber = allPersons.reduce((max, person) => {
          const currentNum = parseInt(person.person_number, 10);
          return !isNaN(currentNum) && currentNum > max ? currentNum : max;
        }, 0);
        const newPersonNumber = maxPersonNumber + 1;
        
        customerPayload = {
          ...customerPayload,
          person_number: String(newPersonNumber)
        };

        savedCustomer = await Person.create(customerPayload);
      }

      const refreshedPeople = await Person.filter({ company_id: user.company_id, type: 'cliente' });
      setPeople(refreshedPeople);

      const updatedCustomer = refreshedPeople.find(p => p.id === (savedCustomer.id || currentCustomer.id));

      selectCustomer(updatedCustomer); // Use selectCustomer for consistency
      setShowCustomerForm(false);
      resetCustomerForm();
      toast({ title: "Sucesso", description: "Cliente salvo com sucesso." });
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast({ title: "Erro", description: "Não foi possível salvar o cliente.", variant: "destructive" });
    }
  };

  const resetCustomerForm = () => {
    setCurrentCustomer(initialCustomerState);
    setIsEditingCustomer(false);
  };

  const clearCustomer = () => {
    setCustomerFound(null);
    setCurrentOrder(prev => ({
      ...prev,
      person_id: '',
      person_name: '',
      person_address: {} // Clear address when clearing customer
    }));
    setSearchPhone('');
    setSearchAddress('');
    setMustSearchByAddress(false); // Reset the flag
    setPhoneToAdd('');
  };

  const calcularTotal = () => {
    return pedidoItems.reduce((total, item) => total + (item.qtde * item.preco - item.desconto), 0);
  };

  const adicionarItem = (index) => {
    const newItems = [...pedidoItems];
    newItems[index].qtde += 1;
    setPedidoItems(newItems);
  };

  const removerItem = (index) => {
    const newItems = [...pedidoItems];
    if (newItems[index].qtde > 0) {
      newItems[index].qtde -= 1;
      setPedidoItems(newItems);
    }
  };

  const adicionarProduto = () => {
    if (!selectedProductId) {
      toast({ title: "Atenção", description: "Selecione um produto para adicionar.", variant: "destructive" });
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (product) {
      const itemExists = pedidoItems.find(item => item.product_id === product.id);
      if (itemExists) {
        toast({ title: "Atenção", description: "Este produto já foi adicionado ao pedido.", variant: "destructive" });
        return;
      }

      setPedidoItems(prev => [...prev, {
        product_id: product.id,
        codigo: product.code || product.id.substring(0, 6),
        produto: product.name,
        qtde: 1,
        preco: product.unit_price || 0,
        desconto: 0
      }]);
      setSelectedProductId('');
    }
  };

  const handleSaveOrder = async () => {
    if (!validateOrder()) return;
    
    setIsSaving(true);
    try {
      const user = await UserEntity.me();
      const orderTotal = calcularTotal();

      // Lógica para numeração sequencial
      const companyOrders = await Order.filter({ company_id: user.company_id });
      const maxOrderNumber = companyOrders.reduce((max, order) => {
        const currentNum = parseInt(order.order_number, 10);
        return !isNaN(currentNum) && currentNum > max ? currentNum : max;
      }, 0);
      const newOrderNumber = maxOrderNumber + 1;

      const orderToSave = {
        order_number: String(newOrderNumber),
        person_id: currentOrder.person_id,
        person_name: currentOrder.person_name,
        // Garante que o endereço do cliente selecionado seja salvo no pedido
        person_address: customerFound?.address || {},
        employee_id: currentOrder.employee_id || '',
        employee_name: currentOrder.employee_name || '',
        payment_type_id: currentOrder.payment_type_id || '',
        payment_type_name: currentOrder.payment_type_name || '',
        status: 'pendente', // Garantir que o status seja definido explicitamente
        delivery_date: currentOrder.delivery_date,
        notes: currentOrder.notes || '',
        canal: currentOrder.canal, // Preserve existing order properties
        urgente: currentOrder.urgente, // Preserve existing order properties
        convenio: currentOrder.convenio, // Preserve existing order properties
        items: pedidoItems.map(item => ({
          product_id: item.product_id,
          product_name: item.produto,
          quantity: item.qtde,
          unit_price: item.preco,
          discount: item.desconto,
          total: (item.qtde * item.preco) - item.desconto
        })),
        total_amount: orderTotal,
        company_id: user.company_id,
        company_name: user.company_name,
        created_by_name: user.full_name
      };

      const newOrder = await Order.create(orderToSave);
      
      console.log("Pedido criado com sucesso:", newOrder); // Debug log
      
      // Call functions as per outline
      await updateStock(newOrder.items, user);
      await generateReceivables(newOrder, user);

      // Reset form after successful order creation
      setCurrentOrder(initialOrderState);
      setPedidoItems([]);
      setCustomerFound(null);
      setSearchPhone('');
      setSearchAddress('');
      setPhoneToAdd('');

      toast({ title: "Sucesso", description: `Pedido ${newOrderNumber} criado com sucesso! Vá para Acompanhamento para visualizar.` });
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      toast({ title: "Erro", description: "Não foi possível finalizar o pedido.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#f2f1ed' }}>
        <p className="text-xl font-bold" style={{ color: '#223f61' }}>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#f2f1ed' }}>
      {/* Customer Form Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#223f61' }}>
                {isEditingCustomer ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Nome *</label>
                  <input
                    type="text"
                    value={currentCustomer.name}
                    onChange={(e) => setCurrentCustomer(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: '#95b4df' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>CPF/CNPJ</label>
                  <input
                    type="text"
                    value={currentCustomer.document}
                    onChange={(e) => setCurrentCustomer(prev => ({ ...prev, document: e.target.value.toUpperCase() }))}
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: '#95b4df' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Email</label>
                  <input
                    type="email"
                    value={currentCustomer.email}
                    onChange={(e) => setCurrentCustomer(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: '#95b4df' }}
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Data de Aniversário</label>
                    <input
                        type="date"
                        value={currentCustomer.birthday || ''}
                        onChange={(e) => setCurrentCustomer(prev => ({ ...prev, birthday: e.target.value }))}
                        className="w-full p-2 border-2 rounded-lg"
                        style={{ borderColor: '#95b4df' }}
                    />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#223f61' }}>Telefones</label>
                  <div className="space-y-2">
                    {currentCustomer.phone.map((phone, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => handlePhoneChange(index, e.target.value)}
                          placeholder={`Telefone ${index + 1}`}
                          className="flex-1 p-2 border-2 rounded-lg"
                          style={{ borderColor: '#95b4df' }}
                        />
                        {currentCustomer.phone.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhone(index)}
                            className="px-2 py-1 rounded text-white text-sm"
                            style={{ backgroundColor: '#dc3545' }}
                          >
                            <Minus className="w-4 h-4"/>
                          </button>
                        )}
                        {index === currentCustomer.phone.length - 1 && (
                          <button
                            type="button"
                            onClick={addPhone}
                            className="px-2 py-1 rounded text-white text-sm"
                            style={{ backgroundColor: '#28a745' }}
                          >
                            <Plus className="w-4 h-4"/>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-3" style={{ color: '#223f61' }}>Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>CEP</label>
                  <input
                    type="text"
                    value={currentCustomer.address.zipcode}
                    onChange={(e) => {
                      const cep = e.target.value.replace(/\D/g, '');
                      setCurrentCustomer(prev => ({
                        ...prev,
                        address: { ...prev.address, zipcode: cep }
                      }));
                      if (cep.length === 8) {
                        searchAddressByCEP(cep);
                      }
                    }}
                    placeholder="00000-000"
                    maxLength={8}
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: '#95b4df' }}
                  />
                  <p className="text-xs text-gray-500 mt-1">Digite o CEP para preencher automaticamente</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Rua</label>
                  <input
                    type="text"
                    value={currentCustomer.address.street}
                    onChange={(e) => setCurrentCustomer(prev => ({
                      ...prev,
                      address: { ...prev.address, street: e.target.value.toUpperCase() }
                    }))}
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: '#95b4df' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Número</label>
                  <input
                    type="text"
                    value={currentCustomer.address.number}
                    onChange={(e) => setCurrentCustomer(prev => ({
                      ...prev,
                      address: { ...prev.address, number: e.target.value.toUpperCase() }
                    }))}
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: '#95b4df' }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Complemento</label>
                  <input
                    type="text"
                    value={currentCustomer.address.complement}
                    onChange={(e) => setCurrentCustomer(prev => ({
                      ...prev,
                      address: { ...prev.address, complement: e.target.value.toUpperCase() }
                    }))}
                    placeholder="Apto, Bloco, Casa, etc."
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: '#95b4df' }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Bairro</label>
                  <input
                    type="text"
                    value={currentCustomer.address.neighborhood}
                    onChange={(e) => setCurrentCustomer(prev => ({
                      ...prev,
                      address: { ...prev.address, neighborhood: e.target.value.toUpperCase() }
                    }))}
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: '#95b4df' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Cidade</label>
                  <input
                    type="text"
                    value={currentCustomer.address.city}
                    onChange={(e) => setCurrentCustomer(prev => ({
                      ...prev,
                      address: { ...prev.address, city: e.target.value.toUpperCase() }
                    }))}
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: '#95b4df' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Estado</label>
                  <input
                    type="text"
                    value={currentCustomer.address.state}
                    onChange={(e) => setCurrentCustomer(prev => ({
                      ...prev,
                      address: { ...prev.address, state: e.target.value.toUpperCase() }
                    }))}
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: '#95b4df' }}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Ponto de Referência</label>
                  <input
                    type="text"
                    value={currentCustomer.address.reference_point}
                    onChange={(e) => setCurrentCustomer(prev => ({
                      ...prev,
                      address: { ...prev.address, reference_point: e.target.value.toUpperCase() }
                    }))}
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: '#95b4df' }}
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-3" style={{ color: '#223f61' }}>Informações Complementares</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Consumo GLP (dias) - Opcional</label>
                  <input
                    type="number"
                    value={currentCustomer.glp_consumption_days || ''}
                    onChange={(e) => setCurrentCustomer(prev => ({ 
                      ...prev, 
                      glp_consumption_days: e.target.value === '' ? '' : parseInt(e.target.value, 10) || ''
                    }))}
                    placeholder="Ex: 30 (dias para trocar o botijão)"
                    className="w-full p-2 border-2 rounded-lg"
                    style={{ borderColor: '#95b4df' }}
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Frequência em dias para troca do botijão (campo opcional)</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCustomerForm(false)}
                  className="px-4 py-2 border-2 rounded-lg font-medium"
                  style={{ borderColor: '#95b4df', color: '#223f61' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCustomer}
                  className="px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: '#28a745' }}
                >
                  {isEditingCustomer ? 'Salvar Alterações' : 'Salvar Cliente'}
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
                <h2 className="text-xl font-bold" style={{ color: '#223f61' }}>
                  Histórico de Pedidos - {customerFound?.name}
                </h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500"/>
                </button>
              </div>
              
              {isHistoryLoading ? (
                <div className="text-center py-10">Carregando histórico...</div>
              ) : (
                customerHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2" style={{ borderColor: '#95b4df' }}>
                          <th className="text-left py-2 font-semibold" style={{ color: '#223f61' }}>Data</th>
                          <th className="text-left py-2 font-semibold" style={{ color: '#223f61' }}>Produtos (Qtd)</th>
                          <th className="text-right py-2 font-semibold" style={{ color: '#223f61' }}>Valor</th>
                          <th className="text-left py-2 font-semibold" style={{ color: '#223f61' }}>Entregador</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerHistory.map(order => (
                          <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2">{format(parseISO(order.created_date), 'dd/MM/yy')}</td>
                            <td className="py-3 px-2">
                              {order.items.map(item => `${item.product_name} (${item.quantity})`).join(', ')}
                            </td>
                            <td className="py-3 px-2 text-right font-medium">R$ {order.total_amount.toFixed(2)}</td>
                            <td className="py-3 px-2">{order.employee_name || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    Nenhum pedido encontrado para este cliente.
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Dense Layout */}
      <div className="flex-1 p-2 grid grid-cols-12 gap-2 overflow-hidden">

        {/* Customer Info - 4 columns */}
        <div className="col-span-4 bg-white rounded-lg shadow-md p-3 space-y-3">
          {/* Customer Search */}
          {!customerFound ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" style={{ color: '#95b4df' }}/>
                <input
                  type="text"
                  placeholder="Digite o telefone do cliente..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomer()}
                  className="flex-1 p-2 border-2 rounded-lg text-sm"
                  style={{ borderColor: '#95b4df' }}
                  disabled={mustSearchByAddress}
                />
                <button
                  onClick={handleSearchCustomer}
                  disabled={mustSearchByAddress}
                  className="px-3 py-2 rounded text-sm text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#95b4df' }}
                >
                  <Search className="w-4 h-4"/>
                </button>
              </div>

              {mustSearchByAddress && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 font-medium">
                    Telefone não encontrado. Por favor, tente buscar pelo endereço antes de cadastrar um novo cliente.
                  </p>
                </div>
              )}

              <div className="text-center text-sm text-gray-400">- ou -</div>

              <div className="relative">
                 <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" style={{ color: '#95b4df' }}/>
                    <input
                        type="text"
                        placeholder="Endereço (Rua, Nº) ou CEP"
                        value={searchAddress}
                        onChange={handleAddressChange}
                        onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchByAddress()}
                        className={`flex-1 p-2 border-2 rounded-lg text-sm ${mustSearchByAddress ? 'border-yellow-400 bg-yellow-50' : ''}`}
                        style={{ borderColor: mustSearchByAddress ? '#fbbf24' : '#95b4df' }}
                    />
                    <button
                      onClick={handleSearchByAddress}
                      className="px-3 py-2 rounded text-sm text-white font-medium"
                      style={{ backgroundColor: '#95b4df' }}
                    >
                      <Search className="w-4 h-4"/>
                    </button>
                </div>
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                        <ul className="divide-y divide-gray-100">
                            {suggestions.map(person => (
                                <li
                                    key={person.id}
                                    className="p-3 cursor-pointer hover:bg-slate-50"
                                    onMouseDown={() => handleSelectSuggestion(person)}
                                >
                                    <p className="font-bold text-sm" style={{color: '#223f61'}}>{person.name || 'Nome não informado'}</p>
                                    <p className="text-xs text-gray-600">
                                      {`${person.address?.street || ''} ${person.address?.number || ''} - ${person.address?.neighborhood || ''}`.trim() || 'Endereço não informado'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Tel: {Array.isArray(person.phone) ? person.phone.join(', ') : (person.phone || 'N/A')}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

              <div className="text-center pt-4" style={{ color: '#223f61' }}>
                <User className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                <p className="text-sm">Busque o cliente por telefone ou endereço</p>
                {mustSearchByAddress && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Complete a busca por endereço para continuar
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Customer Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" style={{ color: '#95b4df' }}/>
                    <span className="font-bold text-base" style={{ color: '#223f61' }}>
                      {Array.isArray(customerFound.phone) ? customerFound.phone[0] : (customerFound.phone || 'N/A')}
                    </span>
                    <span className="text-sm text-gray-500">Cód: {customerFound.person_number || customerFound.id.substring(0, 6)}</span>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={handleEditCustomer}
                      className="px-2 py-1 rounded text-xs text-white font-medium"
                      style={{ backgroundColor: '#95b4df' }}
                    >
                      <Edit className="w-3 h-3"/>
                    </button>
                    <button
                      onClick={() => window.open(`https://wa.me/55${(Array.isArray(customerFound.phone) ? customerFound.phone[0] : customerFound.phone)?.replace(/\D/g, '')}`)}
                      className="px-2 py-1 rounded text-xs text-white font-medium"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={clearCustomer}
                      className="px-2 py-1 rounded text-xs text-white font-medium"
                      style={{ backgroundColor: '#dc3545' }}
                    >
                      <XCircle className="w-3 h-3"/>
                    </button>
                  </div>
                </div>

                <h2 className="text-xl font-bold" style={{ color: '#223f61' }}>{customerFound.name.toUpperCase()}</h2>
              </div>

              {/* Address Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center space-x-1" style={{ color: '#e78b3a' }}>
                  <MapPin className="w-4 h-4"/>
                  <span>Endereço</span>
                </h3>
                <div className="text-sm space-y-1" style={{ color: '#223f61' }}>
                  <p><strong>{(customerFound.address?.street?.toUpperCase() || 'Rua não informada')}, {customerFound.address?.number || 'S/N'}</strong></p>
                  {customerFound.address?.complement && (
                    <p>{customerFound.address.complement}</p>
                  )}
                  <p>{(customerFound.address?.neighborhood?.toUpperCase() || 'Bairro não informado')} - {(customerFound.address?.city?.toUpperCase() || 'Cidade não informada')}/{(customerFound.address?.state?.toUpperCase() || 'UF')}</p>
                  {customerFound.address?.reference_point && (
                    <p className="text-gray-600">Ref: {customerFound.address.reference_point}</p>
                  )}
                </div>
              </div>

              {/* Customer Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-gray-500">Documento:</p>
                  <p className="font-medium" style={{ color: '#223f61' }}>{customerFound.document || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Aniversário:</p>
                  <p className="font-medium flex items-center gap-1.5" style={{ color: '#223f61' }}>
                    {customerFound.birthday ? (
                      <>
                        <Gift className="w-3.5 h-3.5 text-pink-500"/>
                        {format(parseISO(customerFound.birthday), 'dd/MM/yyyy')}
                      </>
                    ) : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Status:</p>
                  <p className="font-medium" style={{ color: customerFound.active ? '#28a745' : '#dc3545' }}>
                    {customerFound.active ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                {customerFound.glp_consumption_days && (
                  <div className="space-y-1">
                    <p className="text-gray-500">Consumo GLP:</p>
                    <p className="font-medium" style={{ color: '#223f61' }}>{customerFound.glp_consumption_days} dias</p>
                  </div>
                )}
              </div>
              {/* History Button */}
              <div className="pt-3 border-t mt-3">
                <button 
                  onClick={handleShowHistory}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-white font-medium hover:scale-105 transition-transform" 
                  style={{ backgroundColor: '#e78b3a' }}
                >
                  <FileText className="w-4 h-4"/>
                  <span>Histórico do Cliente</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Order Details - 5 columns */}
        <div className="col-span-5 bg-white rounded-lg shadow-md p-3 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold flex items-center space-x-2" style={{ color: '#223f61' }}>
              <Package className="w-5 h-5"/>
              <span>Detalhes do Pedido</span>
            </h3>

            {/* Add Product */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="p-1 border-2 rounded text-sm"
                style={{ borderColor: '#95b4df' }}
              >
                <option value="">Selecione um produto...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - R$ {product.unit_price?.toFixed(2)}
                  </option>
                ))}
              </select>
              <button
                onClick={adicionarProduto}
                className="px-2 py-1 rounded text-white font-medium"
                style={{ backgroundColor: '#e78b3a' }}
              >
                <Plus className="w-4 h-4"/>
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2" style={{ borderColor: '#95b4df' }}>
                  <th className="text-left py-2 font-semibold" style={{ color: '#223f61' }}>Código</th>
                  <th className="text-left py-2 font-semibold" style={{ color: '#223f61' }}>Produto</th>
                  <th className="text-center py-2 font-semibold" style={{ color: '#223f61' }}>Qtde</th>
                  <th className="text-right py-2 font-semibold" style={{ color: '#223f61' }}>Preço</th>
                  <th className="text-right py-2 font-semibold" style={{ color: '#223f61' }}>Desc.</th>
                  <th className="text-right py-2 font-semibold" style={{ color: '#223f61' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {pedidoItems.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 font-medium" style={{ color: '#223f61' }}>{item.codigo}</td>
                    <td className="py-2" style={{ color: '#223f61' }}>{item.produto}</td>
                    <td className="py-2">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => removerItem(index)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: '#e78b3a' }}
                        >
                          <Minus className="w-3 h-3"/>
                        </button>
                        <span className="w-8 text-center font-medium" style={{ color: '#223f61' }}>{item.qtde}</span>
                        <button
                          onClick={() => adicionarItem(index)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: '#e78b3a' }}
                        >
                          <Plus className="w-3 h-3"/>
                        </button>
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.preco}
                        onChange={(e) => {
                          const newItems = [...pedidoItems];
                          newItems[index].preco = parseFloat(e.target.value) || 0;
                          setPedidoItems(newItems);
                        }}
                        className="w-20 p-1 border rounded text-xs text-right"
                        style={{ borderColor: '#95b4df' }}
                        min="0"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.desconto}
                        onChange={(e) => {
                          const newItems = [...pedidoItems];
                          newItems[index].desconto = parseFloat(e.target.value) || 0;
                          setPedidoItems(newItems);
                        }}
                        className="w-16 p-1 border rounded text-xs text-right"
                        style={{ borderColor: '#95b4df' }}
                      />
                    </td>
                    <td className="py-2 text-right font-medium" style={{ color: '#223f61' }}>
                      R$ ${(item.qtde * item.preco - item.desconto).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {pedidoItems.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      Nenhum item adicionado ainda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Order Notes */}
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Observações do Pedido:</label>
            <textarea
              placeholder="Digite observações sobre o pedido..."
              value={currentOrder.notes}
              onChange={(e) => setCurrentOrder(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full h-16 p-2 border-2 rounded-lg text-sm resize-none"
              style={{ borderColor: '#95b4df' }}
            />
          </div>

          {/* Totals */}
          <div className="mt-3 pt-3 border-t-2" style={{ borderColor: '#95b4df' }}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Subtotal</p>
                <p className="text-lg font-bold" style={{ color: '#223f61' }}>
                  R$ ${(calcularTotal() + pedidoItems.reduce((total, item) => total + item.desconto, 0)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Descontos</p>
                <p className="text-lg font-bold text-red-600">
                  R$ {pedidoItems.reduce((total, item) => total + item.desconto, 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Itens:</p>
                <p className="font-medium">{pedidoItems.reduce((total, item) => total + item.qtde, 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Channel - 3 columns */}
        <div className="col-span-3 space-y-2 flex flex-col">
          {/* Canal de Venda */}
          <div className="bg-white rounded-lg shadow-md p-3">
            <h3 className="text-base font-bold mb-3 flex items-center space-x-2" style={{ color: '#223f61' }}>
              <FileText className="w-5 h-5"/>
              <span>Canal de Venda</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Canal:</label>
                <select
                  value={currentOrder.canal}
                  onChange={(e) => setCurrentOrder(prev => ({ ...prev, canal: e.target.value }))}
                  className="w-full p-2 border-2 rounded-lg text-sm"
                  style={{ borderColor: '#95b4df' }}
                >
                  <option>DISK GAS</option>
                  <option>WhatsApp</option>
                  <option>Presencial</option>
                  <option>Online</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Data do Pedido:</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" style={{ color: '#95b4df' }}/>
                  <input
                    type="date"
                    value={currentOrder.delivery_date}
                    onChange={(e) => setCurrentOrder(prev => ({ ...prev, delivery_date: e.target.value }))}
                    className="flex-1 p-2 border-2 rounded-lg text-sm"
                    style={{ borderColor: '#95b4df' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#223f61' }}>Pagamento:</label>
                <select
                  value={currentOrder.payment_type_id}
                  onChange={(e) => {
                    const paymentType = paymentTypes.find(p => p.id === e.target.value);
                    setCurrentOrder(prev => ({
                      ...prev,
                      payment_type_id: e.target.value,
                      payment_type_name: paymentType ? paymentType.name : ''
                    }));
                  }}
                  className="w-full p-2 border-2 rounded-lg text-sm"
                  style={{ borderColor: '#95b4df' }}
                >
                  <option value="">Selecione...</option>
                  {paymentTypes.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={currentOrder.convenio}
                    onChange={(e) => setCurrentOrder(prev => ({ ...prev, convenio: e.target.checked }))}
                    className="rounded"
                    style={{ accentColor: '#e78b3a' }}
                  />
                  <span style={{ color: '#223f61' }}>Convênio</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={currentOrder.urgente}
                    onChange={(e) => setCurrentOrder(prev => ({ ...prev, urgente: e.target.checked }))}
                    className="rounded"
                    style={{ accentColor: '#e78b3a' }}
                  />
                  <span style={{ color: '#223f61' }}>Urgente</span>
                </label>
              </div>
            </div>
          </div>

          {/* Entregador */}
          <div className="bg-white rounded-lg shadow-md p-3">
            <h3 className="text-base font-bold mb-3 flex items-center space-x-2" style={{ color: '#223f61' }}>
              <Truck className="w-5 h-5"/>
              <span>Entregador</span>
            </h3>
            <select
              value={currentOrder.employee_id}
              onChange={(e) => {
                const employee = employees.find(emp => emp.id === e.target.value);
                setCurrentOrder(prev => ({
                  ...prev,
                  employee_id: e.target.value,
                  employee_name: employee ? employee.name : ''
                }));
              }}
              className="w-full p-2 border-2 rounded-lg text-sm"
              style={{ borderColor: '#95b4df' }}
            >
              <option value="">--- Selecionar Entregador ---</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          {/* Financial Summary */}
          <div className="rounded-lg p-3 flex-1" style={{ backgroundColor: '#e78b3a' }}>
            <div className="space-y-2 text-white text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">
                  R$ ${(calcularTotal() + pedidoItems.reduce((total, item) => total + item.desconto, 0)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Descontos:</span>
                <span className="font-medium">R$ {pedidoItems.reduce((total, item) => total + item.desconto, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Itens:</span>
                <span className="font-medium">{pedidoItems.reduce((total, item) => total + item.qtde, 0)}</span>
              </div>
              <div className="border-t border-orange-300 pt-2 mt-2">
                <div className="flex justify-between font-bold text-base">
                  <span>TOTAL A PAGAR:</span>
                  <span>R$ {calcularTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
             <button 
                onClick={() => window.location.reload()}
                className="w-1/2 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white font-medium hover:scale-105 transition-transform" 
                style={{ backgroundColor: '#dc3545' }}
                disabled={isSaving}
              >
                <XCircle className="w-5 h-5"/>
                <span>Cancelar</span>
              </button>
              <button 
                onClick={handleSaveOrder}
                disabled={!customerFound || pedidoItems.length === 0 || isSaving}
                className="w-1/2 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed" 
                style={{ backgroundColor: '#28a745' }}
              >
                <CheckCircle className="w-5 h-5"/>
                <span>{isSaving ? 'Salvando...' : 'FINALIZAR'}</span>
              </button>
          </div>
        </div>
      </div>

      {/* Footer Actions - Full Width */}
      <div className="bg-white border-t-2 p-3" style={{ borderColor: '#95b4df' }}>
        <div className="flex justify-center">
          <p className="text-sm text-gray-500">Sistema MeuGás - Gestão de Pedidos</p>
        </div>
      </div>
    </div>
  );
}