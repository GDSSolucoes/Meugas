import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit2, Save, X, DollarSign, CreditCard, FileText, Calendar } from "lucide-react";
import { format, addDays } from "date-fns";

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  totalAmount, 
  paymentTypes, 
  cashAccounts,
  saleNumber,
  customerName,
  saleDate
}) {
  const [payments, setPayments] = useState([]);
  const [currentPayment, setCurrentPayment] = useState({
    paymentTypeId: '',
    paymentTypeName: '',
    amount: totalAmount,
    installments: 1,
    cashAccountId: '',
    installmentsDetails: []
  });
  const [observations, setObservations] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [showInstallmentsGrid, setShowInstallmentsGrid] = useState(false);
  
  // NOVO: Estado separado para guardar o valor fixo quando gerar parcelas
  const [fixedPaymentAmount, setFixedPaymentAmount] = useState(null);

  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const remaining = totalAmount - totalPaid;
  const isComplete = Math.abs(remaining) < 0.01;
  const isOverpaid = remaining < -0.01;

  const selectedPaymentType = paymentTypes.find(pt => pt.id === currentPayment.paymentTypeId);
  const isCashPayment = selectedPaymentType && ['dinheiro', 'pix', 'cartaoDebito'].includes(selectedPaymentType.type);
  const isInstallmentPayment = selectedPaymentType && !isCashPayment && currentPayment.installments > 1;

  // Gerar parcelas quando o usuário clicar no botão
  const handleGenerateInstallments = () => {
    if (!isInstallmentPayment) return;

    // GUARDAR o valor fixo em um estado separado
    setFixedPaymentAmount(currentPayment.amount);

    const installmentAmount = currentPayment.amount / currentPayment.installments;
    const daysInterval = selectedPaymentType.daysInterval || 30;
    const startDate = new Date(saleDate || new Date());

    const installmentsDetails = [];
    for (let i = 0; i < currentPayment.installments; i++) {
      const dueDate = addDays(startDate, daysInterval * i);
      installmentsDetails.push({
        number: i + 1,
        amount: installmentAmount,
        dueDate: format(dueDate, 'yyyy-MM-dd')
      });
    }

    setCurrentPayment(prev => ({
      ...prev,
      installmentsDetails: installmentsDetails
    }));
    setShowInstallmentsGrid(true);
  };

  // Atualizar valor de uma parcela e recalcular as outras
  const updateInstallmentAmount = (index, newAmount) => {
    // Usar o valor fixo guardado no estado separado
    const fixedTotal = fixedPaymentAmount;
    
    if (!fixedTotal) return;

    const newInstallments = [...currentPayment.installmentsDetails];
    const parsedNewAmount = parseFloat(newAmount) || 0;

    if (parsedNewAmount < 0) {
        alert('O valor da parcela não pode ser negativo.');
        return;
    }
    
    if (parsedNewAmount > fixedTotal) {
      alert(`O valor da parcela não pode ser maior que o total do pagamento (R$ ${fixedTotal.toFixed(2)})`);
      return;
    }
    
    // Atualizar o valor da parcela editada
    newInstallments[index].amount = parsedNewAmount;
    
    // Quanto sobra para as outras parcelas
    const remainingForOthers = fixedTotal - parsedNewAmount;
    
    // Distribuir o restante nas outras parcelas
    const otherInstallmentsCount = newInstallments.length - 1;
    if (otherInstallmentsCount > 0) {
      const amountPerOther = remainingForOthers / otherInstallmentsCount;
      
      newInstallments.forEach((inst, i) => {
        if (i !== index) {
          inst.amount = amountPerOther;
        }
      });
    }
    
    // Atualizar APENAS installmentsDetails
    setCurrentPayment(prev => ({
      ...prev,
      installmentsDetails: newInstallments
    }));
  };

  // Atualizar data de vencimento de uma parcela
  const updateInstallmentDate = (index, newDate) => {
    const newInstallments = [...currentPayment.installmentsDetails];
    newInstallments[index].dueDate = newDate;
    
    setCurrentPayment(prev => ({
      ...prev,
      installmentsDetails: newInstallments
    }));
  };

  const handleAddPayment = () => {
    if (!currentPayment.paymentTypeId) {
      alert('Selecione uma forma de pagamento');
      return;
    }
    
    if (!currentPayment.amount || currentPayment.amount <= 0) {
      alert('Informe um valor válido');
      return;
    }

    const paymentType = paymentTypes.find(pt => pt.id === currentPayment.paymentTypeId);
    const isCash = ['dinheiro', 'pix', 'cartaoDebito'].includes(paymentType?.type);

    if (isCash && !currentPayment.cashAccountId) {
      alert('Selecione uma conta/caixa para pagamento à vista');
      return;
    }

    // Validar total das parcelas se for parcelado
    if (isInstallmentPayment && currentPayment.installmentsDetails.length > 0) {
      const totalInstallments = currentPayment.installmentsDetails.reduce((sum, inst) => sum + inst.amount, 0);
      // Usar o fixedPaymentAmount para validação
      const amountToValidate = fixedPaymentAmount || currentPayment.amount;
      if (Math.abs(totalInstallments - amountToValidate) > 0.01) {
        alert(`A soma das parcelas (R$ ${totalInstallments.toFixed(2)}) deve ser igual ao valor total do pagamento (R$ ${amountToValidate.toFixed(2)})`);
        return;
      }
    }

    if (editingIndex !== null) {
      const newPayments = [...payments];
      newPayments[editingIndex] = { ...currentPayment };
      setPayments(newPayments);
      setEditingIndex(null);
    } else {
      setPayments([...payments, { ...currentPayment }]);
    }

    // Reset form
    const newRemaining = totalAmount - (totalPaid + currentPayment.amount);
    setCurrentPayment({
      paymentTypeId: '',
      paymentTypeName: '',
      amount: newRemaining > 0 ? newRemaining : 0,
      installments: 1,
      cashAccountId: '',
      installmentsDetails: []
    });
    setShowInstallmentsGrid(false);
    setFixedPaymentAmount(null); // Resetar o valor fixo
  };

  const handleEditPayment = (index) => {
    setCurrentPayment(payments[index]);
    setEditingIndex(index);
    if (payments[index].installmentsDetails && payments[index].installmentsDetails.length > 0) {
      setShowInstallmentsGrid(true);
      setFixedPaymentAmount(payments[index].amount); // Guardar o valor fixo ao editar
    }
  };

  const handleDeletePayment = (index) => {
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments);
  };

  const handleConfirm = () => {
    if (!isComplete) {
      alert('O total dos pagamentos deve ser igual ao valor da venda');
      return;
    }
    onConfirm(payments, observations);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1400px] max-h-[90vh] p-0 overflow-hidden">
        <style>{`
          .payment-modal-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto auto 1fr auto;
            gap: 0;
            height: 85vh;
            background: white;
          }

          .payment-header {
            grid-column: 1 / -1;
            background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%);
            color: white;
            padding: 24px;
          }

          .payment-header h2 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .sale-info {
            display: flex;
            gap: 24px;
            font-size: 14px;
            opacity: 0.9;
          }

          .payment-config-panel {
            grid-column: 1;
            grid-row: 2;
            background: #F3F4F6;
            padding: 24px;
            border-right: 1px solid #E5E7EB;
            overflow-y: auto;
          }

          .financial-summary {
            grid-column: 1;
            grid-row: 3;
            background: white;
            padding: 24px;
            border-right: 1px solid #E5E7EB;
            border-top: 1px solid #E5E7EB;
          }

          .payments-list-panel {
            grid-column: 2;
            grid-row: 2 / 4;
            background: white;
            padding: 24px;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
          }

          .observations-section {
            grid-column: 1 / -1;
            grid-row: 4;
            background: white;
            padding: 24px;
            border-top: 1px solid #E5E7EB;
            overflow-y: auto;
          }

          .form-actions {
            grid-column: 1 / -1;
            grid-row: 5;
            background: #F3F4F6;
            padding: 20px 24px;
            border-top: 1px solid #E5E7EB;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
          }

          .panel-title {
            color: #1E3A8A;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .field-group {
            margin-bottom: 16px;
          }

          .field-group label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            font-size: 14px;
          }

          .installments-grid {
            background: #FEF3C7;
            border: 2px solid #F59E0B;
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
          }

          .installments-grid h4 {
            color: #F59E0B;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .installments-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 6px;
            overflow: hidden;
          }

          .installments-table th {
            background: #F59E0B;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-size: 13px;
            font-weight: 600;
          }

          .installments-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #FEF3C7;
            font-size: 13px;
          }

          .installments-table input {
            width: 100%;
            padding: 6px 8px;
            border: 1px solid #D1D5DB;
            border-radius: 4px;
            font-size: 13px;
          }

          .installments-table input:focus {
            outline: none;
            border-color: #F59E0B;
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1);
          }

          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #F3F4F6;
          }

          .summary-item label {
            font-weight: 600;
            margin: 0;
          }

          .summary-item .value {
            font-weight: 700;
            font-size: 16px;
          }

          .summary-item.highlight {
            background: linear-gradient(135deg, #EBF8FF 0%, #DBEAFE 100%);
            padding: 16px;
            border-radius: 6px;
            border: 2px solid #1E3A8A;
            margin: 16px 0;
          }

          .summary-item.highlight .value {
            font-size: 20px;
            color: #1E3A8A;
          }

          .payment-status {
            padding: 12px 16px;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .payment-status.pending {
            background: #FEF3C7;
            color: #F59E0B;
          }

          .payment-status.complete {
            background: #D1FAE5;
            color: #10B981;
          }

          .payment-status.overpaid {
            background: #FEE2E2;
            color: #EF4444;
          }

          .payments-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            overflow: hidden;
          }

          .payments-table th {
            background: #1E3A8A;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
          }

          .payments-table td {
            padding: 12px 8px;
            border-bottom: 1px solid #F3F4F6;
            font-size: 13px;
          }

          .payments-table tr:hover {
            background: #F9FAFB;
          }

          .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #9CA3AF;
          }

          .table-actions {
            display: flex;
            gap: 8px;
          }

          .btn-table-action {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s;
          }

          .btn-edit {
            color: #F59E0B;
          }

          .btn-edit:hover {
            background: #FEF3C7;
          }

          .btn-delete {
            color: #EF4444;
          }

          .btn-delete:hover {
            background: #FEE2E2;
          }

          .installment-totals {
            background: white;
            padding: 12px;
            border-radius: 6px;
            margin-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #D1D5DB;
          }

          .installment-totals strong {
            color: #1F2937;
          }

          .installment-totals .total-value {
            font-size: 16px;
            font-weight: 700;
            color: #10B981;
          }

          .locked-field {
            background: #F3F4F6 !important;
            cursor: not-allowed;
            opacity: 0.6;
          }
        `}</style>

        <div className="payment-modal-content">
          {/* Header */}
          <div className="payment-header">
            <h2>💳 Registro de Pagamentos</h2>
            <div className="sale-info">
              <span>Venda: {saleNumber}</span>
              <span>Cliente: {customerName}</span>
              <span>Total: R$ {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Painel de Configuração */}
          <div className="payment-config-panel">
            <h3 className="panel-title">
              <CreditCard className="w-5 h-5" />
              Adicionar Pagamento
            </h3>

            <div className="field-group">
              <Label>Forma de Pagamento *</Label>
              <Select 
                value={currentPayment.paymentTypeId} 
                onValueChange={(value) => {
                  const pt = paymentTypes.find(p => p.id === value);
                  setCurrentPayment(prev => ({
                    ...prev,
                    paymentTypeId: value,
                    paymentTypeName: pt?.name || '',
                    installments: 1,
                    cashAccountId: '',
                    installmentsDetails: []
                  }));
                  setShowInstallmentsGrid(false);
                  setFixedPaymentAmount(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map(pt => (
                    <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isCashPayment && (
              <div className="field-group">
                <Label>Conta/Caixa *</Label>
                <Select 
                  value={currentPayment.cashAccountId} 
                  onValueChange={(value) => setCurrentPayment(prev => ({...prev, cashAccountId: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cashAccounts.map(ca => (
                      <SelectItem key={ca.id} value={ca.id}>{ca.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="field-group">
              <Label>Valor * {fixedPaymentAmount !== null && <span style={{color: '#EF4444', fontSize: '12px'}}>(TRAVADO)</span>}</Label>
              <Input
                type="number"
                step="0.01"
                value={currentPayment.amount}
                onChange={(e) => {
                  if (fixedPaymentAmount !== null) {
                    alert('Não é possível alterar o valor após gerar as parcelas. Cancele e crie novamente.');
                    return;
                  }
                  setCurrentPayment(prev => ({...prev, amount: parseFloat(e.target.value) || 0}));
                }}
                placeholder="0,00"
                className={fixedPaymentAmount !== null ? 'locked-field' : ''}
                readOnly={fixedPaymentAmount !== null}
              />
            </div>

            {!isCashPayment && (
              <div className="field-group">
                <Label>Parcelas</Label>
                <Input
                  type="number"
                  min="1"
                  value={currentPayment.installments}
                  onChange={(e) => {
                    setCurrentPayment(prev => ({...prev, installments: parseInt(e.target.value) || 1}));
                    setShowInstallmentsGrid(false);
                    setFixedPaymentAmount(null);
                  }}
                  disabled={fixedPaymentAmount !== null}
                  className={fixedPaymentAmount !== null ? 'locked-field' : ''}
                />
              </div>
            )}

            {/* Botão para gerar parcelas */}
            {isInstallmentPayment && !showInstallmentsGrid && (
              <Button 
                onClick={handleGenerateInstallments}
                className="w-full mt-2 bg-blue-500 hover:bg-blue-600"
              >
                📅 Gerar Detalhamento das Parcelas
              </Button>
            )}

            {/* Grid de Parcelas */}
            {showInstallmentsGrid && currentPayment.installmentsDetails.length > 0 && (
              <div className="installments-grid">
                <h4>
                  <Calendar className="w-4 h-4" />
                  Detalhamento das Parcelas
                </h4>
                <table className="installments-table">
                  <thead>
                    <tr>
                      <th>Parc.</th>
                      <th>Vencimento</th>
                      <th>Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPayment.installmentsDetails.map((inst, index) => (
                      <tr key={index}>
                        <td>{inst.number}ª</td>
                        <td>
                          <Input
                            type="date"
                            value={inst.dueDate}
                            onChange={(e) => updateInstallmentDate(index, e.target.value)}
                          />
                        </td>
                        <td>
                          <Input
                            type="number"
                            step="0.01"
                            value={inst.amount.toFixed(2)}
                            onChange={(e) => updateInstallmentAmount(index, parseFloat(e.target.value) || 0)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="installment-totals">
                  <strong>Total das Parcelas:</strong>
                  <span className="total-value">
                    R$ {currentPayment.installmentsDetails.reduce((sum, inst) => sum + inst.amount, 0).toFixed(2)}
                  </span>
                </div>
                <div className="installment-totals" style={{marginTop: '8px', background: '#FEF3C7', borderColor: '#F59E0B'}}>
                  <strong>Valor Total do Pagamento (FIXO):</strong>
                  <span className="total-value" style={{color: '#F59E0B'}}>
                    R$ {fixedPaymentAmount !== null ? fixedPaymentAmount.toFixed(2) : currentPayment.amount.toFixed(2)}
                  </span>
                </div>
                <Button 
                  onClick={() => {
                    setShowInstallmentsGrid(false);
                    setFixedPaymentAmount(null);
                    setCurrentPayment(prev => ({...prev, installmentsDetails: []}));
                  }}
                  className="w-full mt-2"
                  variant="outline"
                >
                  🔄 Reajustar Parcelas
                </Button>
              </div>
            )}

            <Button 
              onClick={handleAddPayment}
              className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {editingIndex !== null ? 'Atualizar Pagamento' : 'Adicionar Pagamento'}
            </Button>
          </div>

          {/* Resumo Financeiro */}
          <div className="financial-summary">
            <h3 className="panel-title">
              <DollarSign className="w-5 h-5" />
              Resumo Financeiro
            </h3>

            <div className="summary-item">
              <label>Valor Total:</label>
              <span className="value">R$ {totalAmount.toFixed(2)}</span>
            </div>

            <div className="summary-item">
              <label>Total Pago:</label>
              <span className="value" style={{color: '#10B981'}}>R$ {totalPaid.toFixed(2)}</span>
            </div>

            <div className="summary-item highlight">
              <label>Falta Pagar:</label>
              <span className="value" style={{color: remaining > 0.01 ? '#EF4444' : '#10B981'}}>
                R$ {remaining.toFixed(2)}
              </span>
            </div>

            <div className={`payment-status ${isOverpaid ? 'overpaid' : isComplete ? 'complete' : 'pending'}`}>
              {isOverpaid ? '⚠️ Pagamento excedente!' : isComplete ? '✅ Pagamento completo' : '⏳ Pagamento pendente'}
            </div>
          </div>

          {/* Lista de Pagamentos */}
          <div className="payments-list-panel">
            <h3 className="panel-title">
              <FileText className="w-5 h-5" />
              Pagamentos Registrados ({payments.length})
            </h3>

            {payments.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum pagamento registrado ainda</p>
              </div>
            ) : (
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Forma</th>
                    <th>Conta/Caixa</th>
                    <th>Valor</th>
                    <th>Parcelas</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => {
                    const account = cashAccounts.find(ca => ca.id === payment.cashAccountId);
                    return (
                      <tr key={index}>
                        <td>{payment.paymentTypeName}</td>
                        <td>{account?.name || '-'}</td>
                        <td>R$ {payment.amount.toFixed(2)}</td>
                        <td>{payment.installments}x</td>
                        <td>
                          <div className="table-actions">
                            <button className="btn-table-action btn-edit" onClick={() => handleEditPayment(index)}>
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="btn-table-action btn-delete" onClick={() => handleDeletePayment(index)}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Observações */}
          <div className="observations-section">
            <h3 className="panel-title">
              <FileText className="w-5 h-5" />
              Observações do Pagamento
            </h3>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              placeholder="Digite observações sobre o pagamento..."
            />
          </div>

          {/* Ações */}
          <div className="form-actions">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!isComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Confirmar e Finalizar Venda
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}