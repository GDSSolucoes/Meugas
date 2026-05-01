
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, BarChart3 } from "lucide-react";
import { Product } from "@/entities/Product";
import { User } from "@/entities/User";

export default function ProductsReportPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const user = await User.me();
      if (!user.companyId) {
        setIsLoading(false);
        return;
      }
      const data = await Product.filter({ companyId: user.companyId }, {sort: '-createdDate'});
      setProducts(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryBadge = (category) => {
    const colors = {
      equipamento: "bg-blue-100 text-blue-800",
      acessorio: "bg-yellow-100 text-yellow-800",
      glp: "bg-green-100 text-green-800",
      vasilhame: "bg-purple-100 text-purple-800",
      // Fallback for unexpected categories
      default: "bg-gray-100 text-gray-800"
    };
    const labels = {
      equipamento: "Equipamento",
      acessorio: "Acessório",
      glp: "GLP",
      vasilhame: "Vasilhame",
      // Fallback for unexpected categories
      default: "Outro"
    };
    return <Badge className={colors[category] || colors.default}>{labels[category] || category}</Badge>;
  };

  const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStock);
  const totalValue = products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.unitPrice || 0)), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Relatório de Produtos</h1>
          <p className="text-slate-600">Visão completa do estoque e produtos cadastrados</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.filter(p => p.active).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{lowStockProducts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Estoque</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle>Lista Completa de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Carregando...</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Código Interno</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Vasilhame</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map(product => (
                      <TableRow key={product.id} className={product.stockQuantity <= product.minStock ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {product.stockQuantity <= product.minStock && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                            {product.name}
                          </div>
                        </TableCell>
                        <TableCell>{product.code}</TableCell>
                        <TableCell>{getCategoryBadge(product.category)}</TableCell>
                        <TableCell>
                          {product.category === 'glp' && product.vasilhameName ? (
                            <span className="text-sm text-slate-600">{product.vasilhameName}</span>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>R$ {product.unitPrice?.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={product.stockQuantity <= product.minStock ? 'text-red-600 font-semibold' : ''}>
                            {product.stockQuantity}
                          </span>
                        </TableCell>
                        <TableCell>R$ {((product.stockQuantity || 0) * (product.unitPrice || 0)).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={product.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {product.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
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
