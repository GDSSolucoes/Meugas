import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Warehouse } from "lucide-react";
import { Sectors } from "@/entities/Sectors";
import { Employees } from "@/entities/Employees";
import { SectorMasters } from "@/entities/SectorMasters"; // Importar SectorMaster
import { Users } from "@/entities/Users";
import { useToast } from "@/components/ui/use-toast";

export default function SectorsPage() {
  const { toast } = useToast();
  const [sectors, setSectors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sectorMasters, setSectorMasters] = useState([]); // Novo estado para Setores Master
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const initialSectorState = {
    name: '',
    employeeId: '',
    employeeName: '',
    phone: '',
    isOwnStock: true,
    masterSectorId: '',
    masterSectorName: '',
    active: true,
  };

  const [currentSector, setCurrentSector] = useState(initialSectorState);

  // The previous useMemo for masterSectors is removed as we now load SectorMaster entities directly.

  const loadData = useCallback(async () => {
    try {
      const user = await Users.me();
      const [sectorsData, employeesData, sectorMastersData] = await Promise.all([
        Sectors.filter({ companyId: user.companyId }, '-createdDate'),
        Employees.filter({ companyId: user.companyId, active: true }),
        SectorMasters.filter({ companyId: user.companyId }) // Carregar Setores Master
      ]);
      setSectors(sectorsData);
      setEmployees(employeesData);
      setSectorMasters(sectorMastersData); // Salvar Setores Master no estado
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os dados.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (sector) => {
    setIsEditing(true);
    setCurrentSector(sector);
    setShowForm(true);
  };

  const handleDelete = async (sectorId) => {
    if (window.confirm("Tem certeza que deseja excluir este setor?")) {
      try {
        await Sectors.delete(sectorId);
        loadData();
        toast({ title: "Sucesso", description: "Setor excluído." });
      } catch (error) {
        console.error("Erro ao excluir setor:", error);
        toast({ title: "Erro", description: "Não foi possível excluir o setor.", variant: "destructive" });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await Users.me();
      
      const selectedEmployee = employees.find(emp => emp.id === currentSector.employeeId);
      const selectedMasterSector = sectorMasters.find(ms => ms.id === currentSector.masterSectorId); // Use sectorMasters
      
      const payload = {
        ...currentSector,
        employeeName: selectedEmployee ? selectedEmployee.name : '',
        masterSectorId: currentSector.isOwnStock ? null : currentSector.masterSectorId,
        masterSectorName: currentSector.isOwnStock ? null : (selectedMasterSector ? selectedMasterSector.name : ''),
        companyId: user.companyId,
        companyName: user.companyName
      };

      if (isEditing) {
        const { id, ...sectorData } = payload;
        await Sectors.update(id, sectorData);
      } else {
        await Sectors.create({ ...payload, createdByName: user.fullName });
      }
      setShowForm(false);
      resetForm();
      loadData();
      toast({ title: "Sucesso", description: `Setor ${isEditing ? 'atualizado' : 'salvo'} com sucesso.` });
    } catch (error) {
      console.error("Erro ao salvar setor:", error);
      toast({ title: "Erro", description: "Não foi possível salvar o setor.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setCurrentSector(initialSectorState);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom right, #f2f1ed, #95b4df)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Cadastro de Setores</h1>
            <p className="text-slate-600">Gerencie os locais de armazenamento de produtos.</p>
          </div>
          <Button onClick={() => { setShowForm(true); setIsEditing(false); resetForm(); }} className="text-white" style={{ backgroundColor: '#e78b3a' }}>
            <Plus className="w-5 h-5 mr-2" />
            Novo Setor
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="w-5 h-5" />
                {isEditing ? 'Editar Setor' : 'Novo Setor'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Descrição/Nome do Setor *</Label>
                    <Input
                      value={currentSector.name}
                      onChange={(e) => setCurrentSector(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                      required
                      maxLength={40}
                      placeholder="Ex: Depósito Principal, Veículo 1..."
                    />
                  </div>
                  <div>
                    <Label>Funcionário Responsável</Label>
                     <Select
                      value={currentSector.employeeId || ''}
                      onValueChange={(value) => setCurrentSector(prev => ({ ...prev, employeeId: value }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione um funcionário" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Nenhum</SelectItem>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                   <div>
                    <Label>Celular</Label>
                    <Input
                      value={currentSector.phone}
                      onChange={(e) => setCurrentSector(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(XX) XXXXX-XXXX"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="isOwnStock"
                      checked={currentSector.isOwnStock}
                      onCheckedChange={(checked) => setCurrentSector(prev => ({ ...prev, isOwnStock: checked }))}
                    />
                    <Label htmlFor="isOwnStock">Estoque Próprio? (Setor Master)</Label>
                  </div>
                  {!currentSector.isOwnStock && (
                    <div className="md:col-span-2">
                      <Label>Vincular ao Setor Master *</Label>
                      <Select
                        value={currentSector.masterSectorId || ''}
                        onValueChange={(value) => setCurrentSector(prev => ({ ...prev, masterSectorId: value }))}
                        required={!currentSector.isOwnStock}
                      >
                        <SelectTrigger className="bg-yellow-50"><SelectValue placeholder="Selecione o setor master" /></SelectTrigger>
                        <SelectContent>
                           {sectorMasters.map(ms => (
                            <SelectItem key={ms.id} value={ms.id}>{ms.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                       {sectorMasters.length === 0 && <p className="text-xs text-red-500 mt-1">Nenhum setor master foi encontrado. Cadastre um primeiro na tela de Setor Master.</p>}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="text-white hover:opacity-90" style={{ backgroundColor: '#223f61' }}>
                    {isEditing ? 'Salvar Alterações' : 'Salvar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/90">
          <CardHeader><CardTitle>Setores Cadastrados</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição/Nome</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Celular</TableHead>
                  <TableHead>Tipo Estoque</TableHead>
                  <TableHead>Vinculado a</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectors.map(sector => (
                  <TableRow key={sector.id}>
                    <TableCell className="font-medium">{sector.name}</TableCell>
                    <TableCell>{sector.employeeName || '-'}</TableCell>
                    <TableCell>{sector.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={sector.isOwnStock ? 'default' : 'secondary'}
                             className={sector.isOwnStock ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                        {sector.isOwnStock ? "Próprio" : "Vinculado"}
                      </Badge>
                    </TableCell>
                     <TableCell>{!sector.isOwnStock ? sector.masterSectorName : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={sector.active ? 'default' : 'outline'}
                             className={sector.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {sector.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(sector)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(sector.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}