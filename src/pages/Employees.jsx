import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCheck, Edit, Trash2 } from "lucide-react";
import { Employee } from "@/entities/Employee";
import { format, parseISO } from "date-fns";
import  User  from "@/api/providers/user";
import { useToast } from "@/components/ui/use-toast";

export default function Employees() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const initialEmployeeState = {
    name: '',
    document: '',
    email: '',
    phone: '',
    position: '',
    salary: 0,
    hireDate: format(new Date(), 'yyyy-MM-dd'),
    vacationStart: '',
    vacationEnd: '',
    active: true,
    createdByName: ''
  };
  
  const [currentEmployee, setCurrentEmployee] = useState(initialEmployeeState);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      const employeesData = await Employee.filter({ companyId: user.companyId }, '-createdDate');
      setEmployees(employeesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setEmployees([]);
    }
  };

  const handleEdit = (employee) => {
    setIsEditing(true);
    setCurrentEmployee({
      ...employee,
      hireDate: employee.hireDate ? format(parseISO(employee.hireDate), 'yyyy-MM-dd') : '',
      vacationStart: employee.vacationStart ? format(parseISO(employee.vacationStart), 'yyyy-MM-dd') : '',
      vacationEnd: employee.vacationEnd ? format(parseISO(employee.vacationEnd), 'yyyy-MM-dd') : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm("Tem certeza que deseja deletar este funcionário?")) {
      try {
        await Employee.delete(employeeId);
        loadData();
        toast({ title: "Sucesso", description: "Funcionário excluído." });
      } catch (error) {
        console.error("Erro ao deletar funcionário:", error);
        toast({ title: "Erro", description: "Erro ao excluir funcionário.", variant: "destructive" });
      }
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await User.me();
      
      const employeeData = {
        ...currentEmployee,
        salary: Number(currentEmployee.salary) || 0,
        companyId: user.companyId,
        companyName: user.companyName,
        createdByName: user.fullName
      };

      if (isEditing) {
        const { id, ...dataToUpdate } = employeeData;
        await Employee.update(id, dataToUpdate);
        toast({ title: "Sucesso", description: "Funcionário atualizado com sucesso." });
      } else {
        await Employee.create(employeeData);
        toast({ title: "Sucesso", description: "Funcionário cadastrado com sucesso." });
      }

      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Erro ao salvar funcionário:", error);
      toast({ title: "Erro", description: "Não foi possível salvar o funcionário.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentEmployee(initialEmployeeState);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
      setShowForm(false);
      resetForm();
  };

  const getPositionBadge = (position) => {
    const colors = {
      vendedor: "bg-blue-100 text-blue-800",
      entregador: "bg-green-100 text-green-800",
      gerente: "bg-purple-100 text-purple-800",
      administrativo: "bg-yellow-100 text-yellow-800",
      outro: "bg-gray-100 text-gray-800"
    };
    return <Badge className={colors[position] || colors.outro}>{position}</Badge>;
  };

  const getStatusBadge = (active) => {
    return active 
      ? <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      : <Badge className="bg-red-100 text-red-800">Inativo</Badge>;
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom right, #f2f1ed, #95b4df)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Cadastro de Funcionários</h1>
            <p className="text-slate-600">Gerencie a equipe da sua empresa</p>
          </div>
          <Button 
            onClick={() => { setShowForm(true); setIsEditing(false); resetForm(); }}
            className="shadow-lg text-white"
            style={{ backgroundColor: '#e78b3a' }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Funcionário
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                {isEditing ? 'Editar Funcionário' : 'Cadastrar Novo Funcionário'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveEmployee} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label>Nome Completo *</Label>
                    <Input
                      value={currentEmployee.name}
                      onChange={(e) => setCurrentEmployee(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                      required
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label>CPF</Label>
                    <Input
                      value={currentEmployee.document}
                      onChange={(e) => setCurrentEmployee(prev => ({ ...prev, document: e.target.value.toUpperCase() }))}
                      className="bg-white/80"
                    />
                  </div>
                   <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={currentEmployee.email}
                      onChange={(e) => setCurrentEmployee(prev => ({ ...prev, email: e.target.value.toUpperCase() }))}
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={currentEmployee.phone}
                      onChange={(e) => setCurrentEmployee(prev => ({ ...prev, phone: e.target.value.toUpperCase() }))}
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label>Cargo *</Label>
                    <Select
                      value={currentEmployee.position}
                      onValueChange={(value) => setCurrentEmployee(prev => ({ ...prev, position: value }))}
                    >
                      <SelectTrigger className="bg-white/80">
                        <SelectValue placeholder="Selecione o cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vendedor">Vendedor</SelectItem>
                        <SelectItem value="entregador">Entregador</SelectItem>
                        <SelectItem value="gerente">Gerente</SelectItem>
                        <SelectItem value="administrativo">Administrativo</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Salário</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentEmployee.salary}
                      onChange={(e) => setCurrentEmployee(prev => ({ ...prev, salary: e.target.value }))}
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label>Data de Contratação</Label>
                    <Input
                      type="date"
                      value={currentEmployee.hireDate}
                      onChange={(e) => setCurrentEmployee(prev => ({ ...prev, hireDate: e.target.value }))}
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label>Situação *</Label>
                    <Select
                      value={currentEmployee.active.toString()}
                      onValueChange={(value) => setCurrentEmployee(prev => ({ ...prev, active: value === 'true' }))}
                    >
                      <SelectTrigger className="bg-white/80">
                        <SelectValue placeholder="Selecione a situação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4 text-slate-800">Período de Férias</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Início das Férias</Label>
                      <Input
                        type="date"
                        value={currentEmployee.vacationStart}
                        onChange={(e) => setCurrentEmployee(prev => ({ ...prev, vacationStart: e.target.value }))}
                        className="bg-white/80"
                      />
                    </div>
                    <div>
                      <Label>Final das Férias</Label>
                      <Input
                        type="date"
                        value={currentEmployee.vacationEnd}
                        onChange={(e) => setCurrentEmployee(prev => ({ ...prev, vacationEnd: e.target.value }))}
                        className="bg-white/80"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="text-white hover:opacity-90" style={{ backgroundColor: '#223f61' }} disabled={isLoading}>
                    {isLoading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Salvar Funcionário')}
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
            <CardTitle>Lista de Funcionários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead>Férias</TableHead>
                      <TableHead>Lançado por</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(employees || []).map(employee => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.document}</TableCell>
                        <TableCell>{getPositionBadge(employee.position)}</TableCell>
                        <TableCell>{employee.phone || '-'}</TableCell>
                        <TableCell>{getStatusBadge(employee.active)}</TableCell>
                        <TableCell>
                          {employee.vacationStart && employee.vacationEnd ? (
                            <span className="text-sm">
                              {format(parseISO(employee.vacationStart), 'dd/MM/yyyy')} até {format(parseISO(employee.vacationEnd), 'dd/MM/yyyy')}
                            </span>
                          ) : (
                            <span className="text-slate-400">Não definido</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{employee.createdByName}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)} className="mr-2 hover:bg-blue-100">
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(employee.id)} className="hover:bg-red-100">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}