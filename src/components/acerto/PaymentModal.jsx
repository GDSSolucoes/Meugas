import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { addMonths, format } from "date-fns";
import { User } from "@/entities/User";
import { CashAccount } from "@/entities/CashAccount";
import { PaymentType } from "@/entities/PaymentType";
import { Acquirer } from "@/entities/Acquirer";

export default function PaymentModal({ open, onOpenChange, pedido, onConfirm }) {
  const [paymentType, setPaymentType] = useState("");
  const [paymentOption, setPaymentOption] = useState("vista");
  const [valor, setValor] = useState("0,0000");
  const [desconto, setDesconto] = useState("0,00");
  const [acrescimo, setAcrescimo] = useState("0,00");
  const [caixa, setCaixa] = useState("");
  const [cashAccounts, setCashAccounts] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [parcelas, setParcelas] = useState([]);
  const [firstDueDate, setFirstDueDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [installmentCount, setInstallmentCount] = useState(1);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bandeiras, setBandeiras] = useState([]);
  const [cartoesData, setCartoesData] = useState([]);
  const [activeTab, setActiveTab] = useState('parcelas');
  const [hasAddedCardPayment, setHasAddedCardPayment] = useState(false);
  const [showCardDataWarning, setShowCardDataWarning] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const selectedPaymentType = paymentTypes.find(t => t.id === paymentType);
  const isCardPayment = selectedPaymentType && selectedPaymentType.type?.includes('cartao');
  
  // Debug detalhado
  if (paymentType) {
    console.log('🔍 DEBUG DETALHADO PaymentModal:', {
      paymentType,
      selectedPaymentTypeName: selectedPaymentType?.name,
      selectedPaymentTypeType: selectedPaymentType?.type,
      isCardPayment,
      allPaymentTypes: paymentTypes.map(t => ({ id: t.id, name: t.name, type: t.type }))
    });
  }

  useEffect(() => {
    if (pedido) {
      const valorFormatado = (pedido.totalAmount || 0).toFixed(4).replace('.', ',');
      setValor(valorFormatado);
      // Resetar todos os dados ao abrir o modal
      setPayments([]);
      setParcelas([]);
      setCartoesData([]);
      setHasAddedCardPayment(false);
      setDesconto("0,00");
      setAcrescimo("0,00");
    }
  }, [pedido]);

  useEffect(() => {
    if (paymentType && paymentTypes.length > 0) {
      const selectedType = paymentTypes.find(t => t.id === paymentType);
      if (selectedType) {
        // Define automaticamente vista ou prazo baseado no maxInstallments
        setPaymentOption(selectedType.maxInstallments > 1 ? 'prazo' : 'vista');
      }
    }
  }, [paymentType, paymentTypes]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await User.me();
        const [accounts, types, acquirers] = await Promise.all([
          CashAccount.filter({ 
            companyId: user.companyId,
            active: true 
          }),
          PaymentType.filter({ 
            companyId: user.companyId,
            active: true 
          }),
          Acquirer.filter({ 
            companyId: user.companyId,
            active: true 
          }).catch(() => [])
        ]);
        setCashAccounts(accounts);
        setPaymentTypes(types);
        setBandeiras(acquirers);
        if (accounts.length > 0 && !caixa) {
          setCaixa(accounts[0].id);
        }
        if (types.length > 0 && !paymentType) {
          const dinheiro = types.find(t => t.type === 'dinheiro');
          if (dinheiro) {
            setPaymentType(dinheiro.id);
            setPaymentOption(dinheiro.maxInstallments > 1 ? 'prazo' : 'vista');
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    if (open) {
      loadData();
    }
  }, [open]);

  const totalVenda = pedido?.totalAmount || 0;
  const descontoValue = parseFloat(desconto.replace(',', '.')) || 0;
  const acrescimoValue = parseFloat(acrescimo.replace(',', '.')) || 0;
  const totalAReceber = totalVenda - descontoValue + acrescimoValue;
  const totalRecebido = payments.reduce((sum, p) => sum + (p.valor || 0), 0);
  const saldoRestante = totalAReceber - totalRecebido;
  const troco = totalRecebido > totalAReceber ? totalRecebido - totalAReceber : 0;

  const formatCurrency = (value) => {
    return value.toFixed(2).replace('.', ',');
  };

  const isConfirmEnabled = saldoRestante <= 0;

  const calculateInstallments = () => {
    if (paymentOption !== 'prazo' || !firstDueDate || installmentCount <= 0) {
      return [];
    }
    
    const valorPagamento = parseFloat(valor.replace(',', '.')) || 0;
    const valorParcela = valorPagamento / installmentCount;
    const selectedType = paymentTypes.find(t => t.id === paymentType);
    const daysInterval = selectedType?.daysInterval || 30;
    
    const parcelas = [];
    for (let i = 0; i < installmentCount; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setDate(dueDate.getDate() + (i * daysInterval));
      parcelas.push({
        numero: i + 1,
        vencimento: dueDate.toISOString().split('T')[0],
        valor: valorParcela
      });
    }
    return parcelas;
  };

  useEffect(() => {
    // Sincronizar cartoesData com todas as parcelas quando houver parcelas
    if (parcelas.length > 0 && hasAddedCardPayment) {
      const newCartoesData = parcelas.map((parcela) => ({
        nrParcela: parcela.numero,
        bandeira: '',
        codigoLiberacao: ''
      }));
      setCartoesData(newCartoesData);
    }
  }, [parcelas, hasAddedCardPayment]);

  const handleBandeiraChange = (index, bandeira) => {
    const newCartoesData = [...cartoesData];
    newCartoesData[index] = {
      ...newCartoesData[index],
      bandeira,
      codigoLiberacao: bandeira ? newCartoesData[index].codigoLiberacao : ''
    };
    setCartoesData(newCartoesData);
  };

  const handleCodigoChange = (index, codigo) => {
    const newCartoesData = [...cartoesData];
    newCartoesData[index] = {
      ...newCartoesData[index],
      codigoLiberacao: codigo
    };
    setCartoesData(newCartoesData);
  };

  const handleAddPayment = () => {
    const valorPagamento = parseFloat(valor.replace(',', '.')) || 0;
    if (valorPagamento > 0) {
      const newPayment = {
        id: Date.now(),
        tipo: paymentType,
        descricao: `${selectedPaymentType?.name || 'Pagamento'} - ${isCardPayment || paymentOption === 'prazo' ? 'A Prazo' : 'À Vista'}`,
        valor: valorPagamento,
        caixaId: caixa
      };
      setPayments([...payments, newPayment]);
      
      if (paymentOption === 'prazo') {
        const newParcelas = calculateInstallments();
        // Acumular parcelas ao invés de substituir
        const parcelaOffset = parcelas.length;
        const parcelasAjustadas = newParcelas.map(p => ({
          ...p,
          numero: p.numero + parcelaOffset,
          paymentId: newPayment.id
        }));
        setParcelas([...parcelas, ...parcelasAjustadas]);
        
        // Se for cartão, marcar que adicionou pagamento em cartão
        if (isCardPayment) {
          setHasAddedCardPayment(true);
        }
      }
    }
  };

  const handleDeletePayment = () => {
    if (selectedPaymentId) {
      setPayments(payments.filter(p => p.id !== selectedPaymentId));
      setParcelas([]); // Limpa todas as parcelas ao excluir qualquer forma de pagamento
      setCartoesData([]); // Limpa os dados de cartões
      setHasAddedCardPayment(false); // Reseta o estado de cartão adicionado
      setSelectedPaymentId(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Delete' && selectedPaymentId) {
      setShowDeleteConfirm(true);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPaymentId]);

  const handleCancelConfirm = () => {
    // Limpar todos os dados de pagamento
    setPayments([]);
    setParcelas([]);
    setCartoesData([]);
    setHasAddedCardPayment(false);
    setDesconto("0,00");
    setAcrescimo("0,00");
    setValor((pedido?.totalAmount || 0).toFixed(4).replace('.', ','));
    setPaymentType("");
    setCaixa(cashAccounts.length > 0 ? cashAccounts[0].id : "");
    setShowCancelConfirm(false);
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (!isConfirmEnabled) return;
    
    // Validar dados de cartão se houver pagamento em cartão
    if (hasAddedCardPayment && cartoesData.length > 0) {
      const hasIncompleteData = cartoesData.some(cartao => !cartao.bandeira || !cartao.codigoLiberacao);
      if (hasIncompleteData) {
        setShowCardDataWarning(true);
        return;
      }
    }
    
    if (onConfirm) {
      onConfirm({
        pedido,
        payments,
        parcelas,
        totalVenda,
        desconto: descontoValue,
        acrescimo: acrescimoValue,
        totalAReceber,
        totalRecebido,
        troco
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pagamento</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6">
          {/* SEÇÃO ESQUERDA - 1 coluna */}
          <div className="col-span-1 flex flex-col">
            <div className="space-y-4">
              <div>
                <Label className="text-sm mb-1 block">Tipo de Pagamento:</Label>
                <Select value={paymentType} onValueChange={(value) => {
                  setPaymentType(value);
                  const selectedType = paymentTypes.find(t => t.id === value);
                  if (selectedType) {
                    // Se for cartão, sempre A Prazo
                    if (selectedType.type === 'cartao_debito' || selectedType.type === 'cartao_credito') {
                      setPaymentOption('prazo');
                    } else {
                      setPaymentOption(selectedType.maxInstallments > 1 ? 'prazo' : 'vista');
                    }
                  }
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <RadioGroup value={paymentOption} className="flex gap-6 pointer-events-none opacity-60">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vista" id="vista-auto" disabled />
                    <Label htmlFor="vista-auto">Vista</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prazo" id="prazo-auto" disabled />
                    <Label htmlFor="prazo-auto">Prazo</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-gray-500 italic">
                  * Definido automaticamente pelo cadastro do tipo de pagamento
                </p>
              </div>

              <div>
                <Label className="text-sm font-bold mb-1 block">VALOR</Label>
                <Input
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm mb-1 block">Desconto:</Label>
                  <Input
                    value={desconto}
                    onChange={(e) => setDesconto(e.target.value)}
                    className="w-full text-right"
                  />
                </div>
                <div>
                  <Label className="text-sm mb-1 block">Acrescimo</Label>
                  <Input
                    value={acrescimo}
                    onChange={(e) => setAcrescimo(e.target.value)}
                    className="w-full text-right"
                  />
                </div>
              </div>

              {paymentOption === 'prazo' && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <Label className="text-sm mb-1 block">Data 1ª Parcela</Label>
                    <Input
                      type="date"
                      value={firstDueDate}
                      onChange={(e) => setFirstDueDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-1 block">Nº de Parcelas</Label>
                    <Input
                      type="number"
                      min="1"
                      value={installmentCount}
                      onChange={(e) => setInstallmentCount(parseInt(e.target.value) || 1)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleAddPayment} className="text-white" style={{ backgroundColor: '#e78b3a' }}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
              </div>

            <div className="mt-auto space-y-4 pt-6">
              <div>
                <Label className="text-sm mb-1 block">Caixa</Label>
                <Select value={caixa} onValueChange={setCaixa}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cashAccounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Total Venda:</span>
                  <span className="font-medium">{formatCurrency(totalVenda)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Desconto:</span>
                  <span className="font-medium">{formatCurrency(descontoValue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Acréscimo:</span>
                  <span className="font-medium">{formatCurrency(acrescimoValue)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total a Receber:</span>
                  <span>{formatCurrency(totalAReceber)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Recebido:</span>
                  <span className="font-medium">{formatCurrency(totalRecebido)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Saldo Restante:</span>
                  <span className={saldoRestante > 0 ? 'text-red-600' : 'text-green-600'}>
                    {formatCurrency(saldoRestante)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Troco:</span>
                  <span className="font-medium text-blue-600">{formatCurrency(troco)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO DIREITA - 2 colunas */}
          <div className="col-span-2 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Label className="text-sm font-bold">Formas de Pagamento</Label>
              <span className="text-xs text-gray-500 italic">(Selecione e pressione DEL para excluir)</span>
            </div>
            <div className="h-80 overflow-auto border rounded mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Id</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-24 text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-400 h-32">
                        Nenhum pagamento adicionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow 
                        key={payment.id}
                        className={`cursor-pointer hover:bg-gray-50 ${selectedPaymentId === payment.id ? 'bg-blue-100' : ''}`}
                        onClick={() => setSelectedPaymentId(payment.id)}
                      >
                        <TableCell className="text-xs">{payment.id.toString().slice(-4)}</TableCell>
                        <TableCell className="text-xs">{payment.descricao}</TableCell>
                        <TableCell className="text-xs text-right">{formatCurrency(payment.valor)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex-1 flex flex-col">
              {hasAddedCardPayment ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <TabsList className="mb-2 justify-start">
                    <TabsTrigger value="parcelas" className="text-xs">PARCELA(S)</TabsTrigger>
                    <TabsTrigger value="cartoes" className="text-xs">CARTÃO(ES)</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="parcelas" className="flex-1 overflow-auto border rounded mt-0">
                    <div className="h-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-24">Nr. Parcela</TableHead>
                            <TableHead className="w-32">Dt. Vencimento</TableHead>
                            <TableHead className="w-28 text-right">Vlr Receber</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parcelas.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-gray-400 h-28">
                                Nenhuma parcela
                              </TableCell>
                            </TableRow>
                          ) : (
                            parcelas.map((parcela, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs">{parcela.numero}</TableCell>
                                <TableCell className="text-xs">
                                  {new Date(parcela.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </TableCell>
                                <TableCell className="text-xs text-right">{formatCurrency(parcela.valor)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="cartoes" className="flex-1 overflow-auto border rounded mt-0">
                    <div className="h-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-24">Nr. Parcela</TableHead>
                            <TableHead className="w-40">Bandeira</TableHead>
                            <TableHead>Codigo Liberação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cartoesData.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-gray-400 h-28">
                                Configure as parcelas primeiro
                              </TableCell>
                            </TableRow>
                          ) : (
                            cartoesData.map((cartao, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs text-center">{cartao.nrParcela}</TableCell>
                                <TableCell className="p-1">
                                  <Select 
                                    value={cartao.bandeira} 
                                    onValueChange={(value) => handleBandeiraChange(idx, value)}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue placeholder="Selecione a Bandeira" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {bandeiras.map(b => (
                                        <SelectItem key={b.id} value={b.id} className="text-xs">
                                          {b.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="p-1">
                                  <Input
                                    value={cartao.codigoLiberacao}
                                    onChange={(e) => handleCodigoChange(idx, e.target.value)}
                                    disabled={!cartao.bandeira}
                                    placeholder="Digite o código"
                                    className="h-7 text-xs"
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <>
                  <Label className="text-sm font-bold mb-2 block">PARCELA(S)</Label>
                  <div className="flex-1 overflow-auto border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Nr. Parcela</TableHead>
                          <TableHead className="w-32">Dt. Vencimento</TableHead>
                          <TableHead className="w-28 text-right">Vlr Receber</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parcelas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-gray-400 h-28">
                              Nenhuma parcela
                            </TableCell>
                          </TableRow>
                        ) : (
                          parcelas.map((parcela, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-xs">{parcela.numero}</TableCell>
                              <TableCell className="text-xs">
                                {new Date(parcela.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell className="text-xs text-right">{formatCurrency(parcela.valor)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RODAPÉ */}
        <div className="flex justify-end items-center pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCancelConfirm(true)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!isConfirmEnabled}
              className="text-white"
              style={{ backgroundColor: isConfirmEnabled ? '#223f61' : '#94a3b8' }}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center">Deseja realmente excluir esta forma de pagamento?</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDeletePayment}
              className="text-white"
              style={{ backgroundColor: '#e78b3a' }}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Aviso - Dados de Cartão Incompletos */}
      <Dialog open={showCardDataWarning} onOpenChange={setShowCardDataWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Dados do Cartão Incompletos</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center">Por favor, preencha a bandeira e o código de liberação para todas as parcelas do cartão antes de confirmar.</p>
          </div>
          <div className="flex justify-center">
            <Button 
              onClick={() => {
                setShowCardDataWarning(false);
                setActiveTab('cartoes');
              }}
              className="text-white"
              style={{ backgroundColor: '#e78b3a' }}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Cancelamento */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Cancelamento</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center">Deseja realmente cancelar? Todas as informações de pagamento serão perdidas.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
              Não
            </Button>
            <Button 
              onClick={handleCancelConfirm}
              className="text-white"
              style={{ backgroundColor: '#e78b3a' }}
            >
              Sim, Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </Dialog>
      );
      }