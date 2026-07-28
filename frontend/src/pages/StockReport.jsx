import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Filter, Loader2 } from "lucide-react";
import { Sector } from "@/entities/Sector";
import { SectorMaster } from "@/entities/SectorMaster";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { User } from "@/entities/User";
import { api } from "@/api/apiClient";

export default function StockReportPage() {
  const { toast } = useToast();
  const [sectorOptions, setSectorOptions] = useState([]); // Combined list: [{id, name, type: 'sector' | 'master'}]
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    sectorId: "", // Format: "sector:<id>" or "master:<id>"
    reportDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        // Carregar setores que possuem estoque proprio E setores master
        const [sectorsData, sectorMastersData] = await Promise.all([
          Sector.filter({
            companyId: user.companyId,
            active: true,
            isOwnStock: true,
          }),
          SectorMaster.filter({ companyId: user.companyId, active: true }),
        ]);

        // Combinar em uma lista unica com prefixo para diferenciar
        const combinedOptions = [
          ...sectorsData.map((s) => ({
            id: `sector:${s.id}`,
            name: s.name,
            type: "sector",
          })),
          ...sectorMastersData.map((m) => ({
            id: `master:${m.id}`,
            name: `${m.name} (Master)`,
            type: "master",
          })),
        ];

        setSectorOptions(combinedOptions);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao carregar dados iniciais.",
          variant: "destructive",
        });
      }
    };
    loadInitialData();
  }, [toast]);

  const handleGenerateReport = useCallback(async () => {
    if (!filters.sectorId) {
      toast({
        title: "Atenção",
        description: "Por favor, selecione um setor.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setReportData([]);

    try {
      if (!currentUser) {
        toast({
          title: "Erro",
          description:
            "Usuário não encontrado. Por favor, recarregue a página.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const response = await api.post("/reports/stock-movement", {
        sectorId: filters.sectorId,
        reportDate: filters.reportDate,
      });

      setReportData(response.data || []);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro",
        description: "Falha ao gerar relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast, currentUser]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Relatório de Movimentação de Estoque
          </h1>
          <p className="text-slate-600">
            Analise a movimentação detalhada de produtos por setor em uma data
            específica.
          </p>
        </div>

        <Card className="mb-8 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros do Relatório
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label>Setor de Estoque *</Label>
              <Select
                value={filters.sectorId}
                onValueChange={(v) => handleFilterChange("sectorId", v)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {sectorOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Data do Estoque</Label>
              <Input
                type="date"
                value={filters.reportDate}
                onChange={(e) =>
                  handleFilterChange("reportDate", e.target.value)
                }
                className="bg-white"
              />
            </div>
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4 mr-2" />
              )}
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
                    <TableHead className="text-green-600">
                      Qtde Comprada
                    </TableHead>
                    <TableHead className="text-red-600">Qtde Vendida</TableHead>
                    <TableHead className="text-blue-600">
                      Transf. Entrada
                    </TableHead>
                    <TableHead className="text-purple-600">
                      Transf. Saída
                    </TableHead>
                    <TableHead className="text-amber-600">
                      Empréstimos
                    </TableHead>
                    <TableHead className="text-teal-600">
                      Devoluções
                    </TableHead>
                    <TableHead className="text-indigo-600">
                      A Retirar
                    </TableHead>
                    <TableHead className="text-orange-600">
                      Retirados
                    </TableHead>
                    <TableHead className="font-bold">
                      Saldo Final
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto my-8" />
                      </TableCell>
                    </TableRow>
                  ) : reportData.length > 0 ? (
                    reportData.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell>{item.estoqueInicial}</TableCell>
                        <TableCell className="text-green-600">
                          {item.qtdeComprada > 0 ? item.qtdeComprada : "-"}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {item.qtdeVendida > 0 ? item.qtdeVendida : "-"}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          {item.qtdeTransferidaEntrada > 0
                            ? item.qtdeTransferidaEntrada
                            : "-"}
                        </TableCell>
                        <TableCell className="text-purple-600">
                          {item.qtdeTransferidaSaida > 0
                            ? item.qtdeTransferidaSaida
                            : "-"}
                        </TableCell>
                        <TableCell className="text-amber-600">
                          {item.qtdeEmprestimos > 0
                            ? item.qtdeEmprestimos
                            : "-"}
                        </TableCell>
                        <TableCell className="text-teal-600">
                          {item.qtdeDevolucoes > 0
                            ? item.qtdeDevolucoes
                            : "-"}
                        </TableCell>
                        <TableCell className="text-indigo-600">
                          {item.qtdeARetirar > 0 ? item.qtdeARetirar : "-"}
                        </TableCell>
                        <TableCell className="text-orange-600">
                          {item.qtdeRetirada > 0 ? item.qtdeRetirada : "-"}
                        </TableCell>
                        <TableCell className="font-bold text-lg">
                          {item.saldoFinal}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        className="text-center py-8 text-slate-500"
                      >
                        Nenhum dado para exibir. Por favor, gere um relatório.
                      </TableCell>
                    </TableRow>
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
