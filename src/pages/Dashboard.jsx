import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Users, 
  TrendingUp, 
  DollarSign, 
  ClipboardList, 
  AlertTriangle 
} from "lucide-react";
import { Order } from "@/entities/Order";
import { Product } from "@/entities/Product";
import { Person } from "@/entities/Person";
import { Sale } from "@/entities/Sale";
import  User  from "@/api/providers/user"; // Added User import
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalSales: 0,
    lowStockProducts: 0
  });
  const [currentUser, setCurrentUser] = useState(null); // Added currentUser state

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    ;
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // DEBUG: Verificar company_id do usuário
      console.log('=== DEBUG DASHBOARD ===');
      console.log('User company_id:', user.company_id);
      console.log('User company_name:', user.company_name);
      
      const [orders, products, people, sales] = await Promise.all([
        Order.filter({ company_id: user.company_id }).catch(() => []),
        Product.filter({ company_id: user.company_id }).catch(() => []),
        Person.filter({ company_id: user.company_id, type: 'cliente' }).catch(() => []),
        Sale.filter({ company_id: user.company_id }).catch(() => [])
      ]);

      console.log('Dados filtrados:');
      console.log('- Orders:', orders.length);
      console.log('- Products:', products.length);
      console.log('- People:', people.length);
      console.log('- Sales:', sales.length);
      console.log('=====================');

      const lowStock = products.filter(p => (p.stock_quantity || 0) <= (p.min_stock || 0));

      setStats({
        totalOrders: orders.length,
        totalProducts: products.length,
        totalCustomers: people.length,
        totalSales: sales.length,
        lowStockProducts: lowStock.length
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom right, #f2f1ed, #95b4df)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Módulo Gerencial</h1>
            <p className="text-slate-600 text-lg">Visão geral executiva do negócio</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {/* Total de Pedidos */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">+12% este mês</p>
            </CardContent>
          </Card>
          {/* Produtos */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
          {/* Clientes */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            </CardContent>
          </Card>
          {/* Vendas */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
            </CardContent>
          </Card>
          {/* Estoque Baixo */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.lowStockProducts}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Resumo do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-600">Pedidos Pendentes</span>
                  <span className="font-semibold text-slate-800">-</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-600">Pedidos em Atendimento</span>
                  <span className="font-semibold text-slate-800">-</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-600">Contas a Receber</span>
                  <span className="font-semibold text-slate-800">-</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-600">Vendas do Mês</span>
                  <span className="font-semibold text-green-600">R$ 0,00</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Link to={createPageUrl("Sales")}>
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                    <DollarSign className="w-6 h-6" />
                    <span className="font-medium">Nova Venda</span>
                  </Button>
                </Link>
                <Link to={createPageUrl("Products")}>
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                    <Package className="w-6 h-6" />
                    <span className="font-medium">Produtos</span>
                  </Button>
                </Link>
                <Link to={createPageUrl("People")}>
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                    <Users className="w-6 h-6" />
                    <span className="font-medium">Pessoas</span>
                  </Button>
                </Link>
                <Link to={createPageUrl("AccountsReceivable")}>
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                    <DollarSign className="w-6 h-6" />
                    <span className="font-medium">Contas</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}