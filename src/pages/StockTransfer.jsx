
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Plus, AlertCircle } from "lucide-react";
import { StockTransfer } from "@/entities/StockTransfer";
import { ProductStock } from "@/entities/ProductStock";
import { Product } from "@/entities/Product";
import { Sector } from "@/entities/Sector";
import { User } from "@/entities/User";
import { useToast } from "@/components/ui/use-toast";
import { Sale } from "@/entities/Sale";
import { Purchase } from "@/entities/Purchase";
import { VasilhameLoan } from "@/entities/VasilhameLoan";
import { ProductPickup } from "@/entities/ProductPickup";
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
    transfer_number: `TRF-${Date.now()}`,
    product_id: '',
    product_name: '',
    from_sector_id: '',
    from_sector_name: '',
    to_sector_id: '',
    to_sector_name: '',
    quantity: 1,
    transfer_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    created_by_name: ''
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
        Product.list().then(products => products.filter(p => p.active === true)),
        Sector.list().then(sectors => sectors.filter(s => s.active === true)),
        StockTransfer.list('-created_date'),
        ProductStock.list(),
        Sale.list(),
        Purchase.list(),
        VasilhameLoan.list(),
        ProductPickup.list().catch(() => []) // Em caso de erro, retorna array vazio
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
    const stockEntry = productStocks.find(s => s.product_id === productId && s.sector_id === sectorId);
    let currentStock = stockEntry ? (stockEntry.quantity || 0) : 0;
    const stockStartDate = stockEntry && stockEntry.initial_date ? parseISO(stockEntry.initial_date) : new Date(0); // Use epoch if no initial_date

    // 2. Somar compras (entrada)
    const purchases = allPurchases.filter(p =>
      p.sector_id === sectorId &&
      p.items &&
      p.items.some(i => i.product_id === productId) &&
      parseISO(p.purchase_date) >= stockStartDate
    );

    purchases.forEach(purchase => {
      const purchaseItems = purchase.items.filter(i => i.product_id === productId);
      purchaseItems.forEach(item => {
        currentStock += item.quantity || 0;
      });
    });

    // 3. Subtrair vendas (saída)
    const sales = allSales.filter(s =>
      s.sector_id === sectorId &&
      s.items &&
      s.items.some(i => i.product_id === productId) &&
      parseISO(s.sale_date) >= stockStartDate
    );

    sales.forEach(sale => {
      const saleItems = sale.items.filter(i => i.product_id === productId);
      saleItems.forEach(item => {
        currentStock -= item.quantity || 0;
      });
    });

    // 4. Considerar transferências
    const transfersToSector = transfers.filter(t =>
      t.product_id === productId &&
      t.to_sector_id === sectorId &&
      parseISO(t.transfer_date) >= stockStartDate
    );

    const transfersFromSector = transfers.filter(t =>
      t.product_id === productId &&
      t.from_sector_id === sectorId &&
      parseISO(t.transfer_date) >= stockStartDate
    );

    transfersToSector.forEach(transfer => {
      currentStock += transfer.quantity || 0;
    });

    transfersFromSector.forEach(transfer => {
      currentStock -= transfer.quantity || 0;
    });

    // 5. Subtrair empréstimos de vasilhame (saída)
    const loans = allLoans.filter(l =>
      l.vasilhame_id === productId &&
      parseISO(l.loan_date) >= stockStartDate
    );

    loans.forEach(loan => {
      const sale = allSales.find(s => s.id === loan.sale_id);
      if (sale && sale.sector_id === sectorId) { // Ensure loan is from this sector's sales
        currentStock -= loan.loan_quantity || 0;
      }
    });

    // 6. Subtrair retiradas de produtos (saída)
    const pickups = allPickups.filter(p =>
      p.product_id === productId &&
      parseISO(p.sale_date) >= stockStartDate
    );

    pickups.forEach(pickup => {
      const sale = allSales.find(s => s.id === pickup.sale_id);
      if (sale && sale.sector_id === sectorId) { // Ensure pickup is from this sector's sales
        currentStock -= pickup.collected_quantity || 0;
      }
    });

    return Math.max(0, currentStock); // Não permitir estoque negativo na visualização
  }, [productStocks, allSales, allPurchases, transfers, allLoans, allPickups]);

  // Atualizar estoque disponível quando produto ou setor origem mudar
  useEffect(() => {
    if (currentTransfer.product_id && currentTransfer.from_sector_id) {
      const realStock = calculateRealStock(currentTransfer.product_id, currentTransfer.from_sector_id);
      setAvailableStock(realStock);
    } else {
      setAvailableStock(0);
    }
  }, [currentTransfer.product_id, currentTransfer.from_sector_id, calculateRealStock]);

  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    setCurrentTransfer(prev => ({
      ...prev,
      product_id: productId,
      product_name: product ? product.name : ''
    }));
  };

  const handleFromSectorChange = (sectorId) => {
    const sector = sectors.find(s => s.id === sectorId);
    setCurrentTransfer(prev => ({
      ...prev,
      from_sector_id: sectorId,
      from_sector_name: sector ? sector.name : ''
    }));
  };

  const handleToSectorChange = (sectorId) => {
    const sector = sectors.find(s => s.id === sectorId);
    setCurrentTransfer(prev => ({
      ...prev,
      to_sector_id: sectorId,
      to_sector_name: sector ? sector.name : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (currentTransfer.from_sector_id === currentTransfer.to_sector_id) {
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
      const user = await User.me();
      const transferData = {
        ...currentTransfer,
        created_by_name: user.full_name
      };

      // 1. Registrar a transferência
      await StockTransfer.create(transferData);

      // 2. Atualizar estoque do setor de origem (diminuir)
      const fromStockEntry = productStocks.find(
        s => s.product_id === currentTransfer.product_id &&
             s.sector_id === currentTransfer.from_sector_id
      );

      if (fromStockEntry) {
        const newQuantity = (fromStockEntry.quantity || 0) - currentTransfer.quantity;
        await ProductStock.update(fromStockEntry.id, { quantity: newQuantity });
      } else {
         // Should not happen if availableStock > 0 and stock entry exists, but as a fallback
        await ProductStock.create({
          product_id: currentTransfer.product_id,
          product_name: currentTransfer.product_name,
          sector_id: currentTransfer.from_sector_id,
          sector_name: currentTransfer.from_sector_name,
          quantity: -currentTransfer.quantity, // Negative quantity as it's a deduction from a non-existent entry (conceptually)
          initial_date: currentTransfer.transfer_date,
          created_by_name: user.full_name
        });
      }

      // 3. Atualizar estoque do setor de destino (aumentar)
      const toStockEntry = productStocks.find(
        s => s.product_id === currentTransfer.product_id &&
             s.sector_id === currentTransfer.to_sector_id
      );

      if (toStockEntry) {
        const newQuantity = (toStockEntry.quantity || 0) + currentTransfer.quantity;
        await ProductStock.update(toStockEntry.id, { quantity: newQuantity });
      } else {
        // Criar nova entrada de estoque no setor destino
        await ProductStock.create({
          product_id: currentTransfer.product_id,
          product_name: currentTransfer.product_name,
          sector_id: currentTransfer.to_sector_id,
          sector_name: currentTransfer.to_sector_name,
          quantity: currentTransfer.quantity,
          initial_date: currentTransfer.transfer_date,
          created_by_name: user.full_name
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
      transfer_number: `TRF-${Date.now()}`
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
                      value={currentTransfer.from_sector_id}
                      onValueChange={handleFromSectorChange}
                    >
                      <SelectTrigger className="bg-white/80">
                        <SelectValue placeholder="Selecione o setor de origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map(sector => (
                          <SelectItem key={sector.id} value={sector.id}>
                            {sector.name} {sector.is_main ? '(Principal)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Setor de Destino *</Label>
                    <Select
                      value={currentTransfer.to_sector_id}
                      onValueChange={handleToSectorChange}
                    >
                      <SelectTrigger className="bg-white/80">
                        <SelectValue placeholder="Selecione o setor de destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors
                          .filter(sector => sector.id !== currentTransfer.from_sector_id)
                          .map(sector => (
                            <SelectItem key={sector.id} value={sector.id}>
                              {sector.name} {sector.is_main ? '(Principal)' : ''}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Produto *</Label>
                    <Select
                      value={currentTransfer.product_id}
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
                      value={currentTransfer.transfer_date}
                      onChange={(e) => setCurrentTransfer(prev => ({
                        ...prev,
                        transfer_date: e.target.value
                      }))}
                      className="bg-white/80"
                      required
                    />
                  </div>
                </div>

                {currentTransfer.product_id && currentTransfer.from_sector_id && (
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
                          {transfer.transfer_number}
                        </TableCell>
                        <TableCell>
                          {format(new Date(transfer.transfer_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>{transfer.product_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {transfer.from_sector_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {transfer.to_sector_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {transfer.quantity}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {transfer.created_by_name}
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
