import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Printer, X, LogOut, FileText } from "lucide-react";
import { CashMovement } from "@/entities/CashMovement";
import { CashAccount } from "@/entities/CashAccount";
import { ContasAPagar } from "@/entities/ContasAPagar";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, isFuture } from "date-fns";

export default function PagamentoModal({
  open,
  onOpenChange,
  contas = [],
  cashAccounts = [],
  currentUser,
  onPaymentComplete
}) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Dados do pagamento
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [desconto, setDesconto] = useState('');
  const [jurosMulta, setJurosMulta] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [observacoes, setObservacoes] = useState('');

  // Campos condicionais
  const [bancoDestino, setBancoDestino] = useState('');
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [numeroTransferencia, setNumeroTransferencia] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState('');
  const [idTransacaoPix, setIdTransacaoPix] = useState('');
  const [numeroCheque, setNumeroCheque] = useState('');
  const [dataCompensacao, setDataCompensacao] = useState('');
  const [bandeira, setBandeira] = useState('');
  const [numeroTransacaoCartao, setNumeroTransacaoCartao] = useState('');
  const [numeroParcelas, setNumeroParcelas] = useState(1);

  // Calcular valores
  const valorTotal = contas.reduce((sum, c) => sum + (c.amount || 0), 0);
  const descontoNum = parseFloat(desconto.replace(',', '.')) || 0;
  const jurosMultaNum = parseFloat(jurosMulta.replace(',', '.')) || 0;
  const valorFinal = valorTotal - descontoNum + jurosMultaNum;

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
      setSelectedAccountId(cashAccounts.length > 0 ? cashAccounts[0].id : '');
      setDesconto('');
      setJurosMulta('');
      setFormaPagamento('dinheiro');
      setObservacoes('');
      setPaymentConfirmed(false);
      // Limpar campos condicionais
      setBancoDestino('');
      setAgencia('');
      setConta('');
      setNumeroTransferencia('');
      setChavePix('');
      setTipoChavePix('');
      setIdTransacaoPix('');
      setNumeroCheque('');
      setDataCompensacao('');
      setBandeira('');
      setNumeroTransacaoCartao('');
      setNumeroParcelas(1);
    }
  }, [open, cashAccounts]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const handleConfirmarPagamento = async () => {
    // Validações
    if (!paymentDate) {
      toast({ title: "Erro", description: "Informe a data do pagamento.", variant: "destructive" });
      return;
    }
    if (isFuture(new Date(paymentDate + 'T23:59:59'))) {
      toast({ title: "Erro", description: "A data do pagamento não pode ser futura.", variant: "destructive" });
      return;
    }
    if (!selectedAccountId) {
      toast({ title: "Erro", description: "Selecione a conta para débito.", variant: "destructive" });
      return;
    }
    if (valorFinal <= 0) {
      toast({ title: "Erro", description: "O valor final deve ser maior que zero.", variant: "destructive" });
      return;
    }

    const contaSelecionada = cashAccounts.find(acc => acc.id === selectedAccountId);
    if (!contaSelecionada) {
      toast({ title: "Erro", description: "Conta não encontrada.", variant: "destructive" });
      return;
    }

    // Verificar saldo
    if ((contaSelecionada.balance || 0) < valorFinal) {
      toast({ title: "Erro", description: "Saldo insuficiente na conta selecionada.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      // Processar cada conta
      for (const contaPagar of contas) {
        if (contaPagar.status === 'pago') continue;

        // Criar movimento de caixa (despesa)
        await CashMovement.create({
          cashAccountId: contaSelecionada.id,
          cashAccountName: contaSelecionada.name,
          type: 'despesa',
          description: `Pagamento: ${contaPagar.description || contaPagar.supplierName}`,
          amount: contaPagar.amount,
          personId: contaPagar.supplierId,
          personName: contaPagar.supplierName,
          movementDate: paymentDate,
          paymentTypeName: formaPagamento,
          notes: observacoes,
          companyId: currentUser.companyId,
          companyName: currentUser.companyName,
          createdByName: currentUser.fullName,
        });

        // Atualizar status da conta
        await ContasAPagar.update(contaPagar.id, {
          status: 'pago',
          paymentDate: paymentDate,
        });
      }

      // Atualizar saldo da conta
      const novoSaldo = (contaSelecionada.balance || 0) - valorFinal;
      await CashAccount.update(selectedAccountId, { balance: novoSaldo });

      toast({ title: "Sucesso", description: `${contas.length} conta(s) paga(s) com sucesso!` });
      setPaymentConfirmed(true);

      if (onPaymentComplete) {
        onPaymentComplete(selectedAccountId);
      }
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      toast({ title: "Erro", description: "Não foi possível processar o pagamento.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImprimir = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante de Pagamento</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 30px; font-size: 12px; }
          h1 { text-align: center; margin-bottom: 5px; font-size: 18px; }
          .subtitle { text-align: center; margin-bottom: 20px; color: #666; font-size: 11px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-label { color: #666; }
          .info-value { font-weight: bold; }
          .section { margin: 20px 0; }
          .section-title { font-weight: bold; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; font-size: 10px; }
          td { font-size: 10px; }
          .text-right { text-align: right; }
          .total { font-size: 14px; font-weight: bold; color: #008000; margin-top: 15px; text-align: right; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #666; }
          @media print { body { padding: 10px; } button { display: none; } }
          .btn-print { display: block; margin: 20px auto; padding: 10px 30px; font-size: 14px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Comprovante de Pagamento</h1>
        <p class="subtitle">Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        
        <div class="section">
          <div class="section-title">Dados do Pagamento</div>
          <div class="info-row">
            <span class="info-label">Data do Pagamento:</span>
            <span class="info-value">${format(parseISO(paymentDate), 'dd/MM/yyyy')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Conta Debitada:</span>
            <span class="info-value">${cashAccounts.find(a => a.id === selectedAccountId)?.name || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Forma de Pagamento:</span>
            <span class="info-value">${formaPagamento.charAt(0).toUpperCase() + formaPagamento.slice(1).replace('_', ' ')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Valor Total:</span>
            <span class="info-value">${formatCurrency(valorTotal)}</span>
          </div>
          ${descontoNum > 0 ? `
          <div class="info-row">
            <span class="info-label">Desconto:</span>
            <span class="info-value">- ${formatCurrency(descontoNum)}</span>
          </div>
          ` : ''}
          ${jurosMultaNum > 0 ? `
          <div class="info-row">
            <span class="info-label">Juros/Multa:</span>
            <span class="info-value">+ ${formatCurrency(jurosMultaNum)}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Contas Pagas</div>
          <table>
            <thead>
              <tr>
                <th>Fornecedor</th>
                <th>Vencimento</th>
                <th class="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${contas.map(c => `
                <tr>
                  <td>${c.supplierName || '-'}</td>
                  <td>${format(parseISO(c.dueDate), 'dd/MM/yyyy')}</td>
                  <td class="text-right">${formatCurrency(c.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <p class="total">Valor Final Pago: ${formatCurrency(valorFinal)}</p>

        ${observacoes ? `
        <div class="section">
          <div class="section-title">Observações</div>
          <p>${observacoes}</p>
        </div>
        ` : ''}

        <p class="footer">Este documento é um comprovante de pagamento gerado pelo sistema.</p>
        
        <button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Linha 1 - Data e Conta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Data do Pagamento:</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="h-9"
                disabled={paymentConfirmed}
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Conta para Débito:</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId} disabled={paymentConfirmed}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar conta..." />
                </SelectTrigger>
                <SelectContent>
                  {cashAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha 2 - Valores */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs font-medium">Valor Total:</Label>
              <div className="h-9 px-3 flex items-center bg-blue-50 border border-blue-200 rounded-md text-blue-700 font-semibold">
                {formatCurrency(valorTotal)}
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Desconto:</Label>
              <Input
                type="text"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                placeholder="0,00"
                className="h-9 text-right"
                disabled={paymentConfirmed}
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Juros/Multa:</Label>
              <Input
                type="text"
                value={jurosMulta}
                onChange={(e) => setJurosMulta(e.target.value)}
                placeholder="0,00"
                className="h-9 text-right"
                disabled={paymentConfirmed}
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Valor Final:</Label>
              <div className={`h-9 px-3 flex items-center border rounded-md font-bold ${valorFinal > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {formatCurrency(valorFinal)}
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <Label className="text-xs font-semibold uppercase text-slate-600 mb-3 block">Forma de Pagamento</Label>
              <RadioGroup
                value={formaPagamento}
                onValueChange={setFormaPagamento}
                className="grid grid-cols-3 gap-2"
                disabled={paymentConfirmed}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dinheiro" id="fpDinheiro" />
                  <Label htmlFor="fpDinheiro" className="text-sm cursor-pointer">Dinheiro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="transferencia" id="fpTransferencia" />
                  <Label htmlFor="fpTransferencia" className="text-sm cursor-pointer">Transferência</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pix" id="fpPix" />
                  <Label htmlFor="fpPix" className="text-sm cursor-pointer">PIX</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cheque" id="fpCheque" />
                  <Label htmlFor="fpCheque" className="text-sm cursor-pointer">Cheque</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cartaoDebito" id="fpDebito" />
                  <Label htmlFor="fpDebito" className="text-sm cursor-pointer">Cartão Débito</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cartaoCredito" id="fpCredito" />
                  <Label htmlFor="fpCredito" className="text-sm cursor-pointer">Cartão Crédito</Label>
                </div>
              </RadioGroup>

              {/* Campos condicionais */}
              {formaPagamento === 'transferencia' && (
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
                  <div>
                    <Label className="text-xs">Banco Destino:</Label>
                    <Input value={bancoDestino} onChange={(e) => setBancoDestino(e.target.value)} className="h-8" disabled={paymentConfirmed} />
                  </div>
                  <div>
                    <Label className="text-xs">Nº Transferência:</Label>
                    <Input value={numeroTransferencia} onChange={(e) => setNumeroTransferencia(e.target.value)} className="h-8" disabled={paymentConfirmed} />
                  </div>
                  <div>
                    <Label className="text-xs">Agência:</Label>
                    <Input value={agencia} onChange={(e) => setAgencia(e.target.value)} className="h-8" disabled={paymentConfirmed} />
                  </div>
                  <div>
                    <Label className="text-xs">Conta:</Label>
                    <Input value={conta} onChange={(e) => setConta(e.target.value)} className="h-8" disabled={paymentConfirmed} />
                  </div>
                </div>
              )}

              {formaPagamento === 'pix' && (
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
                  <div>
                    <Label className="text-xs">Chave PIX:</Label>
                    <Input value={chavePix} onChange={(e) => setChavePix(e.target.value)} className="h-8" disabled={paymentConfirmed} />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo de Chave:</Label>
                    <Select value={tipoChavePix} onValueChange={setTipoChavePix} disabled={paymentConfirmed}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="telefone">Telefone</SelectItem>
                        <SelectItem value="aleatoria">Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">ID Transação:</Label>
                    <Input value={idTransacaoPix} onChange={(e) => setIdTransacaoPix(e.target.value)} className="h-8" disabled={paymentConfirmed} />
                  </div>
                </div>
              )}

              {formaPagamento === 'cheque' && (
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
                  <div>
                    <Label className="text-xs">Banco:</Label>
                    <Input value={bancoDestino} onChange={(e) => setBancoDestino(e.target.value)} className="h-8" disabled={paymentConfirmed} />
                  </div>
                  <div>
                    <Label className="text-xs">Nº Cheque:</Label>
                    <Input value={numeroCheque} onChange={(e) => setNumeroCheque(e.target.value)} className="h-8" disabled={paymentConfirmed} />
                  </div>
                  <div>
                    <Label className="text-xs">Agência:</Label>
                    <Input value={agencia} onChange={(e) => setAgencia(e.target.value)} className="h-8" disabled={paymentConfirmed} />
                  </div>
                  <div>
                    <Label className="text-xs">Conta:</Label>
                    <Input value={conta} onChange={(e) => setConta(e.target.value)} className="h-8" disabled={paymentConfirmed} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Data de Compensação:</Label>
                    <Input type="date" value={dataCompensacao} onChange={(e) => setDataCompensacao(e.target.value)} className="h-8" disabled={paymentConfirmed} />
                  </div>
                </div>
              )}

              {(formaPagamento === 'cartaoDebito' || formaPagamento === 'cartaoCredito') && (
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
                  <div>
                    <Label className="text-xs">Bandeira:</Label>
                    <Select value={bandeira} onValueChange={setBandeira} disabled={paymentConfirmed}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visa">Visa</SelectItem>
                        <SelectItem value="mastercard">Mastercard</SelectItem>
                        <SelectItem value="elo">Elo</SelectItem>
                        <SelectItem value="amex">American Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Nº Transação:</Label>
                    <Input value={numeroTransacaoCartao} onChange={(e) => setNumeroTransacaoCartao(e.target.value)} className="h-8" disabled={paymentConfirmed} />
                  </div>
                  {formaPagamento === 'cartaoCredito' && (
                    <div>
                      <Label className="text-xs">Nº Parcelas:</Label>
                      <Input type="number" min="1" value={numeroParcelas} onChange={(e) => setNumeroParcelas(parseInt(e.target.value) || 1)} className="h-8" disabled={paymentConfirmed} />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          <div>
            <Label className="text-xs font-medium">Observações:</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre o pagamento..."
              rows={2}
              disabled={paymentConfirmed}
            />
          </div>

          {/* Lista de Contas */}
          <Card className="border-slate-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <Label className="text-xs font-semibold uppercase text-slate-600">Contas a Pagar</Label>
              </div>
              <div className="max-h-36 overflow-auto border rounded">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs">Fornecedor</TableHead>
                      <TableHead className="text-xs w-24">Vencimento</TableHead>
                      <TableHead className="text-xs w-24 text-right">Valor</TableHead>
                      <TableHead className="text-xs w-20">Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contas.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="text-xs">{c.supplierName || '-'}</TableCell>
                        <TableCell className="text-xs">{format(parseISO(c.dueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{formatCurrency(c.amount)}</TableCell>
                        <TableCell className="text-xs">
                          {paymentConfirmed ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">Paga</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Não Paga</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2 mt-4">
          {!paymentConfirmed ? (
            <>
              <Button
                onClick={handleConfirmarPagamento}
                disabled={isProcessing || contas.length === 0}
                className="bg-green-600 hover:bg-green-700 gap-1"
              >
                <DollarSign className="w-4 h-4" />
                {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleImprimir} className="gap-1">
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
              <Button variant="outline" onClick={handleClose} className="gap-1">
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}