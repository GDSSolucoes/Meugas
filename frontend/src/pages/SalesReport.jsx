import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Receipt,
  DollarSign,
  TrendingUp,
  Filter,
  Search as SearchIcon,
} from "lucide-react";
import { Sale } from "@/entities/Sale";
import { format } from "date-fns";
import { formatDateOnly } from "@/utils";

export default function SalesReportPage() {
  const [displayedSales, setDisplayedSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({
    startDate: formatDateOnly(new Date(), "yyyy-MM-dd"),
    endDate: formatDateOnly(new Date(), "yyyy-MM-dd"),
  });
  const [totals, setTotals] = useState({
    totalRevenue: 0,
    totalSalesCount: 0,
    averageTicket: 0,
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const result = await Sale.searchAdvanced({
        limit: 1000,
        sort: "createdAt",
        order: "desc",
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      setDisplayedSales(result.data);
      setTotals({
        totalRevenue: result.totalRevenue,
        totalSalesCount: result.totalSalesCount,
        averageTicket: result.averageTicket,
      });
      setHasSearched(true);
    } catch (error) {
      console.error("Erro ao pesquisar vendas:", error);
      setDisplayedSales([]);
      setTotals({
        totalRevenue: 0,
        totalSalesCount: 0,
        averageTicket: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Relatório de Vendas
          </h1>
          <p className="text-slate-600">
            Análise detalhada das vendas por período
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="bg-white"
                />
              </div>
              <div>
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="bg-white"
                />
              </div>
              <div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-full"
                >
                  <SearchIcon className="w-4 h-4 mr-2" />
                  {isLoading ? "Pesquisando..." : "Pesquisar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Vendas
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totals.totalSalesCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Faturamento Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totals.totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ticket Médio
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totals.averageTicket.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle>Vendas no Período</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Carregando...</p>
            ) : !hasSearched ? (
              <p className="text-center py-8 text-slate-500">
                Utilize os filtros acima e clique em <strong>Pesquisar</strong>{" "}
                para visualizar o relatório de vendas
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Qtd Itens</TableHead>
                      <TableHead>Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedSales.length > 0 ? (
                      displayedSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">
                            {sale.saleNumber}
                          </TableCell>
                          <TableCell>
                            {format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm")}
                          </TableCell>
                          <TableCell>{sale.personName}</TableCell>
                          <TableCell>{sale.items?.length || 0}</TableCell>
                          <TableCell className="font-bold">
                            R$ {(sale.totalAmount || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-slate-500"
                        >
                          Nenhuma venda encontrada no período selecionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
