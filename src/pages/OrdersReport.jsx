
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, TrendingUp, CheckCircle, Clock, Filter } from "lucide-react";
import { Order } from "@/entities/Order";
import { Employee } from "@/entities/Employee";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import  User  from "@/lib/providers/user";

export default function OrdersReport() {
  const [allOrders, setAllOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    employeeId: 'all',
    status: 'all'
  });

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    if (isLoading) return [];
    
    const start = startOfDay(new Date(filters.startDate + 'T00:00:00'));
    const end = endOfDay(new Date(filters.endDate + 'T00:00:00'));

    return allOrders.filter(order => {
      const orderDate = parseISO(order.created_date);
      const dateMatch = orderDate >= start && orderDate <= end;
      const employeeMatch = filters.employeeId === 'all' || order.employee_id === filters.employeeId;
      const statusMatch = filters.status === 'all' || order.status === filters.status;
      
      return dateMatch && employeeMatch && statusMatch;
    });
  }, [allOrders, filters, isLoading]);

  const loadData = async () => {
    try {
      const user = await User.me();
      if (!user.company_id) {
        setIsLoading(false);
        return;
      }
      const [ordersData, employeesData] = await Promise.all([
        Order.filter({ company_id: user.company_id }, '-created_date'),
        Employee.filter({ company_id: user.company_id, position: 'entregador', active: true })
      ]);
      setAllOrders(ordersData);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getBadge = (status) => {
    switch(status) {
      case 'pendente': return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'em_atendimento': return <Badge className="bg-blue-100 text-blue-800">Em Atendimento</Badge>;
      case 'finalizado': return <Badge className="bg-green-100 text-green-800">Finalizado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter(o => o.status === 'pendente').length;
  const inProgressOrders = filteredOrders.filter(o => o.status === 'em_atendimento').length;
  const completedOrders = filteredOrders.filter(o => o.status === 'finalizado').length;
  const totalValue = filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Relatório de Pedidos</h1>
          <p className="text-slate-600">Análise detalhada dos pedidos por período, entregador e status</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Data Inicial</Label>
                <Input 
                  type="date"
                  value={filters.startDate}
                  onChange={e => handleFilterChange('startDate', e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <Label>Data Final</Label>
                <Input 
                  type="date"
                  value={filters.endDate}
                  onChange={e => handleFilterChange('endDate', e.target.value)}
                  className="bg-white"
                />
              </div>
              <div>
                <Label>Entregador</Label>
                <Select value={filters.employeeId} onValueChange={value => handleFilterChange('employeeId', value)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Entregadores</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={value => handleFilterChange('status', value)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{pendingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{inProgressOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{completedOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle>Pedidos no Período</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Carregando...</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Entregador</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length > 0 ? filteredOrders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{format(parseISO(order.created_date), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell>{order.person_name}</TableCell>
                        <TableCell>{order.employee_name || 'Não definido'}</TableCell>
                        <TableCell>{getBadge(order.status)}</TableCell>
                        <TableCell className="font-bold">R$ {(order.total_amount || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          Nenhum pedido encontrado com os filtros selecionados
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
