import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle }
from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Warehouse, Save, Filter, ArrowRightLeft, BarChart3 } from "lucide-react";
import { ProductStock } from "@/entities/ProductStock";
import { Sector } from "@/entities/Sector";
import { Product } from "@/entities/Product";
import { User } from "@/entities/User";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from 'date-fns';

export default function StockMovement() {
  const { toast } = useToast();
  const [stocks, setStocks] = useState([]); // Will now hold stocks for the *selected* sector
  const [products, setProducts] = useState([]); // Will hold all active products for the company
  const [sectors, setSectors] = useState([]); // Will hold all sectors for the company
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // Added state for current user
  const [companyId, setCompanyId] = useState(null); // Added state for company ID

  // Effect 1: Load user, sectors, and set initial selected sector (runs once on mount)
  useEffect(() => {
    const initializeAppData = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
        setCompanyId(user.companyId);

        const sectorData = await Sector.filter({ companyId: user.companyId, active: true }); // Filter sectors by company
        setSectors(sectorData);

        // Define main sector as default or first available
        if (sectorData.length > 0) {
          const mainSector = sectorData.find(s => s.isMain) || sectorData[0];
          setSelectedSectorId(mainSector.id);
        } else {
            setSelectedSectorId(''); // No sectors available
        }
      } catch (error) {
        console.error("Erro ao inicializar dados:", error);
        toast({ title: "Erro", description: "Não foi possível carregar os dados iniciais.", variant: "destructive" });
      } finally {
        // isLoading is set to false after initial data load, subsequent loads handled by loadStockForSector
        // Only set to false here if selectedSectorId is not set, otherwise loadStockForSector will handle it
        if (!selectedSectorId) { // Check if a sector was already set by default
          setIsLoading(false);
        }
      }
    };
    initializeAppData();
  }, [toast]); // Runs once on mount, toast is a stable function

  // Effect 2: Load products and stocks for the selected sector
  const loadStockForSector = useCallback(async () => {
    if (!selectedSectorId || !companyId || !currentUser) {
      // If we don't have enough info, clear stocks and stop loading
      setStocks([]); 
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [allProducts, existingStocksForSector, allSectors] = await Promise.all([
        Product.filter({ companyId: companyId, active: true }), // Get only active products for the company
        ProductStock.filter({ sectorId: selectedSectorId, companyId: companyId }), // Get stocks specifically for the selected sector and company
        Sector.filter({ companyId: companyId }) // Re-fetch sectors to ensure up-to-date names, filtered by company
      ]);

      const currentSector = allSectors.find(s => s.id === selectedSectorId);
      if (!currentSector) {
        console.warn(`Setor com ID ${selectedSectorId} não encontrado para a empresa ${companyId}.`);
        setStocks([]);
        setProducts(allProducts); 
        setIsLoading(false);
        return;
      }
      
      const newStockEntries = [];
      // Use a Set for efficient lookup of product IDs that already have stock in this sector
      const existingProductIdsInSector = new Set(existingStocksForSector.map(s => s.productId));

      for (const product of allProducts) {
        // If an active product does not have an existing stock entry in the current sector, create one
        if (!existingProductIdsInSector.has(product.id)) {
          const newStock = await ProductStock.create({
            productId: product.id,
            productName: product.name,
            sectorId: selectedSectorId,
            sectorName: currentSector.name,
            quantity: 0,
            initialDate: format(new Date(), 'yyyy-MM-dd'),
            companyId: companyId, // Add companyId
            companyName: currentUser.companyName, // Add companyName
            createdByName: currentUser.fullName
          });
          newStockEntries.push(newStock);
        }
      }
      
      setProducts(allProducts); // Keep all active products in state
      // Update stocks state with existing stocks for the sector PLUS any newly created ones
      setStocks([...existingStocksForSector, ...newStockEntries]);

    } catch (error) {
      console.error("Erro ao carregar dados de estoque para o setor:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os dados do setor.", variant: "destructive" });
      setStocks([]); // Clear stocks on error
    } finally {
      setIsLoading(false);
    }
  }, [selectedSectorId, companyId, currentUser, toast]); // Added companyId and currentUser to dependencies

  // Effect 3: Trigger stock loading when the selected sector or company ID changes
  useEffect(() => {
    loadStockForSector();
  }, [loadStockForSector]); 

  // The filteredStocks memo is now simplified because 'stocks' state already holds the data for the selected sector
  const filteredStocks = useMemo(() => {
    return stocks; // 'stocks' state is already filtered by selectedSectorId
  }, [stocks]);

  const handleInputChange = (stockId, field, value) => {
    setStocks(currentStocks =>
      currentStocks.map(stock =>
        stock.id === stockId ? { ...stock, [field]: value } : stock
      )
    );
  };

  const handleSave = async (stock) => {
    try {
      // Ensure quantity is a number, default to 0 if not
      const updatedQuantity = Number(stock.quantity) || 0;
      await ProductStock.update(stock.id, {
        quantity: updatedQuantity,
        initialDate: stock.initialDate
      });
      toast({ title: "Sucesso", description: "Estoque atualizado com sucesso." });
    } catch (error) {
      console.error("Erro ao salvar estoque:", error);
      toast({ title: "Erro", description: "Não foi possível salvar as alterações.", variant: "destructive" });
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Estoque</h1>
          <p className="text-slate-600">Gerencie a quantidade e data inicial do estoque por setor.</p>
        </div>

        <Card className="mb-8 bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Opções
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <Label className="mb-2 block">Filtrar por Setor</Label>
                        <Select value={selectedSectorId} onValueChange={setSelectedSectorId} disabled={!companyId || isLoading}>
                            <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder="Selecione um setor" />
                            </SelectTrigger>
                            <SelectContent>
                                {sectors.map(sector => (
                                    <SelectItem key={sector.id} value={sector.id}>
                                        {sector.name} {sector.isMain ? '(Principal)' : ''}
                                    </SelectItem>
                                ))}
                                {sectors.length === 0 && (
                                    <SelectItem value={null} disabled>Nenhum setor disponível</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-full md:w-auto">
                        <Link to={createPageUrl("StockTransfer")}>
                            <Button variant="outline" className="w-full bg-white hover:bg-slate-50">
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                Transferência Estoque
                            </Button>
                        </Link>
                    </div>
                    <div className="w-full md:w-auto">
                        <Link to={createPageUrl("StockReport")}>
                            <Button variant="outline" className="w-full bg-white hover:bg-slate-50">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Relatório de Estoque
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Warehouse className="w-5 h-5"/>
                Produtos em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead className="w-48">Data Inicial</TableHead>
                    <TableHead className="w-40">Quantidade</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow>
                  ) : (
                    filteredStocks.map(stock => (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">{stock.productName}</TableCell>
                        <TableCell>{stock.sectorName}</TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={stock.initialDate ? format(parseISO(stock.initialDate), 'yyyy-MM-dd') : ''}
                            onChange={(e) => handleInputChange(stock.id, 'initialDate', e.target.value)}
                            className="bg-white/80"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={stock.quantity}
                            onChange={(e) => handleInputChange(stock.id, 'quantity', e.target.value)}
                            className="bg-white/80"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => handleSave(stock)} className="text-white hover:opacity-90" style={{ backgroundColor: '#e78b3a' }}>
                            <Save className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                   {!isLoading && filteredStocks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        Nenhum produto encontrado para este setor.
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