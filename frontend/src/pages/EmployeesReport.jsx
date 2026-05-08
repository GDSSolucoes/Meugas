import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserCheck, DollarSign, Calendar, Phone } from "lucide-react";
import { Employee } from "@/entities/Employee";
import { format, parseISO } from "date-fns";
import { User } from "@/entities/User";

export default function EmployeesReportPage() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const user = await User.me();
      if (!user.companyId) {
        setIsLoading(false);
        return;
      }
      const data = await Employee.filter(
        { companyId: user.companyId },
        { sort: "-createdAt" },
      );
      setEmployees(data);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionBadge = (position) => {
    const colors = {
      vendedor: "bg-blue-100 text-blue-800",
      entregador: "bg-green-100 text-green-800",
      gerente: "bg-purple-100 text-purple-800",
      administrativo: "bg-yellow-100 text-yellow-800",
      outro: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={colors[position] || colors.outro}>{position}</Badge>
    );
  };

  const totalSalary = employees
    .filter((e) => e.active)
    .reduce((sum, e) => sum + (e.salary || 0), 0);
  const vendedores = employees.filter(
    (e) => e.position === "vendedor" && e.active,
  );
  const entregadores = employees.filter(
    (e) => e.position === "entregador" && e.active,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Relatório de Funcionários
          </h1>
          <p className="text-slate-600">
            Visão completa da equipe e custos com pessoal
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Funcionários
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees.filter((e) => e.active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Entregadores
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entregadores.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendedores</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendedores.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Folha de Pagamento
              </CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalSalary.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle>Lista Completa de Funcionários</CardTitle>
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
                      <TableHead>Cargo</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Contratação</TableHead>
                      <TableHead>Salário</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.name}
                        </TableCell>
                        <TableCell>
                          {getPositionBadge(employee.position)}
                        </TableCell>
                        <TableCell>{employee.document}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {employee.phone || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {employee.hireDate
                              ? format(employee.hireDate, "dd/MM/yyyy")
                              : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          R$ {(employee.salary || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              employee.active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {employee.active ? "Ativo" : "Inativo"}
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
