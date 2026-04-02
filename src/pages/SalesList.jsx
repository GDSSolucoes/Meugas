import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Search,
  Filter,
  Receipt,
  CreditCard,
  Eye,
  Calendar,
  Download,
  XCircle,
  FileCode // Added FileCode icon
} from "lucide-react";
import * as entities from "@/entities";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function SalesList() {
  const { toast } = useToast();
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [filters, setFilters] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    searchTerm: ''
  });

  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelJustification, setCancelJustification] = useState('');
  const [cancelTipoNota, setCancelTipoNota] = useState('');
  const [isEmittingNFe, setIsEmittingNFe] = useState(false);
  const [isEmittingNFCe, setIsEmittingNFCe] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);


  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await entities.User.me();
      setCurrentUser(user);

      const salesData = await entities.Sale.filter(
        { companyId: user.companyId },
        '-createdDate',
        500
      );

      setSales(salesData);
      setFilteredSales(salesData);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as vendas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    applyFilters();
  }, [filters, sales]);

  const applyFilters = () => {
    let filtered = [...sales];

    // Filtro de data
    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(sale => {
        const saleDate = sale.saleDate || sale.createdDate?.split('T')[0];
        return saleDate >= filters.startDate && saleDate <= filters.endDate;
      });
    }

    // Filtro de busca
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(sale =>
        sale.saleNumber?.toLowerCase().includes(searchLower) ||
        sale.personName?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredSales(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setShowDetailsModal(true);
  };

  const handleDownloadDANFe = async (sale, tipo) => {
    setIsDownloading(true);
    try {
      const functionName = tipo === 'nfe' ? 'baixarDANFe' : 'baixarDANFCe';
      const result = await base44.functions.invoke(functionName, { saleId: sale.id });

      if (result.success && result.pdfBase64) {
        // Converter base64 para blob
        const byteCharacters = atob(result.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        // Criar link de download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `DANFE_${sale.saleNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Sucesso!",
          description: "DANFE baixado com sucesso!"
        });
      } else {
        toast({
          title: "Erro",
          description: result.error || "Não foi possível baixar o DANFE.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao baixar DANFE:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível baixar o DANFE.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadXML = async (sale, tipo) => {
    setIsDownloading(true);
    try {
      const functionName = tipo === 'nfe' ? 'baixarXMLNFe' : 'baixarXMLNFCe';
      const result = await base44.functions.invoke(functionName, { saleId: sale.id });

      if (result.success && result.xmlBase64) {
        // Converter base64 para blob
        const byteCharacters = atob(result.xmlBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/xml' });

        // Criar link de download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `${tipo.toUpperCase()}_${sale.saleNumber}.xml`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Sucesso!",
          description: "XML baixado com sucesso!"
        });
      } else {
        toast({
          title: "Erro",
          description: result.error || "Não foi possível baixar o XML.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao baixar XML:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível baixar o XML.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenCancelModal = (sale, tipo) => {
    setSelectedSale(sale);
    setCancelTipoNota(tipo);
    setCancelJustification('');
    setShowCancelModal(true);
  };

  const handleCancelNota = async () => {
    if (!cancelJustification || cancelJustification.length < 15) {
      toast({
        title: "Erro",
        description: "Justificativa deve ter no mínimo 15 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setIsCancelling(true);
    try {
      const result = await base44.functions.invoke('cancelarNotaFiscal', {
        saleId: selectedSale.id,
        tipoNota: cancelTipoNota,
        justificativa: cancelJustification
      });

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: result.message
        });

        setShowCancelModal(false);
        await loadData();
      } else {
        toast({
          title: "Erro",
          description: result.error || "Não foi possível cancelar a nota.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao cancelar nota:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cancelar a nota.",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleEmitNFe = async (sale) => {
    if (!window.confirm(`Deseja emitir NF-e para a venda ${sale.saleNumber}?`)) {
      return;
    }

    setIsEmittingNFe(true);
    try {
      const result = await base44.functions.invoke('emitirNFe', { saleId: sale.id });

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `NF-e ${result.nfeNumber} emitida com sucesso!`
        });

        // Recarregar dados
        await loadData();
      } else {
        toast({
          title: "Erro",
          description: result.error || "Não foi possível emitir a NF-e.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao emitir NF-e:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível emitir a NF-e.",
        variant: "destructive"
      });
    } finally {
      setIsEmittingNFe(false);
    }
  };

  const handleEmitNFCe = async (sale) => {
    if (!window.confirm(`Deseja emitir NFC-e para a venda ${sale.saleNumber}?`)) {
      return;
    }

    setIsEmittingNFCe(true);
    try {
      const result = await base44.functions.invoke('emitirNFCe', { saleId: sale.id });

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `NFC-e ${result.nfceNumber} emitida com sucesso!`
        });

        // Recarregar dados
        await loadData();
      } else {
        toast({
          title: "Erro",
          description: result.error || "Não foi possível emitir a NFC-e.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao emitir NFC-e:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível emitir a NFC-e.",
        variant: "destructive"
      });
    } finally {
      setIsEmittingNFCe(false);
    }
  };

  const getPaymentMethodsDisplay = (paymentMethods) => {
    if (!paymentMethods || paymentMethods.length === 0) return 'Não especificado';
    return paymentMethods.map(pm => pm.paymentTypeName).join(', ');
  };

  const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <p className="text-lg text-slate-600">Carregando vendas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Vendas Realizadas</h1>
            <p className="text-slate-600">Consulte e emita notas fiscais</p>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6 bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Buscar</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nº venda ou nome do cliente..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    className="bg-white"
                  />
                  <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total de Vendas</p>
                  <p className="text-2xl font-bold text-slate-800">{filteredSales.length}</p>
                </div>
                <Receipt className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Valor Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totalSales.toFixed(2)}
                  </p>
                </div>
                <CreditCard className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Ticket Médio</p>
                  <p className="text-2xl font-bold text-purple-600">
                    R$ {filteredSales.length > 0 ? (totalSales / filteredSales.length).toFixed(2) : '0.00'}
                  </p>
                </div>
                <Calendar className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Vendas */}
        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle>Lista de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Venda</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status NF</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.filter((sale, index, self) => 
                    index === self.findIndex(s => s.id === sale.id)
                  ).map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                      <TableCell>
                        {format(parseISO(sale.saleDate || sale.createdDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{sale.personName}</TableCell>
                      <TableCell>{sale.sectorName || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {getPaymentMethodsDisplay(sale.paymentMethods)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        R$ {sale.totalAmount?.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {sale.nfeNumber && (
                            <Badge className={sale.nfeCancelada ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                              NF-e {sale.nfeNumber} {sale.nfeCancelada && '(Cancelada)'}
                            </Badge>
                          )}
                          {sale.nfceNumber && (
                            <Badge className={sale.nfceCancelada ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                              NFC-e {sale.nfceNumber} {sale.nfceCancelada && '(Cancelada)'}
                            </Badge>
                          )}
                          {!sale.nfeNumber && !sale.nfceNumber && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Nota Pendente
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end flex-wrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(sale)}
                            className="hover:bg-blue-100"
                            title="Ver Detalhes"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>

                          {!sale.nfeNumber && !sale.nfceNumber && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEmitNFe(sale)}
                                disabled={isEmittingNFe}
                                className="hover:bg-green-100"
                                title="Emitir NF-e"
                              >
                                <FileText className="w-4 h-4 text-green-600 mr-1" />
                                <span className="text-xs">NF-e</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEmitNFCe(sale)}
                                disabled={isEmittingNFCe}
                                className="hover:bg-purple-100"
                                title="Emitir NFC-e"
                              >
                                <Receipt className="w-4 h-4 text-purple-600 mr-1" />
                                <span className="text-xs">NFC-e</span>
                              </Button>
                            </>
                          )}

                          {sale.nfeNumber && !sale.nfeCancelada && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadDANFe(sale, 'nfe')}
                                disabled={isDownloading}
                                className="hover:bg-blue-100"
                                title="Baixar PDF (DANFE)"
                              >
                                <Download className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadXML(sale, 'nfe')} // New XML download button for NFe
                                disabled={isDownloading}
                                className="hover:bg-indigo-100"
                                title="Baixar XML"
                              >
                                <FileCode className="w-4 h-4 text-indigo-600" />
                              </Button>
                              {currentUser?.userType === 'admin' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenCancelModal(sale, 'nfe')}
                                  className="hover:bg-red-100"
                                  title="Cancelar NF-e"
                                >
                                  <XCircle className="w-4 h-4 text-red-600" />
                                </Button>
                              )}
                            </>
                          )}

                          {sale.nfceNumber && !sale.nfceCancelada && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadDANFe(sale, 'nfce')}
                                disabled={isDownloading}
                                className="hover:bg-blue-100"
                                title="Baixar PDF (DANFE)"
                              >
                                <Download className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadXML(sale, 'nfce')} // New XML download button for NFCe
                                disabled={isDownloading}
                                className="hover:bg-indigo-100"
                                title="Baixar XML"
                              >
                                <FileCode className="w-4 h-4 text-indigo-600" />
                              </Button>
                              {currentUser?.userType === 'admin' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenCancelModal(sale, 'nfce')}
                                  className="hover:bg-red-100"
                                  title="Cancelar NFC-e"
                                >
                                  <XCircle className="w-4 h-4 text-red-600" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        Nenhuma venda encontrada para o período selecionado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Cancelamento */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">
              Cancelar {cancelTipoNota === 'nfe' ? 'NF-e' : 'NFC-e'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Você está prestes a cancelar a nota fiscal. Esta ação é irreversível e será registrada na SEFAZ.
            </p>
            <div>
              <Label>Justificativa * (mínimo 15 caracteres)</Label>
              <Textarea
                value={cancelJustification}
                onChange={(e) => setCancelJustification(e.target.value)}
                rows={4}
                placeholder="Digite a justificativa para o cancelamento..."
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                {cancelJustification.length} / 15 caracteres
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)} disabled={isCancelling}>
              Voltar
            </Button>
            <Button
              onClick={handleCancelNota}
              disabled={isCancelling || cancelJustification.length < 15}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Detalhes da Venda #{selectedSale?.saleNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              {/* Informações do Cliente */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold mb-2">Cliente</h3>
                <p className="text-sm"><strong>Nome:</strong> {selectedSale.personName}</p>
                <p className="text-sm"><strong>Data:</strong> {format(parseISO(selectedSale.saleDate || selectedSale.createdDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                <p className="text-sm"><strong>Setor:</strong> {selectedSale.sectorName || '-'}</p>
              </div>

              {/* Itens */}
              <div>
                <h3 className="font-semibold mb-2">Itens da Venda</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Valor Un.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">R$ {item.unitPrice?.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {item.total?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagamentos */}
              <div>
                <h3 className="font-semibold mb-2">Formas de Pagamento</h3>
                <div className="space-y-2">
                  {selectedSale.paymentMethods?.map((pm, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded">
                      <p className="text-sm">
                        <strong>{pm.paymentTypeName}:</strong> R$ {pm.amount?.toFixed(2)}
                        {pm.installments > 1 && ` (${pm.installments}x)`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <p className="text-lg font-bold text-green-700">
                  Total: R$ {selectedSale.totalAmount?.toFixed(2)}
                </p>
              </div>

              {/* Observações */}
              {selectedSale.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Observações</h3>
                  <p className="text-sm text-slate-600">{selectedSale.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}