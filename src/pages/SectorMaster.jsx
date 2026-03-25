import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Warehouse } from "lucide-react";
import { SectorMaster } from "@/entities/SectorMaster";
import  User  from "@/lib/providers/user";
import { useToast } from "@/components/ui/use-toast";

export default function SectorMasterPage() {
  const { toast } = useToast();
  const [sectorMasters, setSectorMasters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const initialSectorMasterState = {
    name: ''
  };

  const [currentSectorMaster, setCurrentSectorMaster] = useState(initialSectorMasterState);

  const loadData = useCallback(async () => {
    try {
      const user = await User.me();
      const sectorMastersData = await SectorMaster.filter({ company_id: user.company_id }, '-created_date');
      setSectorMasters(sectorMastersData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os dados.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (sectorMaster) => {
    setIsEditing(true);
    setCurrentSectorMaster(sectorMaster);
    setShowForm(true);
  };

  const handleDelete = async (sectorMasterId) => {
    if (window.confirm("Tem certeza que deseja excluir este setor master?")) {
      try {
        await SectorMaster.delete(sectorMasterId);
        loadData();
        toast({ title: "Sucesso", description: "Setor master excluído." });
      } catch (error) {
        console.error("Erro ao excluir setor master:", error);
        toast({ title: "Erro", description: "Não foi possível excluir o setor master.", variant: "destructive" });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await User.me();
      
      const payload = {
        ...currentSectorMaster,
        company_id: user.company_id,
        company_name: user.company_name
      };

      if (isEditing) {
        const { id, ...sectorMasterData } = payload;
        await SectorMaster.update(id, sectorMasterData);
      } else {
        await SectorMaster.create({ ...payload, created_by_name: user.full_name });
      }
      setShowForm(false);
      resetForm();
      loadData();
      toast({ title: "Sucesso", description: `Setor master ${isEditing ? 'atualizado' : 'salvo'} com sucesso.` });
    } catch (error) {
      console.error("Erro ao salvar setor master:", error);
      toast({ title: "Erro", description: "Não foi possível salvar o setor master.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setCurrentSectorMaster(initialSectorMasterState);
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
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Setor Master</h1>
            <p className="text-slate-600">Gerencie os setores principais com estoque próprio.</p>
          </div>
          <Button onClick={() => { setShowForm(true); setIsEditing(false); resetForm(); }} className="text-white" style={{ backgroundColor: '#e78b3a' }}>
            <Plus className="w-5 h-5 mr-2" />
            Novo Setor Master
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="w-5 h-5" />
                {isEditing ? 'Editar Setor Master' : 'Novo Setor Master'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Descrição/Nome do Setor Master *</Label>
                  <Input
                    value={currentSectorMaster.name}
                    onChange={(e) => setCurrentSectorMaster(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                    required
                    maxLength={40}
                    placeholder="Ex: Depósito Principal, Matriz..."
                  />
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
          <CardHeader><CardTitle>Setores Master Cadastrados</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição/Nome</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectorMasters.map(sectorMaster => (
                  <TableRow key={sectorMaster.id}>
                    <TableCell className="font-medium">{sectorMaster.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(sectorMaster)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(sectorMaster.id)}>
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