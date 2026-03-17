
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Filter, Loader2 } from "lucide-react";
import { Sector } from "@/entities/Sector";
import { Product } from "@/entities/Product";
import { ProductStock } from "@/entities/ProductStock";
import { Sale } from "@/entities/Sale";
import { Purchase } from "@/entities/Purchase";
import { StockTransfer } from "@/entities/StockTransfer";
import { VasilhameLoan } from "@/entities/VasilhameLoan";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, startOfDay, endOfDay, isBefore } from 'date-fns';
import { User } from "@/entities/User";

export default function StockReport() {
  const { toast } = useToast();
  const [sectors, setSectors] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    sectorId: '',
    reportDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        const sectorsData = await Sector.filter({ company_id: user.company_id });
        setSectors(sectorsData);
      } catch (error) {
        toast({ title: "Erro", description: "Falha ao carregar dados iniciais.", variant: "destructive" });
      }
    };
    loadInitialData();
  }, [toast]);

  const handleGenerateReport = useCallback(async () => {
    if (!filters.sectorId) {
      toast({ title: "Atenção", description: "Por favor, selecione um setor.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setReportData([]);

    try {
      if (!currentUser) {
        toast({ title: "Erro", description: "Usuário não encontrado. Por favor, recarregue a página.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      const company_id = currentUser.company_id;
      const reportDate = startOfDay(parseISO(filters.reportDate));
      const endOfReportDate = endOfDay(parseISO(filters.reportDate));

      const [
        allProducts,
        allStocks,
        allSales,
        allPurchases,
        allTransfers,
        allLoans,
        allPickups
      ] = await Promise.all([
        Product.filter({ company_id }),
        ProductStock.filter({ company_id }),
        Sale.filter({ company_id }),
        Purchase.filter({ company_id }),
        StockTransfer.filter({ company_id }),
        VasilhameLoan.filter({ company_id }),
        // Assumindo que existe uma entidade para retiradas de produtos
        // Se não existir, pode usar uma lista vazia ou implementar
        Promise.resolve([]) // Placeholder for ProductPickup.list()
      ]);

      const calculatedData = allProducts.map(product => {
        // 1. Encontrar o estoque base inicial
        const initialStockRecord = allStocks.find(s => s.product_id === product.id && s.sector_id === filters.sectorId);
        const stockStartDate = initialStockRecord ? parseISO(initialStockRecord.initial_date) : new Date(0);
        let openingBalance = initialStockRecord ? (initialStockRecord.quantity || 0) : 0;

        // 2. Calcular o saldo inicial no começo do dia do relatório
        // Ajustar com todas as movimentações anteriores ao dia do relatório
        allPurchases
          .filter(p => p.sector_id === filters.sectorId && p.items.some(i => i.product_id === product.id) && isBefore(parseISO(p.purchase_date), reportDate) && !isBefore(parseISO(p.purchase_date), stockStartDate))
          .forEach(p => p.items.filter(i => i.product_id === product.id).forEach(i => openingBalance += i.quantity));

        allSales
          .filter(s => s.sector_id === filters.sectorId && s.items.some(i => i.product_id === product.id) && isBefore(parseISO(s.sale_date), reportDate) && !isBefore(parseISO(s.sale_date), stockStartDate))
          .forEach(s => s.items.filter(i => i.product_id === product.id).forEach(i => openingBalance -= i.quantity));

        allTransfers
          .filter(t => t.product_id === product.id && isBefore(parseISO(t.transfer_date), reportDate) && !isBefore(parseISO(t.transfer_date), stockStartDate))
          .forEach(t => {
            if (t.to_sector_id === filters.sectorId) openingBalance += t.quantity;
            if (t.from_sector_id === filters.sectorId) openingBalance -= t.quantity;
          });

        allLoans
          .filter(l => l.vasilhame_id === product.id && isBefore(parseISO(l.loan_date), reportDate) && !isBefore(parseISO(l.loan_date), stockStartDate))
          .forEach(l => {
              const sale = allSales.find(s => s.id === l.sale_id);
              if (sale && sale.sector_id === filters.sectorId) {
                  openingBalance -= l.loan_quantity;
              }
          });

        // 3. Calcular cada tipo de movimentação que ocorreu DURANTE o dia do relatório
        
        // Quantidade Comprada no dia
        const qtdeComprada = allPurchases
          .filter(p => p.sector_id === filters.sectorId && p.items.some(i => i.product_id === product.id) && parseISO(p.purchase_date) >= reportDate && parseISO(p.purchase_date) <= endOfReportDate)
          .flatMap(p => p.items.filter(i => i.product_id === product.id))
          .reduce((sum, i) => sum + i.quantity, 0);

        // Quantidade Vendida no dia
        const qtdeVendida = allSales
          .filter(s => s.sector_id === filters.sectorId && s.items.some(i => i.product_id === product.id) && parseISO(s.sale_date) >= reportDate && parseISO(s.sale_date) <= endOfReportDate)
          .flatMap(s => s.items.filter(i => i.product_id === product.id))
          .reduce((sum, i) => sum + i.quantity, 0);

        // Quantidade Transferida (entrada - saída) no dia
        const transfersIn = allTransfers
          .filter(t => t.product_id === product.id && t.to_sector_id === filters.sectorId && parseISO(t.transfer_date) >= reportDate && parseISO(t.transfer_date) <= endOfReportDate)
          .reduce((sum, t) => sum + t.quantity, 0);

        const transfersOut = allTransfers
          .filter(t => t.product_id === product.id && t.from_sector_id === filters.sectorId && parseISO(t.transfer_date) >= reportDate && parseISO(t.transfer_date) <= endOfReportDate)
          .reduce((sum, t) => sum + t.quantity, 0);

        const qtdeTransferida = transfersIn - transfersOut;

        // Quantidade de Empréstimos de Vasilhame no dia (considerada como saída)
        const qtdeEmprestada = allLoans
          .filter(l => l.vasilhame_id === product.id && parseISO(l.loan_date) >= reportDate && parseISO(l.loan_date) <= endOfReportDate)
          .filter(l => {
              const sale = allSales.find(s => s.id === l.sale_id);
              return sale && sale.sector_id === filters.sectorId;
          })
          .reduce((sum, l) => sum + l.loan_quantity, 0);

        // Quantidade Baixada/Retirada no dia
        // Aqui você pode implementar a lógica para produtos retirados pelos clientes
        // Por enquanto, vou usar os empréstimos como proxy para "produtos a retirar"
        // Se houver uma entidade ProductPickup, seria allPickups.filter(...).reduce(...)
        const qtdeBaixada = qtdeEmprestada; 

        // Calcular saldo final
        const saldoFinal = openingBalance + qtdeComprada - qtdeVendida + qtdeTransferida - qtdeBaixada;

        // Apenas incluir produtos que tiveram estoque inicial ou movimentação no dia
        if(openingBalance !== 0 || qtdeComprada !== 0 || qtdeVendida !== 0 || qtdeTransferida !== 0 || qtdeBaixada !== 0) {
            return {
              productId: product.id,
              productName: product.name,
              estoqueInicial: openingBalance,
              qtdeVendida,
              qtdeComprada,
              qtdeTransferida,
              qtdeBaixada,
              saldoFinal,
            };
        }
        return null;
      }).filter(Boolean); // Remove entradas nulas

      setReportData(calculatedData);

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({ title: "Erro", description: "Falha ao gerar relatório. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast, currentUser]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Relatório de Movimentação de Estoque</h1>
          <p className="text-slate-600">Analise a movimentação detalhada de produtos por setor em uma data específica.</p>
        </div>

        <Card className="mb-8 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5"/>Filtros do Relatório</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label>Setor de Estoque *</Label>
              <Select value={filters.sectorId} onValueChange={(v) => handleFilterChange('sectorId', v)}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione um setor" /></SelectTrigger>
                <SelectContent>
                  {sectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Data do Estoque</Label>
              <Input type="date" value={filters.reportDate} onChange={(e) => handleFilterChange('reportDate', e.target.value)} className="bg-white" />
            </div>
            <Button onClick={handleGenerateReport} disabled={isLoading} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Estoque Inicial</TableHead>
                    <TableHead className="text-red-600">Qtde Vendida</TableHead>
                    <TableHead className="text-green-600">Qtde Comprada</TableHead>
                    <TableHead className="text-blue-600">Qtde Transferida</TableHead>
                    <TableHead className="text-orange-600">Qtde Baixada Produtos a Retirar</TableHead>
                    <TableHead className="font-bold">Saldo Final do Dia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto my-8" /></TableCell></TableRow>
                  ) : reportData.length > 0 ? (
                    reportData.map(item => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell>{item.estoqueInicial}</TableCell>
                        <TableCell className="text-red-600">{item.qtdeVendida > 0 ? item.qtdeVendida : '-'}</TableCell>
                        <TableCell className="text-green-600">{item.qtdeComprada > 0 ? item.qtdeComprada : '-'}</TableCell>
                        <TableCell className={`${item.qtdeTransferida > 0 ? 'text-green-600' : item.qtdeTransferida < 0 ? 'text-red-600' : ''}`}>
                          {item.qtdeTransferida !== 0 ? item.qtdeTransferida : '-'}
                        </TableCell>
                        <TableCell className="text-orange-600">{item.qtdeBaixada > 0 ? item.qtdeBaixada : '-'}</TableCell>
                        <TableCell className="font-bold text-lg">{item.saldoFinal}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Nenhum dado para exibir. Por favor, gere um relatório.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
