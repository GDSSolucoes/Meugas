
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, DollarSign, AlertTriangle, CheckCircle, Filter } from "lucide-react";
import { AccountsReceivable } from "@/entities/AccountsReceivable";
import { format, parseISO, startOfDay, endOfDay, isBefore } from "date-fns";
import  User  from "@/api/providers/user";

export default function ReceivableReport() {
  const [allReceivables, setAllReceivables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    dueStartDate: format(new Date(), 'yyyy-MM-dd'),
    dueEndDate: format(new Date(), 'yyyy-MM-dd'),
    createdStartDate: format(new Date(), 'yyyy-MM-dd'),
    createdEndDate: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    loadReceivables();
  }, []);

  const filteredReceivables = useMemo(() => {
    if (isLoading) return [];
    
    const dueStart = startOfDay(new Date(filters.dueStartDate + 'T00:00:00'));
    const dueEnd = endOfDay(new Date(filters.dueEndDate + 'T00:00:00'));
    const createdStart = startOfDay(new Date(filters.createdStartDate + 'T00:00:00'));
    const createdEnd = endOfDay(new Date(filters.createdEndDate + 'T00:00:00'));

    return allReceivables.filter(receivable => {
      const dueDate = parseISO(receivable.dueDate);
      const createdDate = parseISO(receivable.createdDate);
      
      const dueDateMatch = dueDate >= dueStart && dueDate <= dueEnd;
      const createdDateMatch = createdDate >= createdStart && createdDate <= createdEnd;
      
      return dueDateMatch && createdDateMatch;
    });
  }, [allReceivables, filters, isLoading]);

  const loadReceivables = async () => {
    try {
      const user = await User.me();
      const data = await AccountsReceivable.filter({ companyId: user.companyId }, '-createdDate');
      setAllReceivables(data);
    } catch (error) {
      console.error("Erro ao carregar contas a receber:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getBadge = (receivable) => {
    if (receivable.status === 'pago') {
      return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
    }
    
    const today = new Date();
    const dueDate = parseISO(receivable.dueDate);
    
    if (isBefore(dueDate, today)) {
      return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
    }
    
    return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
  };

  const totalReceivables = filteredReceivables.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalPaid = filteredReceivables.filter(r => r.status === 'pago').reduce((sum, r) => sum + (r.paidAmount || 0), 0);
  const totalPending = filteredReceivables.filter(r => r.status === 'pendente').reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalOverdue = filteredReceivables.filter(r => {
    const today = new Date();
    const dueDate = parseISO(r.dueDate);
    return r.status === 'pendente' && isBefore(dueDate, today);
  }).reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Relatório de Contas a Receber</h1>
          <p className="text-slate-600">Análise detalhada das contas a receber por vencimento e lançamento</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Filtro por Vencimento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data Inicial</Label>
                    <Input 
                      type="date"
                      value={filters.dueStartDate}
                      onChange={e => handleFilterChange('dueStartDate', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label>Data Final</Label>
                    <Input 
                      type="date"
                      value={filters.dueEndDate}
                      onChange={e => handleFilterChange('dueEndDate', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Filtro por Lançamento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data Inicial</Label>
                    <Input 
                      type="date"
                      value={filters.createdStartDate}
                      onChange={e => handleFilterChange('createdStartDate', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label>Data Final</Label>
                    <Input 
                      type="date"
                      value={filters.createdEndDate}
                      onChange={e => handleFilterChange('createdEndDate', e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalReceivables.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Já Recebido</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ {totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Aberto</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">R$ {totalPending.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">R$ {totalOverdue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle>Contas a Receber no Período</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Carregando...</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Lançamento</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Valor Pago</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceivables.length > 0 ? filteredReceivables.map(receivable => (
                      <TableRow key={receivable.id}>
                        <TableCell className="font-medium">{receivable.personName}</TableCell>
                        <TableCell>{format(parseISO(receivable.createdDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{format(parseISO(receivable.dueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{receivable.installmentNumber}/1</TableCell>
                        <TableCell>R$ {(receivable.amount || 0).toFixed(2)}</TableCell>
                        <TableCell>R$ {(receivable.paidAmount || 0).toFixed(2)}</TableCell>
                        <TableCell>{getBadge(receivable)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          Nenhuma conta a receber encontrada com os filtros selecionados
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
