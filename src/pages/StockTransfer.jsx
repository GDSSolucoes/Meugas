
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Plus, AlertCircle } from "lucide-react";
import { StockTransfers } from "@/entities/StockTransfers";
import { ProductStocks } from "@/entities/ProductStocks";
import { Products } from "@/entities/Products";
import { Sectors } from "@/entities/Sectors";
import { Users } from "@/entities/Users";
import { useToast } from "@/components/ui/use-toast";
import { Sales } from "@/entities/Sales";
import { Purchases } from "@/entities/Purchases";
import { VasilhameLoans } from "@/entities/VasilhameLoans";
import { ProductPickups } from "@/entities/ProductPickups";
import { format, parseISO } from "date-fns";

export default function StockTransferPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [productStocks, setProductStocks] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [allPickups, setAllPickups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const initialTransferState = {
    transferNumber: `TRF-${Date.now()}`,
    productId: '',
    productName: '',
    fromSectorId: '',
    fromSectorName: '',
    toSectorId: '',
    toSectorName: '',
    quantity: 1,
    transferDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    createdByName: ''
  };

  const [currentTransfer, setCurrentTransfer] = useState(initialTransferState);
  const [availableStock, setAvailableStock] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        productsData,
        sectorsData,
        transfersData,
        stocksData,
        salesData,
        purchasesData,
        loansData,
        pickupsData
      ] = await Promise.all([
        Products.list().then(products => products.filter(p => p.active === true)),
        Sectors.list().then(sectors => sectors.filter(s => s.active === true)),
        StockTransfers.list('-createdDate'),
        ProductStocks.list(),
        Sales.list(),
        Purchases.list(),
        VasilhameLoans.list(),
        ProductPickups.list().catch(() => []) // Em caso de erro, retorna array vazio
      ]);

      setProducts(productsData);
      setSectors(sectorsData);
      setTransfers(transfersData);
      setProductStocks(stocksData);
      setAllSales(salesData);
      setAllPurchases(purchasesData);
      setAllLoans(loansData);
      setAllPickups(pickupsData);
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

  // Calcular estoque atual considerando todas as movimentações
  const calculateRealStock = useCallback((productId, sectorId) => {
    if (!productId || !sectorId) return 0;

    // 1. Estoque inicial registrado na ProductStock
    const stockEntry = productStocks.find(s => s.productId === productId && s.sectorId === sectorId);
    let currentStock = stockEntry ? (stockEntry.quantity || 0) : 0;
    const stockStartDate = stockEntry && stockEntry.initialDate ? parseISO(stockEntry.initialDate) : new Date(0); // Use epoch if no initialDate

    // 2. Somar compras (entrada)
    const purchases = allPurchases.filter(p =>
      p.sectorId === sectorId &&
      p.items &&
      p.items.some(i => i.productId === productId) &&
      parseISO(p.purchaseDate) >= stockStartDate
    );

    purchases.forEach(purchase => {
      const purchaseItems = purchase.items.filter(i => i.productId === productId);
      purchaseItems.forEach(item => {
        currentStock += item.quantity || 0;
      });
    });

    // 3. Subtrair vendas (saída)
    const sales = allSales.filter(s =>
      s.sectorId === sectorId &&
      s.items &&
      s.items.some(i => i.productId === productId) &&
      parseISO(s.saleDate) >= stockStartDate
    );

    sales.forEach(sale => {
      const saleItems = sale.items.filter(i => i.productId === productId);
      saleItems.forEach(item => {
        currentStock -= item.quantity || 0;
      });
    });

    // 4. Considerar transferências
    const transfersToSector = transfers.filter(t =>
      t.productId === productId &&
      t.toSectorId === sectorId &&
      parseISO(t.transferDate) >= stockStartDate
    );

    const transfersFromSector = transfers.filter(t =>
      t.productId === productId &&
      t.fromSectorId === sectorId &&
      parseISO(t.transferDate) >= stockStartDate
    );

    transfersToSector.forEach(transfer => {
      currentStock += transfer.quantity || 0;
    });

    transfersFromSector.forEach(transfer => {
      currentStock -= transfer.quantity || 0;
    });

    // 5. Subtrair empréstimos de vasilhame (saída)
    const loans = allLoans.filter(l =>
      l.vasilhameId === productId &&
      parseISO(l.loanDate) >= stockStartDate
    );

    loans.forEach(loan => {
      const sale = allSales.find(s => s.id === loan.saleId);
      if (sale && sale.sectorId === sectorId) { // Ensure loan is from this sector's sales
        currentStock -= loan.loanQuantity || 0;
      }
    });

    // 6. Subtrair retiradas de produtos (saída)
    const pickups = allPickups.filter(p =>
      p.productId === productId &&
      parseISO(p.saleDate) >= stockStartDate
    );

    pickups.forEach(pickup => {
      const sale = allSales.find(s => s.id === pickup.saleId);
      if (sale && sale.sectorId === sectorId) { // Ensure pickup is from this sector's sales
        currentStock -= pickup.collectedQuantity || 0;
      }
    });

    return Math.max(0, currentStock); // Não permitir estoque negativo na visualização
  }, [productStocks, allSales, allPurchases, transfers, allLoans, allPickups]);

  // Atualizar estoque disponível quando produto ou setor origem mudar
  useEffect(() => {
    if (currentTransfer.productId && currentTransfer.fromSectorId) {
      const realStock = calculateRealStock(currentTransfer.productId, currentTransfer.fromSectorId);
      setAvailableStock(realStock);
    } else {
      setAvailableStock(0);
    }
  }, [currentTransfer.productId, currentTransfer.fromSectorId, calculateRealStock]);

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    setCurrentTransfer(prev => ({
      ...prev,
      productId: productId,
      productName: product ? product.name : ''
    }));
  };

  const handleFromSectorChange = (sectorId) => {
    const sector = sectors.find(s => s.id === sectorId);
    setCurrentTransfer(prev => ({
      ...prev,
      fromSectorId: sectorId,
      fromSectorName: sector ? sector.name : ''
    }));
  };

  const handleToSectorChange = (sectorId) => {
    const sector = sectors.find(s => s.id === sectorId);
    setCurrentTransfer(prev => ({
      ...prev,
      toSectorId: sectorId,
      toSectorName: sector ? sector.name : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (currentTransfer.fromSectorId === currentTransfer.toSectorId) {
      toast({
        title: "Erro",
        description: "Os setores de origem e destino não podem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    if (currentTransfer.quantity > availableStock) {
      toast({
        title: "Erro",
        description: `Quantidade insuficiente. Estoque disponível: ${availableStock}`,
        variant: "destructive",
      });
      return;
    }

    if (currentTransfer.quantity <= 0) {
      toast({
        title: "Erro",
        description: "A quantidade deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      const user = await Users.me();
      const transferData = {
        ...currentTransfer,
        createdByName: user.fullName
      };

      // 1. Registrar a transferência
      await StockTransfers.create(transferData);

      // 2. Atualizar estoque do setor de origem (diminuir)
      const fromStockEntry = productStocks.find(
        s => s.productId === currentTransfer.productId &&
             s.sectorId === currentTransfer.fromSectorId
      );

      if (fromStockEntry) {
        const newQuantity = (fromStockEntry.quantity || 0) - currentTransfer.quantity;
        await ProductStocks.update(fromStockEntry.id, { quantity: newQuantity });
      } else {
         // Should not happen if availableStock > 0 and stock entry exists, but as a fallback
        await ProductStocks.create({
          productId: currentTransfer.productId,
          productName: currentTransfer.productName,
          sectorId: currentTransfer.fromSectorId,
          sectorName: currentTransfer.fromSectorName,
          quantity: -currentTransfer.quantity, // Negative quantity as it's a deduction from a non-existent entry (conceptually)
          initialDate: currentTransfer.transferDate,
          createdByName: user.fullName
        });
      }

      // 3. Atualizar estoque do setor de destino (aumentar)
      const toStockEntry = productStocks.find(
        s => s.productId === currentTransfer.productId &&
             s.sectorId === currentTransfer.toSectorId
      );

      if (toStockEntry) {
        const newQuantity = (toStockEntry.quantity || 0) + currentTransfer.quantity;
        await ProductStocks.update(toStockEntry.id, { quantity: newQuantity });
      } else {
        // Criar nova entrada de estoque no setor destino
        await ProductStocks.create({
          productId: currentTransfer.productId,
          productName: currentTransfer.productName,
          sectorId: currentTransfer.toSectorId,
          sectorName: currentTransfer.toSectorName,
          quantity: currentTransfer.quantity,
          initialDate: currentTransfer.transferDate,
          createdByName: user.fullName
        });
      }

      toast({
        title: "Sucesso!",
        description: "Transferência realizada com sucesso.",
      });

      // Recarregar dados e resetar formulário
      await loadData();
      resetForm();

    } catch (error) {
      console.error("Erro ao realizar transferência:", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a transferência.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCurrentTransfer({
      ...initialTransferState,
      transferNumber: `TRF-${Date.now()}`
    });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Transferência de Estoque</h1>
          <p className="text-slate-600">Transfira produtos entre diferentes setores de estoque.</p>
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
                        {sectors.map(sector => (
                          <SelectItem key={sector.id} value={sector.id}>
                            {sector.name} {sector.isMain ? '(Principal)' : ''}
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
                          .filter(sector => sector.id !== currentTransfer.fromSectorId)
                          .map(sector => (
                            <SelectItem key={sector.id} value={sector.id}>
                              {sector.name} {sector.isMain ? '(Principal)' : ''}
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
                        {products.map(product => (
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
                      onChange={(e) => setCurrentTransfer(prev => ({
                        ...prev,
                        transferDate: e.target.value
                      }))}
                      className="bg-white/80"
                      required
                    />
                  </div>
                </div>

                {currentTransfer.productId && currentTransfer.fromSectorId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Estoque Disponível</span>
                    </div>
                    <p className="text-blue-700">
                      Quantidade disponível no setor de origem: <strong>{availableStock}</strong>
                    </p>
                  </div>
                )}

                <div>
                  <Label>Quantidade a Transferir *</Label>
                  <Input
                    type="number"
                    min="1"
                    max={availableStock > 0 ? availableStock : undefined} // Only set max if availableStock is positive
                    value={currentTransfer.quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setCurrentTransfer(prev => ({
                        ...prev,
                        quantity: value
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
                    onChange={(e) => setCurrentTransfer(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    placeholder="Observações sobre a transferência"
                    className="bg-white/80"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
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
                      <TableCell colSpan={8} className="text-center">Carregando...</TableCell>
                    </TableRow>
                  ) : transfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
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
                          {format(new Date(transfer.transferDate), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>{transfer.productName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {transfer.fromSectorName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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
                          {transfer.notes || '-'}
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
