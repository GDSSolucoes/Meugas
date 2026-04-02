import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  RefreshCw, Save, Printer, X, LogOut, Edit, Trash2, Calculator, CheckCircle, AlertCircle
} from "lucide-react";
import { AccountsReceivable } from "@/entities/AccountsReceivable";
import { CashMovement } from "@/entities/CashMovement";
import { CashAccount } from "@/entities/CashAccount";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, addDays } from "date-fns";

export default function RenegociacaoModal({ 
  open, 
  onOpenChange, 
  currentUser, 
  sectors,
  cashAccounts,
  contasSelecionadas,
  onRenegociacaoComplete 
}) {
  const { toast } = useToast();
  
  // Dados da renegociação
  const [dataRenegociacao, setDataRenegociacao] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [setorId, setSetorId] = useState('');
  const [valorTotal, setValorTotal] = useState(0);
  const [valorDinheiro, setValorDinheiro] = useState(0);
  const [contaDestinoId, setContaDestinoId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Controles de parcelamento
  const [numParcelas, setNumParcelas] = useState(1);
  const [dataPrimeiraParcela, setDataPrimeiraParcela] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [intervalo, setIntervalo] = useState(30);
  
  // Parcelas geradas
  const [parcelas, setParcelas] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  
  // Estados de loading
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar valores quando abrir o modal
  useEffect(() => {
    if (open && contasSelecionadas.length > 0) {
      const total = contasSelecionadas.reduce((sum, c) => sum + (c.amount || 0), 0);
      setValorTotal(total);
      setValorDinheiro(0);
      setParcelas([]);
      setNumParcelas(1);
      setDataPrimeiraParcela(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
      setObservacoes('');
      setSetorId('');
      setContaDestinoId(cashAccounts.length > 0 ? cashAccounts[0].id : '');
    }
  }, [open, contasSelecionadas, cashAccounts]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatMoneyDisplay = (value) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const parseMoneyInput = (inputValue) => {
    if (!inputValue) return 0;
    const cleaned = inputValue.toString().replace(/[^\d,]/g, '');
    const normalized = cleaned.replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  // Calcular valor a parcelar
  const valorAParcelar = valorTotal - valorDinheiro;
  
  // Calcular total das parcelas
  const totalParcelas = parcelas.reduce((sum, p) => sum + (p.valor || 0), 0);
  
  // Calcular diferença
  const diferenca = valorAParcelar - totalParcelas;

  // Gerar parcelas automaticamente
  const gerarParcelas = () => {
    if (numParcelas <= 0) {
      toast({ title: "Erro", description: "Número de parcelas deve ser maior que zero.", variant: "destructive" });
      return;
    }
    
    if (valorAParcelar <= 0) {
      toast({ title: "Erro", description: "Valor a parcelar deve ser maior que zero.", variant: "destructive" });
      return;
    }

    const valorParcela = valorAParcelar / numParcelas;
    const novasParcelas = [];
    
    for (let i = 0; i < numParcelas; i++) {
      const dataVencimento = addDays(new Date(dataPrimeiraParcela), i * intervalo);
      novasParcelas.push({
        numero: i + 1,
        vencimento: format(dataVencimento, 'yyyy-MM-dd'),
        valor: Math.round(valorParcela * 100) / 100
      });
    }
    
    // Ajustar última parcela para diferença de arredondamento
    const totalGerado = novasParcelas.reduce((sum, p) => sum + p.valor, 0);
    const diffArredondamento = valorAParcelar - totalGerado;
    if (novasParcelas.length > 0 && Math.abs(diffArredondamento) > 0.01) {
      novasParcelas[novasParcelas.length - 1].valor += diffArredondamento;
      novasParcelas[novasParcelas.length - 1].valor = Math.round(novasParcelas[novasParcelas.length - 1].valor * 100) / 100;
    }
    
    setParcelas(novasParcelas);
  };

  // Editar parcela
  const handleEditParcela = (index, field, value) => {
    const novasParcelas = [...parcelas];
    if (field === 'valor') {
      novasParcelas[index].valor = parseMoneyInput(value);
    } else {
      novasParcelas[index][field] = value;
    }
    setParcelas(novasParcelas);
  };

  // Excluir parcela
  const handleExcluirParcela = (index) => {
    const novasParcelas = parcelas.filter((_, i) => i !== index);
    // Renumerar parcelas
    novasParcelas.forEach((p, i) => p.numero = i + 1);
    setParcelas(novasParcelas);
  };

  // Validar dados
  const validarDados = () => {
    if (!setorId) {
      toast({ title: "Erro", description: "Selecione o setor que realizou a cobrança.", variant: "destructive" });
      return false;
    }
    
    if (valorTotal <= 0) {
      toast({ title: "Erro", description: "Valor total deve ser maior que zero.", variant: "destructive" });
      return false;
    }
    
    if (parcelas.length === 0) {
      toast({ title: "Erro", description: "Gere pelo menos uma parcela.", variant: "destructive" });
      return false;
    }
    
    if (Math.abs(diferenca) > 0.01) {
      toast({ title: "Erro", description: "Total das parcelas não confere com o valor a parcelar.", variant: "destructive" });
      return false;
    }

    if (valorDinheiro > 0 && !contaDestinoId) {
      toast({ title: "Erro", description: "Selecione a conta de destino para o valor de entrada.", variant: "destructive" });
      return false;
    }
    
    return true;
  };

  // Salvar renegociação
  const handleSalvar = async () => {
    if (!validarDados()) return;
    
    setIsSaving(true);
    try {
      const setor = sectors.find(s => s.id === setorId);
      
      // 1. Baixar contas originais como "renegociadas"
      for (const conta of contasSelecionadas) {
        await AccountsReceivable.update(conta.id, {
          status: 'renegociado',
          paymentDate: dataRenegociacao,
          renegociacaoObservacao: `Renegociada em ${format(parseISO(dataRenegociacao), 'dd/MM/yyyy')}`
        });
      }
      
      // 2. Se houve entrada em dinheiro, registrar no caixa
      if (valorDinheiro > 0 && contaDestinoId) {
        const contaDestino = cashAccounts.find(c => c.id === contaDestinoId);
        
        await CashMovement.create({
          cashAccountId: contaDestinoId,
          cashAccountName: contaDestino?.name || '',
          type: 'receita',
          description: `Entrada renegociação - ${contasSelecionadas.map(c => c.personName).join(', ')}`,
          amount: valorDinheiro,
          movementDate: dataRenegociacao,
          sectorId: setorId,
          sectorName: setor?.name || '',
          personId: contasSelecionadas[0]?.personId,
          personName: contasSelecionadas[0]?.personName,
          companyId: currentUser.companyId,
          companyName: currentUser.companyName,
          createdByName: currentUser.fullName
        });
        
        // Atualizar saldo da conta
        await CashAccount.update(contaDestinoId, {
          balance: (contaDestino?.balance || 0) + valorDinheiro
        });
      }
      
      // 3. Criar novas contas a receber para cada parcela
      for (const parcela of parcelas) {
        await AccountsReceivable.create({
          personId: contasSelecionadas[0]?.personId,
          personName: contasSelecionadas[0]?.personName,
          description: `Renegociação - Parcela ${String(parcela.numero).padStart(3, '0')}/${String(parcelas.length).padStart(3, '0')}`,
          dueDate: parcela.vencimento,
          amount: parcela.valor,
          installmentNumber: parcela.numero,
          status: 'pendente',
          sectorId: setorId,
          sectorName: setor?.name || '',
          renegociacaoOrigem: contasSelecionadas.map(c => c.id).join(','),
          renegociacaoData: dataRenegociacao,
          renegociacaoObservacao: observacoes,
          companyId: currentUser.companyId,
          companyName: currentUser.companyName,
          createdByName: currentUser.fullName
        });
      }
      
      toast({ title: "Sucesso", description: `Renegociação salva! ${parcelas.length} nova(s) parcela(s) gerada(s).` });
      onOpenChange(false);
      
      if (onRenegociacaoComplete) {
        onRenegociacaoComplete();
      }
    } catch (error) {
      console.error("Erro ao salvar renegociação:", error);
      toast({ title: "Erro", description: "Não foi possível salvar a renegociação.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Imprimir comprovante
  const handleImprimir = () => {
    if (parcelas.length === 0) {
      toast({ title: "Atenção", description: "Gere as parcelas antes de imprimir.", variant: "destructive" });
      return;
    }

    const setor = sectors.find(s => s.id === setorId);
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante de Renegociação</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          h1 { text-align: center; margin-bottom: 5px; font-size: 18px; }
          .subtitle { text-align: center; margin-bottom: 20px; color: #666; font-size: 11px; }
          .info-section { margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
          .info-row { display: flex; margin-bottom: 5px; }
          .info-label { font-weight: bold; width: 200px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; font-size: 10px; }
          td { font-size: 10px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-row { background-color: #e8f5e9; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
          .signature { margin-top: 50px; display: flex; justify-content: space-around; }
          .signature-line { width: 200px; border-top: 1px solid #000; text-align: center; padding-top: 5px; }
          @media print { body { padding: 10px; } button { display: none; } }
          .btn-print { display: block; margin: 20px auto; padding: 10px 30px; font-size: 14px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Comprovante de Renegociação de Dívida</h1>
        <p class="subtitle">Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Data da Renegociação:</span>
            <span>${format(parseISO(dataRenegociacao), 'dd/MM/yyyy')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cliente:</span>
            <span>${contasSelecionadas[0]?.personName || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Setor Responsável:</span>
            <span>${setor?.name || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Valor Total da Dívida:</span>
            <span>${formatCurrency(valorTotal)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Valor de Entrada:</span>
            <span>${formatCurrency(valorDinheiro)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Valor Parcelado:</span>
            <span>${formatCurrency(valorAParcelar)}</span>
          </div>
        </div>
        
        <h3>Parcelas</h3>
        <table>
          <thead>
            <tr>
              <th class="text-center">Parcela</th>
              <th>Vencimento</th>
              <th class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${parcelas.map(p => `
              <tr>
                <td class="text-center">${String(p.numero).padStart(3, '0')}/${String(parcelas.length).padStart(3, '0')}</td>
                <td>${format(parseISO(p.vencimento), 'dd/MM/yyyy')}</td>
                <td class="text-right">${formatCurrency(p.valor)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2" class="text-right">TOTAL:</td>
              <td class="text-right">${formatCurrency(totalParcelas)}</td>
            </tr>
          </tbody>
        </table>
        
        ${observacoes ? `
          <div class="info-section" style="margin-top: 20px;">
            <strong>Observações:</strong><br/>
            ${observacoes}
          </div>
        ` : ''}
        
        <div class="signature">
          <div class="signature-line">Responsável</div>
          <div class="signature-line">Cliente</div>
        </div>
        
        <p class="footer">Este documento não possui valor fiscal</p>
        
        <button class="btn-print" onclick="window.print()">Imprimir</button>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="w-5 h-5" />
            Renegociação de Dívida
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 p-1">
          {/* Dados da Renegociação */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
            <div>
              <Label className="text-xs">Data da Renegociação:</Label>
              <Input 
                type="date"
                value={dataRenegociacao}
                onChange={(e) => setDataRenegociacao(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Setor que realizou a cobrança: *</Label>
              <Select value={setorId} onValueChange={setSetorId}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Selecionar setor..." />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
            <div>
              <Label className="text-xs">Valor Total:</Label>
              <Input 
                type="text"
                value={formatMoneyDisplay(valorTotal)}
                onChange={(e) => setValorTotal(parseMoneyInput(e.target.value))}
                className="h-8 text-right font-mono"
              />
            </div>
            <div>
              <Label className="text-xs">Dinheiro (Entrada):</Label>
              <Input 
                type="text"
                value={formatMoneyDisplay(valorDinheiro)}
                onChange={(e) => setValorDinheiro(parseMoneyInput(e.target.value))}
                className="h-8 text-right font-mono"
              />
            </div>
            <div>
              <Label className="text-xs">Conta para Entrada:</Label>
              <Select value={contaDestinoId} onValueChange={setContaDestinoId} disabled={valorDinheiro <= 0}>
                <SelectTrigger className="h-8">
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

          {/* Controles de Parcelamento */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <Label className="text-xs">Nº Parcelas:</Label>
              <Input 
                type="number"
                min={1}
                max={99}
                value={numParcelas}
                onChange={(e) => setNumParcelas(parseInt(e.target.value) || 1)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Data 1ª Parcela:</Label>
              <Input 
                type="date"
                value={dataPrimeiraParcela}
                onChange={(e) => setDataPrimeiraParcela(e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Intervalo:</Label>
              <Select value={String(intervalo)} onValueChange={(v) => setIntervalo(parseInt(v))}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="45">45 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={gerarParcelas} className="w-full h-8 text-xs gap-1 bg-blue-600 hover:bg-blue-700">
                <Calculator className="w-3 h-3" /> Gerar Parcelas
              </Button>
            </div>
          </div>

          {/* Tabela de Parcelas */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-3 py-2 text-sm font-semibold flex items-center gap-2">
              📅 Parcelas
            </div>
            <div className="max-h-[200px] overflow-auto">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="w-20 text-xs text-center">Parcela</TableHead>
                    <TableHead className="w-32 text-xs">Vencimento</TableHead>
                    <TableHead className="w-32 text-xs text-right">Valor</TableHead>
                    <TableHead className="w-20 text-xs text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parcelas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        Clique em "Gerar Parcelas" para criar o parcelamento
                      </TableCell>
                    </TableRow>
                  ) : (
                    parcelas.map((parcela, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-center text-xs font-mono">
                          {String(parcela.numero).padStart(3, '0')}
                        </TableCell>
                        <TableCell>
                          {editingIndex === index ? (
                            <Input 
                              type="date"
                              value={parcela.vencimento}
                              onChange={(e) => handleEditParcela(index, 'vencimento', e.target.value)}
                              className="h-7 text-xs"
                              onBlur={() => setEditingIndex(-1)}
                            />
                          ) : (
                            <span className="text-xs">{format(parseISO(parcela.vencimento), 'dd/MM/yyyy')}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingIndex === index ? (
                            <Input 
                              type="text"
                              value={formatMoneyDisplay(parcela.valor)}
                              onChange={(e) => handleEditParcela(index, 'valor', e.target.value)}
                              className="h-7 text-xs text-right font-mono"
                              onBlur={() => setEditingIndex(-1)}
                            />
                          ) : (
                            <span className="text-xs font-mono">{formatCurrency(parcela.valor)}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={() => setEditingIndex(editingIndex === index ? -1 : index)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleExcluirParcela(index)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Totais */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
            <div className="text-right">
              <span className="text-xs text-slate-600">Total das Parcelas:</span>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(totalParcelas)}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-600">Diferença:</span>
              <p className={`text-lg font-bold flex items-center justify-end gap-2 ${Math.abs(diferenca) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(diferenca)}
                {Math.abs(diferenca) < 0.01 ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </p>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label className="text-xs">Observações:</Label>
            <Textarea 
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre a renegociação..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        {/* Barra de Ações */}
        <DialogFooter className="bg-slate-100 -mx-6 -mb-6 px-4 py-3 mt-4 border-t">
          <div className="flex gap-2 w-full justify-end">
            <Button 
              onClick={handleSalvar} 
              disabled={isSaving || parcelas.length === 0 || Math.abs(diferenca) > 0.01}
              className="h-8 text-xs gap-1 bg-green-600 hover:bg-green-700"
            >
              <Save className="w-3 h-3" /> Salvar
            </Button>
            <Button 
              variant="outline" 
              onClick={handleImprimir}
              disabled={parcelas.length === 0}
              className="h-8 text-xs gap-1"
            >
              <Printer className="w-3 h-3" /> Imprimir
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs gap-1"
            >
              <X className="w-3 h-3" /> Cancelar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs gap-1"
            >
              <LogOut className="w-3 h-3" /> Sair
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}