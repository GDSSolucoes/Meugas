
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  UsersIcon,
  TrendingUp,
  Package,
  AlertCircle,
  Loader2 // Added for loading spinner
} from "lucide-react";
import { Order } from "@/entities/Order";
import { Person } from "@/entities/Person";
import { User } from "@/entities/User";
import { Employee } from "@/entities/Employee"; // New import
import { Product } from "@/entities/Product"; // New import, implied by outline usage
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast"; // New import

export default function PedidosDashboardPage() {
  const { toast } = useToast(); // Initialize toast
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    totalCustomers: 0
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // New state for loading
  const [recentOrders, setRecentOrders] = useState([]); // New state for recent orders

  const loadData = useCallback(async () => { // Renamed from loadStats to loadData and wrapped in useCallback
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      const companyId = user.companyId;

      if (!companyId) {
        toast({ title: "Erro", description: "Usuário não está vinculado a uma empresa.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Fetch all necessary data for the dashboard
      const [ordersData, productsData, employeesData, peopleData] = await Promise.all([
        Order.filter({ companyId }).catch(() => []), // Ensure robustness with .catch
        Product.filter({ companyId }).catch(() => []),
        Employee.filter({ companyId, position: 'entregador', active: true }).catch(() => []),
        Person.filter({ companyId, type: 'cliente' }).catch(() => []) // Ensure robustness with .catch
      ]);

      setRecentOrders(ordersData.slice(0, 5)); // Set recent orders, taking the first 5

      const pending = ordersData.filter(o => o.status === 'pendente').length;
      const inProgress = ordersData.filter(o => o.status === 'em_atendimento').length;
      const completed = ordersData.filter(o => o.status === 'finalizado').length;

      setStats({
        totalOrders: ordersData.length,
        pendingOrders: pending,
        inProgressOrders: inProgress,
        completedOrders: completed,
        totalCustomers: peopleData.length // Use peopleData for total customers
      });
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os dados.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // Dependency on toast

  useEffect(() => {
    loadData();
  }, [loadData]); // Dependency on loadData

  // New function for saving a quick order
  const handleSaveOrder = async (order) => {
    if (!currentUser) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    try {
      await Order.create({
        ...order,
        companyId: currentUser.companyId,
        companyName: currentUser.companyName,
        createdByName: currentUser.fullName
      });
      toast({ title: "Sucesso", description: "Pedido rápido salvo com sucesso!" });
      loadData(); // Reload data after saving
    } catch (error) {
      console.error("Erro ao salvar pedido rápido:", error);
      toast({ title: "Erro", description: "Não foi possível salvar o pedido.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center text-slate-600">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
          <p className="text-lg">Carregando dados do Módulo Pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Módulo Pedidos</h1>
            <p className="text-slate-600 text-lg">Gestão completa de pedidos e entregas</p>
          </div>
          {/* Example of adding a quick order button, if applicable and a form exists */}
          {/* <Button onClick={() => handleSaveOrder({ /* dummy order data */ /* })}>
            Novo Pedido Rápido
          </Button> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                {/* <p className="text-xs text-muted-foreground">+5% hoje</p> Keep or remove as needed, based on data availability */}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">{stats.pendingOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgressOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              </CardContent>
            </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link to={createPageUrl("Orders")} className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 justify-start">
                    <ClipboardList className="w-5 h-5 mr-3" />
                    Criar Novo Pedido
                  </Button>
                </Link>
                <Link to={createPageUrl("OrderTracking")} className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-5 h-5 mr-3" />
                    Acompanhar Entregas
                  </Button>
                </Link>
                <Link to={createPageUrl("OrderPeople")} className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <UsersIcon className="w-5 h-5 mr-3" />
                    Gerenciar Clientes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800">Visão Geral dos Pedidos</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
               <p className="text-sm text-slate-600">Acompanhe o status dos pedidos em tempo real.</p>
               {/* You can render recentOrders here if needed, e.g.: */}
               {/* {recentOrders.length > 0 ? (
                 <ul className="mt-4 space-y-2">
                   {recentOrders.map(order => (
                     <li key={order.id} className="flex justify-between items-center text-sm">
                       <span>Pedido #{order.id} - {order.customerName}</span>
                       <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                         order.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                         order.status === 'em_atendimento' ? 'bg-blue-100 text-blue-800' :
                         'bg-green-100 text-green-800'
                       }`}>
                         {order.status.replace('_', ' ').toUpperCase()}
                       </span>
                     </li>
                   ))}
                 </ul>
               ) : (
                 <p className="text-sm text-slate-500 mt-4">Nenhum pedido recente para exibir.</p>
               )} */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
