import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Plus, AlertCircle } from "lucide-react";
import { StockTransfer } from "@/entities/StockTransfer";
import { ProductStock } from "@/entities/ProductStock";
import { Product } from "@/entities/Product";
import { Sector } from "@/entities/Sector";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { formatDateOnly } from "@/utils";

export default function StockTransferPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [productStocks, setProductStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const initialTransferState = {
    transferNumber: `TRF-${Date.now()}`,
    productId: "",
    fromSectorId: "",
    toSectorId: "",
    quantity: 1,
    transferDate: formatDateOnly(new Date(), "yyyy-MM-dd"),
    notes: "",
  };

  const [currentTransfer, setCurrentTransfer] = useState(initialTransferState);
  const [availableStock, setAvailableStock] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productsData, sectorsData, transfersData, stocksData] =
        await Promise.all([
          Product.filter({ active: true }),
          Sector.filter({ active: true }),
          StockTransfer.filter({}, { sort: "-createdAt" }),
          ProductStock.filter(),
        ]);

      setProducts(productsData);
      setSectors(sectorsData);
      setTransfers(transfersData);
      setProductStocks(stocksData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ProductStock already stores the current balance maintained by the backend.
  useEffect(() => {
    if (currentTransfer.productId && currentTransfer.fromSectorId) {
      const fromSector = sectors.find(
        (sector) => sector.id === currentTransfer.fromSectorId,
      );
      const ownerSectorId = fromSector?.isOwnStock
        ? fromSector.id
        : fromSector?.masterSectorId || fromSector?.id;
      const stock = productStocks.find(
        (entry) =>
          entry.productId === currentTransfer.productId &&
          entry.sectorId === ownerSectorId,
      );
      setAvailableStock(Number(stock?.quantity || 0));
    } else {
      setAvailableStock(0);
    }
  }, [
    currentTransfer.productId,
    currentTransfer.fromSectorId,
    productStocks,
    sectors,
  ]);

  const handleProductChange = (productId) => {
    setCurrentTransfer((prev) => ({
      ...prev,
      productId: productId,
    }));
  };

  const handleFromSectorChange = (sectorId) => {
    setCurrentTransfer((prev) => ({
      ...prev,
      fromSectorId: sectorId,
    }));
  };

  const handleToSectorChange = (sectorId) => {
    setCurrentTransfer((prev) => ({
      ...prev,
      toSectorId: sectorId,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await StockTransfer.create({
        productId: currentTransfer.productId,
        fromSectorId: currentTransfer.fromSectorId,
        toSectorId: currentTransfer.toSectorId,
        quantity: currentTransfer.quantity,
        transferDate: currentTransfer.transferDate,
        notes: currentTransfer.notes,
      });

      toast({
        title: "Sucesso!",
        description: "Transferência realizada com sucesso.",
      });

      await loadData();
      resetForm();
    } catch (error) {
      console.error("Erro ao realizar transferência:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Não foi possível realizar a transferência.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCurrentTransfer({
      ...initialTransferState,
      transferNumber: `TRF-${Date.now()}`,
    });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Transferência de Estoque
          </h1>
          <p className="text-slate-600">
            Transfira produtos entre diferentes setores de estoque.
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Transferência
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                Nova Transferência de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Setor de Origem *</Label>
                    <Select
                      value={currentTransfer.fromSectorId}
                      onValueChange={handleFromSectorChange}
                    >
                      <SelectTrigger className="bg-white/80">
                        <SelectValue placeholder="Selecione o setor de origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map((sector) => (
                          <SelectItem key={sector.id} value={sector.id}>
                            {sector.name} {sector.isMain ? "(Principal)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Setor de Destino *</Label>
                    <Select
                      value={currentTransfer.toSectorId}
                      onValueChange={handleToSectorChange}
                    >
                      <SelectTrigger className="bg-white/80">
                        <SelectValue placeholder="Selecione o setor de destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors
                          .filter(
                            (sector) =>
                              sector.id !== currentTransfer.fromSectorId,
                          )
                          .map((sector) => (
                            <SelectItem key={sector.id} value={sector.id}>
                              {sector.name} {sector.isMain ? "(Principal)" : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Produto *</Label>
                    <Select
                      value={currentTransfer.productId}
                      onValueChange={handleProductChange}
                    >
                      <SelectTrigger className="bg-white/80">
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Data da Transferência *</Label>
                    <Input
                      type="date"
                      value={currentTransfer.transferDate}
                      onChange={(e) =>
                        setCurrentTransfer((prev) => ({
                          ...prev,
                          transferDate: e.target.value,
                        }))
                      }
                      className="bg-white/80"
                      required
                    />
                  </div>
                </div>

                {currentTransfer.productId && currentTransfer.fromSectorId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        Estoque Disponível
                      </span>
                    </div>
                    <p className="text-blue-700">
                      Quantidade disponível no setor de origem:{" "}
                      <strong>{availableStock}</strong>
                    </p>
                  </div>
                )}

                <div>
                  <Label>Quantidade a Transferir *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={currentTransfer.quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setCurrentTransfer((prev) => ({
                        ...prev,
                        quantity: value,
                      }));
                    }}
                    className="bg-white/80"
                    required
                  />
                </div>

                <div>
                  <Label>Observações</Label>
                  <Input
                    value={currentTransfer.notes}
                    onChange={(e) =>
                      setCurrentTransfer((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Observações sobre a transferência"
                    className="bg-white/80"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Realizar Transferência
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Histórico de Transferências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Transferência</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Setor Origem</TableHead>
                    <TableHead>Setor Destino</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : transfers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-slate-500"
                      >
                        Nenhuma transferência encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-medium">
                          {transfer.transferNumber}
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(transfer.transferDate),
                            "dd/MM/yyyy",
                          )}
                        </TableCell>
                        <TableCell>{transfer.productName}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200"
                          >
                            {transfer.fromSectorName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            {transfer.toSectorName}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {transfer.quantity}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {transfer.createdByName}
                        </TableCell>
                        <TableCell className="text-sm">
                          {transfer.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))
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
