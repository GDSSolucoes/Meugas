import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, AlertTriangle, Edit, Trash2, PackageOpen, Receipt, Info } from "lucide-react";
import { Product } from "@/entities/Product";
import { ProductStock } from "@/entities/ProductStock";
import { Order } from "@/entities/Order";
import  User  from "@/api/providers/user";
import { useToast } from "@/components/ui/use-toast";

export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [vasilhames, setVasilhames] = useState([]);
  const [productStocks, setProductStocks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProduct, setCurrentProduct] = useState({
    id: null,
    name: '',
    code: '',
    category: '',
    unitPrice: 0,
    costPrice: 0,
    minStock: 10,
    vasilhameId: '',
    vasilhameName: '',
    ncm: '',
    cest: '',
    // Removed cfop from currentProduct state
    unidadeTributavel: 'UN',
    icmsOrigem: '0',
    beneficioFiscal: '',
    anpCodigo: '',
    anpDescricao: '',
    valorSemIcmsKg: 0,
    kgPorUnidadeGlp: 0,
    percentualGlp: 0,
    percentualGnNacional: 0,
    percentualGnImportado: 0,
    codif: '',
    pesoLiquido: 0,
    pesoBruto: 0,
    informacoesAdicionaisNfe: '',
    companyId: '',
    companyName: '',
    createdByName: '',
    active: true
  });

  const loadData = useCallback(async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const [productsData, stocksData] = await Promise.all([
        Product.filter({ companyId: user.companyId }).catch(() => []),
        ProductStock.filter({ companyId: user.companyId }).catch(() => [])
      ]);
      
      setProducts(productsData);
      setProductStocks(stocksData);
      setVasilhames(productsData.filter(p => p.category === 'vasilhame' && p.active));
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setProducts([]);
      toast({ title: "Erro", description: "Não foi possível carregar os produtos.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getProductTotalStock = (productId) => {
    return productStocks
      .filter(stock => stock.productId === productId)
      .reduce((total, stock) => total + (stock.quantity || 0), 0);
  };

  const handleEdit = (product) => {
    setIsEditing(true);
    setCurrentProduct({
      ...product,
      icmsOrigem: product.icmsOrigem || '0',
      ncm: product.ncm || '',
      cest: product.cest || '',
      // Removed cfop from handleEdit
      unidadeTributavel: product.unidadeTributavel || 'UN',
      beneficioFiscal: product.beneficioFiscal || '',
      anpCodigo: product.anpCodigo || '',
      anpDescricao: product.anpDescricao || '',
      valorSemIcmsKg: product.valorSemIcmsKg || 0,
      kgPorUnidadeGlp: product.kgPorUnidadeGlp || 0,
      percentualGlp: product.percentualGlp || 0,
      percentualGnNacional: product.percentualGnNacional || 0,
      percentualGnImportado: product.percentualGnImportado || 0,
      codif: product.codif || '',
      pesoLiquido: product.pesoLiquido || 0,
      pesoBruto: product.pesoBruto || 0,
      informacoesAdicionaisNfe: product.informacoesAdicionaisNfe || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    try {
      if (!currentUser || !currentUser.companyId) {
        toast({ title: "Erro", description: "Não foi possível identificar a empresa do usuário para a exclusão.", variant: "destructive" });
        return;
      }

      const orders = await Order.filter({ companyId: currentUser.companyId }).catch(() => []);
      const hasOrders = orders.some(order => 
        order.items && order.items.some(item => item.productId === productId)
      );
      
      if (hasOrders) {
        toast({ title: "Exclusão Bloqueada", description: "Não é possível excluir produtos com pedidos associados.", variant: "destructive" });
        return;
      }

      if (window.confirm("Tem certeza que deseja excluir este produto?")) {
        await Product.delete(productId);
        const stocksToDelete = productStocks.filter(stock => stock.productId === productId);
        for (const stock of stocksToDelete) {
          await ProductStock.delete(stock.id);
        }
        loadData();
        toast({ title: "Sucesso", description: "Produto excluído." });
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast({ title: "Erro", description: "Não foi possível excluir o produto.", variant: "destructive" });
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await User.me();
      
      const productData = {
        ...currentProduct,
        companyId: user.companyId,
        companyName: user.companyName,
        createdByName: user.fullName
      };

      if (isEditing) {
        const { id, ...dataToUpdate } = productData;
        await Product.update(id, dataToUpdate);
        toast({ title: "Sucesso", description: "Produto atualizado com sucesso." });
      } else {
        const newProduct = await Product.create(productData);
        toast({ title: "Sucesso", description: "Produto cadastrado com sucesso." });
      }

      resetForm();
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast({ title: "Erro", description: "Não foi possível salvar o produto.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentProduct({
      id: null,
      name: '',
      code: '',
      category: '',
      unitPrice: 0,
      costPrice: 0,
      minStock: 10,
      vasilhameId: '',
      vasilhameName: '',
      ncm: '',
      cest: '',
      // Removed cfop from resetForm
      unidadeTributavel: 'UN',
      icmsOrigem: '0',
      beneficioFiscal: '',
      anpCodigo: '',
      anpDescricao: '',
      valorSemIcmsKg: 0,
      kgPorUnidadeGlp: 0,
      percentualGlp: 0,
      percentualGnNacional: 0,
      percentualGnImportado: 0,
      codif: '',
      pesoLiquido: 0,
      pesoBruto: 0,
      informacoesAdicionaisNfe: '',
      companyId: '',
      companyName: '',
      createdByName: '',
      active: true
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const handleCategoryChange = (value) => {
    setCurrentProduct(prev => ({ 
      ...prev, 
      category: value,
      vasilhameId: (value === 'glp' || value === 'agua') ? prev.vasilhameId : '',
      vasilhameName: (value === 'glp' || value === 'agua') ? prev.vasilhameName : ''
    }));
  };

  const handleVasilhameChange = (vasilhameId) => {
    const vasilhame = vasilhames.find(v => v.id === vasilhameId);
    setCurrentProduct(prev => ({
      ...prev,
      vasilhameId: vasilhameId,
      vasilhameName: vasilhame ? vasilhame.name : ''
    }));
  };

  const getCategoryBadge = (category) => {
    const colors = {
      equipamento: "bg-blue-100 text-blue-800",
      acessorio: "bg-yellow-100 text-yellow-800", 
      glp: "bg-green-100 text-green-800",
      agua: "bg-cyan-100 text-cyan-800",
      vasilhame: "bg-purple-100 text-purple-800",
      outros: "bg-gray-100 text-gray-800"
    };
    const labels = {
      equipamento: "Equipamento",
      acessorio: "Acessório",
      glp: "GLP",
      agua: "Água",
      vasilhame: "Vasilhame",
      outros: "Outros"
    };
    return <Badge className={colors[category]}>{labels[category] || category}</Badge>;
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom right, #f2f1ed, #95b4df)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Produtos</h1>
            <p className="text-slate-600">Controle de produtos</p>
          </div>
          <Button 
            onClick={() => { setShowForm(true); setIsEditing(false); resetForm(); }}
            className="shadow-lg text-white"
            style={{ backgroundColor: '#e78b3a' }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Produto
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {isEditing ? 'Editar Produto' : 'Cadastrar Produto'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProduct}>
                <Tabs defaultValue="dados" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="dados" className="flex items-center gap-2">
                      <PackageOpen className="w-4 h-4" />
                      Dados do Produto
                    </TabsTrigger>
                    <TabsTrigger value="tributacao" className="flex items-center gap-2">
                      <Receipt className="w-4 h-4" />
                      Tributação
                    </TabsTrigger>
                    <TabsTrigger value="outras" className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Outras Informações
                    </TabsTrigger>
                  </TabsList>

                  {/* Aba 1: Dados do Produto */}
                  <TabsContent value="dados" className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">Dados Básicos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nome do Produto *</Label>
                          <Input
                            id="name"
                            value={currentProduct.name}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                            required
                            className="bg-white/80"
                          />
                        </div>
                        <div>
                          <Label htmlFor="code">Código Interno</Label>
                          <Input
                            id="code"
                            value={currentProduct.code}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                            className="bg-white/80"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Categoria *</Label>
                          <Select
                            value={currentProduct.category}
                            onValueChange={handleCategoryChange}
                          >
                            <SelectTrigger id="category" className="bg-white/80">
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equipamento">Equipamento</SelectItem>
                              <SelectItem value="acessorio">Acessório</SelectItem>
                              <SelectItem value="glp">GLP</SelectItem>
                              <SelectItem value="agua">Água</SelectItem>
                              <SelectItem value="vasilhame">Vasilhame</SelectItem>
                              <SelectItem value="outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {(currentProduct.category === 'glp' || currentProduct.category === 'agua') && (
                          <div>
                            <Label htmlFor="vasilhame">Vasilhame *</Label>
                            <Select
                              value={currentProduct.vasilhameId}
                              onValueChange={handleVasilhameChange}
                            >
                              <SelectTrigger id="vasilhame" className="bg-white/80">
                                <SelectValue placeholder="Selecione o vasilhame" />
                              </SelectTrigger>
                              <SelectContent>
                                {vasilhames.length > 0 ? (
                                  vasilhames.map(vasilhame => (
                                    <SelectItem key={vasilhame.id} value={vasilhame.id}>
                                      {vasilhame.name} ({vasilhame.code})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value={null} disabled>
                                    Nenhum vasilhame cadastrado
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {vasilhames.length === 0 && (
                              <p className="text-sm text-amber-600 mt-1">
                                ⚠️ Cadastre primeiro os vasilhames para poder associar aos produtos {currentProduct.category.toUpperCase()}
                              </p>
                            )}
                          </div>
                        )}

                        <div>
                          <Label htmlFor="costPrice">Preço de Custo</Label>
                          <Input
                            id="costPrice"
                            type="number"
                            step="0.01"
                            value={currentProduct.costPrice}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                            className="bg-white/80"
                          />
                        </div>

                        <div>
                          <Label htmlFor="unitPrice">Preço de Venda *</Label>
                          <Input
                            id="unitPrice"
                            type="number"
                            step="0.01"
                            value={currentProduct.unitPrice}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                            required
                            className="bg-white/80"
                          />
                        </div>
                        <div>
                          <Label htmlFor="minStock">Estoque Mínimo</Label>
                          <Input
                            id="minStock"
                            type="number"
                            value={currentProduct.minStock}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, minStock: parseInt(e.target.value) }))}
                            className="bg-white/80"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Aba 2: Tributação */}
                  <TabsContent value="tributacao" className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">Dados Fiscais</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Changed to md:grid-cols-2 */}
                        <div>
                          <Label htmlFor="ncm">NCM</Label>
                          <Input
                            id="ncm"
                            value={currentProduct.ncm}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, ncm: e.target.value }))}
                            placeholder="00000000"
                            maxLength={8}
                            className="bg-white/80"
                          />
                          <p className="text-xs text-slate-500 mt-1">Nomenclatura Comum do Mercosul</p>
                        </div>

                        <div>
                          <Label htmlFor="cest">CEST</Label>
                          <Input
                            id="cest"
                            value={currentProduct.cest}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, cest: e.target.value }))}
                            placeholder="0000000"
                            maxLength={7}
                            className="bg-white/80"
                          />
                          <p className="text-xs text-slate-500 mt-1">Código Especificador ST</p>
                        </div>
                        {/* Removed CFOP input field entirely */}

                        <div>
                          <Label htmlFor="icmsOrigem">Origem *</Label>
                          <Select
                            value={currentProduct.icmsOrigem}
                            onValueChange={(value) => setCurrentProduct(prev => ({ ...prev, icmsOrigem: value }))}
                          >
                            <SelectTrigger id="icmsOrigem" className="bg-white/80">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0 - Nacional</SelectItem>
                              <SelectItem value="1">1 - Estrangeira - Importação direta</SelectItem>
                              <SelectItem value="2">2 - Estrangeira - Adquirida no mercado interno</SelectItem>
                              <SelectItem value="3">3 - Nacional com Conteúdo de Importação 40-70%</SelectItem>
                              <SelectItem value="4">4 - Nacional, produção conforme processos básicos</SelectItem>
                              <SelectItem value="5">5 - Nacional com Conteúdo de Importação ≤ 40%</SelectItem>
                              <SelectItem value="6">6 - Estrangeira - Importação direta (CAMEX/gás)</SelectItem>
                              <SelectItem value="7">7 - Estrangeira - Mercado interno (CAMEX/gás)</SelectItem>
                              <SelectItem value="8">8 - Nacional com Conteúdo de Importação &gt; 70%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="unidadeTributavel">Unidade Tributável</Label>
                          <Input
                            id="unidadeTributavel"
                            value={currentProduct.unidadeTributavel}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, unidadeTributavel: e.target.value.toUpperCase() }))}
                            placeholder="UN"
                            maxLength={6}
                            className="bg-white/80"
                          />
                        </div>

                        <div className="md:col-span-1"> {/* Changed to md:col-span-1 */}
                          <Label htmlFor="beneficioFiscal">Benefício Fiscal</Label>
                          <Input
                            id="beneficioFiscal"
                            value={currentProduct.beneficioFiscal}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, beneficioFiscal: e.target.value.toUpperCase() }))}
                            placeholder="Ex: PR123456"
                            className="bg-white/80"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Código do benefício fiscal (se aplicável)
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>ℹ️ Informação:</strong> Os códigos <strong>CFOP</strong>, <strong>CST</strong> (ICMS, PIS, COFINS) e <strong>IPI</strong> são definidos nos 
                          <strong> Facilitadores Fiscais</strong> e serão aplicados automaticamente na emissão das notas.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Aba 3: Outras Informações */}
                  <TabsContent value="outras" className="space-y-6">
                    {/* Derivados de Petróleo */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">Derivados de Petróleo</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="anpCodigo">Código ANP</Label>
                          <Input
                            id="anpCodigo"
                            value={currentProduct.anpCodigo}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, anpCodigo: e.target.value }))}
                            placeholder="Ex: 210203001"
                            className="bg-white/80"
                          />
                        </div>

                        <div>
                          <Label htmlFor="anpDescricao">Descrição ANP</Label>
                          <Input
                            id="anpDescricao"
                            value={currentProduct.anpDescricao}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, anpDescricao: e.target.value }))}
                            placeholder="Descrição do produto ANP"
                            className="bg-white/80"
                          />
                        </div>

                        <div>
                          <Label htmlFor="valorSemIcmsKg">R$/KG sem ICMS</Label>
                          <Input
                            id="valorSemIcmsKg"
                            type="number"
                            step="0.001"
                            value={currentProduct.valorSemIcmsKg}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, valorSemIcmsKg: parseFloat(e.target.value) || 0 }))}
                            placeholder="R$ 0,00"
                            className="bg-white/80"
                          />
                        </div>

                        <div>
                          <Label htmlFor="kgPorUnidadeGlp">KG/UN GLP</Label>
                          <Input
                            id="kgPorUnidadeGlp"
                            type="number"
                            step="0.001"
                            value={currentProduct.kgPorUnidadeGlp}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, kgPorUnidadeGlp: parseFloat(e.target.value) || 0 }))}
                            placeholder="0,000 KG"
                            className="bg-white/80"
                          />
                        </div>

                        <div>
                          <Label htmlFor="percentualGlp">% de GLP</Label>
                          <Input
                            id="percentualGlp"
                            type="number"
                            step="0.01"
                            value={currentProduct.percentualGlp}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, percentualGlp: parseFloat(e.target.value) || 0 }))}
                            placeholder="0,00 %"
                            className="bg-white/80"
                          />
                        </div>

                        <div>
                          <Label htmlFor="percentualGnNacional">% GN Nacional</Label>
                          <Input
                            id="percentualGnNacional"
                            type="number"
                            step="0.01"
                            value={currentProduct.percentualGnNacional}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, percentualGnNacional: parseFloat(e.target.value) || 0 }))}
                            placeholder="0,00 %"
                            className="bg-white/80"
                          />
                        </div>

                        <div>
                          <Label htmlFor="percentualGnImportado">% GN Importado</Label>
                          <Input
                            id="percentualGnImportado"
                            type="number"
                            step="0.01"
                            value={currentProduct.percentualGnImportado}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, percentualGnImportado: parseFloat(e.target.value) || 0 }))}
                            placeholder="0,00 %"
                            className="bg-white/80"
                          />
                        </div>

                        <div>
                          <Label htmlFor="codif">CODIF</Label>
                          <Input
                            id="codif"
                            value={currentProduct.codif}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, codif: e.target.value }))}
                            placeholder="Código CODIF"
                            className="bg-white/80"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Outras Informações */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">Outras Informações</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pesoLiquido">Peso Líquido (KG)</Label>
                          <Input
                            id="pesoLiquido"
                            type="number"
                            step="0.001"
                            value={currentProduct.pesoLiquido}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, pesoLiquido: parseFloat(e.target.value) || 0 }))}
                            placeholder="0,000 KG"
                            className="bg-white/80"
                          />
                        </div>

                        <div>
                          <Label htmlFor="pesoBruto">Peso Bruto (KG)</Label>
                          <Input
                            id="pesoBruto"
                            type="number"
                            step="0.001"
                            value={currentProduct.pesoBruto}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, pesoBruto: parseFloat(e.target.value) || 0 }))}
                            placeholder="0,000 KG"
                            className="bg-white/80"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="informacoesAdicionaisNfe">Informações adicionais (NFe)</Label>
                          <Textarea
                            id="informacoesAdicionaisNfe"
                            value={currentProduct.informacoesAdicionaisNfe}
                            onChange={(e) => setCurrentProduct(prev => ({ ...prev, informacoesAdicionaisNfe: e.target.value }))}
                            rows={4}
                            placeholder="Digite informações adicionais que devem constar na nota fiscal..."
                            className="bg-white/80"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Estas informações serão incluídas no campo "Informações Complementares" da NF-e/NFC-e
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-3 mt-6">
                  <Button type="submit" className="text-white hover:opacity-90" style={{ backgroundColor: '#223f61' }} disabled={isLoading}>
                    {isLoading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Salvar Produto')}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle>Lista de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código Interno</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Vasilhame</TableHead>
                    <TableHead>Preço Custo</TableHead>
                    <TableHead>Preço Venda</TableHead>
                    <TableHead>Estoque Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lançado por</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(product => {
                    const totalStock = getProductTotalStock(product.id);
                    const isLowStock = totalStock <= product.minStock;
                    
                    return (
                      <TableRow key={product.id} className={isLowStock ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isLowStock && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                            {product.name}
                          </div>
                        </TableCell>
                        <TableCell>{product.code}</TableCell>
                        <TableCell>{getCategoryBadge(product.category)}</TableCell>
                        <TableCell>
                          {(product.category === 'glp' || product.category === 'agua') && product.vasilhameName ? (
                            <span className="text-sm text-slate-600">{product.vasilhameName}</span>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>R$ {product.costPrice?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>R$ {product.unitPrice?.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={isLowStock ? 'text-red-600 font-semibold' : ''}>
                            {totalStock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={product.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {product.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{product.createdByName}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="mr-2 hover:bg-blue-100">
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="hover:bg-red-100">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                        Nenhum produto cadastrado ainda
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