import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, CreditCard } from "lucide-react";
import { Acquirer } from "@/entities/Acquirer";
import { User } from "@/entities/User";
import { useToast } from "@/components/ui/use-toast";

export default function Acquirers() {
  const { toast } = useToast();
  const [acquirers, setAcquirers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const initialAcquirerState = {
    name: '',
    fee_percentage: 0,
    settlement_days: 1,
    active: true
  };

  const [currentAcquirer, setCurrentAcquirer] = useState(initialAcquirerState);

  const loadAcquirers = useCallback(async () => {
    try {
      const user = await User.me();
      const data = await Acquirer.filter({ company_id: user.company_id }, '-created_date');
      setAcquirers(data);
    } catch (error) {
      console.error("Erro ao carregar adquirentes:", error);
      toast({ title: "Erro", description: "Falha ao carregar adquirentes.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    loadAcquirers();
  }, [loadAcquirers]);

  const handleEdit = (acquirer) => {
    setIsEditing(true);
    setCurrentAcquirer(acquirer);
    setShowForm(true);
  };

  const handleDelete = async (acquirerId) => {
    if (window.confirm("Tem certeza que deseja excluir esta adquirente?")) {
      try {
        await Acquirer.delete(acquirerId);
        loadAcquirers();
        toast({ title: "Sucesso", description: "Adquirente excluída com sucesso." });
      } catch (error) {
        console.error("Erro ao excluir adquirente:", error);
        toast({ title: "Erro", description: "Não foi possível excluir a adquirente.", variant: "destructive" });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await User.me();
      const payload = {
        ...currentAcquirer,
        company_id: user.company_id,
        company_name: user.company_name,
      };

      if (isEditing) {
        const { id, ...data } = payload;
        await Acquirer.update(id, data);
      } else {
        await Acquirer.create({ ...payload, created_by_name: user.full_name });
      }
      setShowForm(false);
      resetForm();
      loadAcquirers();
      toast({ title: "Sucesso", description: `Adquirente ${isEditing ? 'atualizada' : 'salva'} com sucesso.` });
    } catch (error) {
      console.error("Erro ao salvar adquirente:", error);
      toast({ title: "Erro", description: "Não foi possível salvar a adquirente.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setCurrentAcquirer(initialAcquirerState);
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
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Adquirentes</h1>
            <p className="text-slate-600">Gerencie as adquirentes de cartão.</p>
          </div>
          <Button onClick={() => { setShowForm(true); setIsEditing(false); resetForm(); }} className="text-white" style={{ backgroundColor: '#e78b3a' }}>
            <Plus className="w-5 h-5 mr-2" />
            Nova Adquirente
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {isEditing ? 'Editar Adquirente' : 'Nova Adquirente'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Nome da Adquirente *</Label>
                    <Input
                      value={currentAcquirer.name}
                      onChange={(e) => setCurrentAcquirer(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Taxa (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentAcquirer.fee_percentage}
                      onChange={(e) => setCurrentAcquirer(prev => ({ ...prev, fee_percentage: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label>Dias para Liquidação</Label>
                    <Input
                      type="number"
                      value={currentAcquirer.settlement_days}
                      onChange={(e) => setCurrentAcquirer(prev => ({ ...prev, settlement_days: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-4">
                  <Switch
                    id="active-switch"
                    checked={currentAcquirer.active}
                    onCheckedChange={(checked) => setCurrentAcquirer(prev => ({ ...prev, active: checked }))}
                  />
                  <Label htmlFor="active-switch">Ativo</Label>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="text-white hover:opacity-90" style={{ backgroundColor: '#223f61' }}>
                    {isEditing ? 'Salvar Alterações' : 'Salvar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Adquirentes Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Taxa (%)</TableHead>
                  <TableHead>Dias Liquidação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acquirers.map(acq => (
                  <TableRow key={acq.id}>
                    <TableCell className="font-medium">{acq.name}</TableCell>
                    <TableCell>{acq.fee_percentage}%</TableCell>
                    <TableCell>{acq.settlement_days}</TableCell>
                    <TableCell>
                      <Badge className={acq.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {acq.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(acq)} className="mr-2 hover:bg-blue-100">
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(acq.id)} className="hover:bg-red-100">
                        <Trash2 className="w-4 h-4 text-red-600" />
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