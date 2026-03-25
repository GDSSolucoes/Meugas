import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Folder, X } from "lucide-react";
import { FinancialSubgroup } from "@/entities/FinancialSubgroup";
import { FinancialGroup } from "@/entities/FinancialGroup";
import  User  from "@/lib/providers/user";
import { useToast } from "@/components/ui/use-toast";

export default function FinancialSubgroups() {
  const { toast } = useToast();
  const [subgroups, setSubgroups] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estados para o modal de cadastro rápido de grupo
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    type: 'despesa', // Default to 'despesa' as specified
    description: ''
  });

  const initialSubgroupState = {
    name: '',
    description: '',
    financial_group_id: '',
    financial_group_name: '',
    active: true,
    created_by_name: ''
  };

  const [currentSubgroup, setCurrentSubgroup] = useState(initialSubgroupState);

  const loadData = useCallback(async () => {
    try {
      const user = await User.me();
      const [subgroupsData, groupsData] = await Promise.all([
        FinancialSubgroup.filter({ company_id: user.company_id }, '-created_date'),
        FinancialGroup.filter({ company_id: user.company_id, active: true })
      ]);
      setSubgroups(subgroupsData);
      setGroups(groupsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os dados.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Função para salvar grupo rapidamente
  const handleSaveQuickGroup = async () => {
    try {
      // Basic validation for new group name
      if (!newGroup.name.trim()) {
        toast({ title: "Erro", description: "O nome do grupo é obrigatório.", variant: "destructive" });
        return;
      }

      const user = await User.me();
      const groupData = {
        ...newGroup,
        name: newGroup.name.toUpperCase(),
        description: newGroup.description.toUpperCase(),
        company_id: user.company_id,
        company_name: user.company_name,
        created_by_name: user.full_name,
        active: true
      };

      const savedGroup = await FinancialGroup.create(groupData);
      
      // Recarregar grupos
      const updatedGroups = await FinancialGroup.filter({ company_id: user.company_id, active: true });
      setGroups(updatedGroups);
      
      // Selecionar automaticamente o novo grupo
      setCurrentSubgroup(prev => ({
        ...prev,
        financial_group_id: savedGroup.id,
        financial_group_name: savedGroup.name
      }));

      // Resetar form e fechar modal
      setNewGroup({ name: '', type: 'despesa', description: '' });
      setShowGroupModal(false);
      
      toast({ title: "Sucesso", description: "Grupo financeiro criado e selecionado!" });
    } catch (error) {
      console.error("Erro ao salvar grupo:", error);
      toast({ title: "Erro", description: "Não foi possível criar o grupo.", variant: "destructive" });
    }
  };

  const handleEdit = (subgroup) => {
    setIsEditing(true);
    setCurrentSubgroup(subgroup);
    setShowForm(true);
  };

  const handleDelete = async (subgroupId) => {
    if (window.confirm("Tem certeza que deseja excluir este subgrupo?")) {
      try {
        await FinancialSubgroup.delete(subgroupId);
        loadData(); // Reload data after deletion
        toast({ title: "Sucesso", description: "Subgrupo excluído." });
      } catch (error) {
        console.error("Erro ao excluir subgrupo:", error);
        toast({ title: "Erro", description: "Não foi possível excluir o subgrupo.", variant: "destructive" });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!currentSubgroup.financial_group_id) {
        toast({ title: "Erro", description: "O grupo financeiro é obrigatório.", variant: "destructive" });
        return;
      }
      const user = await User.me();
      const selectedGroup = groups.find(g => g.id === currentSubgroup.financial_group_id);
      
      const subgroupData = {
        ...currentSubgroup,
        financial_group_name: selectedGroup ? selectedGroup.name : '',
        company_id: user.company_id,
        company_name: user.company_name,
        created_by_name: user.full_name
      };

      if (isEditing) {
        const { id, ...dataToUpdate } = subgroupData;
        await FinancialSubgroup.update(id, dataToUpdate);
        toast({ title: "Sucesso", description: "Subgrupo financeiro atualizado com sucesso." });
      } else {
        await FinancialSubgroup.create(subgroupData);
        toast({ title: "Sucesso", description: "Subgrupo financeiro criado com sucesso." });
      }

      setShowForm(false);
      resetForm();
      loadData(); // Reload data after save/update
    } catch (error) {
      console.error("Erro ao salvar subgrupo:", error);
      toast({ title: "Erro", description: "Não foi possível salvar o subgrupo financeiro.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setCurrentSubgroup(initialSubgroupState);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const handleGroupChange = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    setCurrentSubgroup(prev => ({
      ...prev,
      financial_group_id: groupId,
      financial_group_name: group ? group.name : ''
    }));
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom right, #f2f1ed, #95b4df)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Subgrupos Financeiros</h1>
            <p className="text-slate-600">Detalhe suas receitas e despesas.</p>
          </div>
          <Button onClick={() => { setShowForm(true); setIsEditing(false); resetForm(); }} className="text-white" style={{ backgroundColor: '#e78b3a' }}>
            <Plus className="w-5 h-5 mr-2" />
            Novo Subgrupo
          </Button>
        </div>

        {/* Modal de Cadastro Rápido de Grupo */}
        {showGroupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Cadastro Rápido - Grupo Financeiro</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowGroupModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Nome do Grupo *</Label>
                    <Input
                      value={newGroup.name}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Receitas de Vendas, Despesas Fixas..."
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Tipo *</Label>
                    <Select value={newGroup.type} onValueChange={(value) => setNewGroup(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                        <SelectItem value="movimentacao">Movimentação</SelectItem>
                        <SelectItem value="investimento">Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={newGroup.description}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do grupo..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button type="button" variant="outline" onClick={() => setShowGroupModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleSaveQuickGroup} className="bg-green-600 hover:bg-green-700">
                    Criar e Selecionar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <Card className="mb-8 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                {isEditing ? 'Editar Subgrupo' : 'Novo Subgrupo'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subgroup-name">Nome do Subgrupo *</Label>
                    <Input
                      id="subgroup-name"
                      value={currentSubgroup.name}
                      onChange={(e) => setCurrentSubgroup(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                      required
                      placeholder="Ex: Salários, Vendas de GLP..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="financial-group-select">Grupo Financeiro *</Label>
                    <div className="flex gap-2">
                      <Select value={currentSubgroup.financial_group_id} onValueChange={handleGroupChange}>
                        <SelectTrigger id="financial-group-select" className="flex-1">
                          <SelectValue placeholder="Selecione um grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(group => (
                            <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="icon"
                        onClick={() => setShowGroupModal(true)}
                        className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                        title="Cadastrar novo grupo financeiro"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="subgroup-description">Descrição</Label>
                  <Textarea
                    id="subgroup-description"
                    value={currentSubgroup.description}
                    onChange={(e) => setCurrentSubgroup(prev => ({ ...prev, description: e.target.value.toUpperCase() }))}
                    placeholder="Descreva este subgrupo..."
                    rows={3}
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
          <CardHeader><CardTitle>Subgrupos Cadastrados</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Grupo Principal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subgroups.map(subgroup => (
                  <TableRow key={subgroup.id}>
                    <TableCell className="font-medium">{subgroup.name}</TableCell>
                    <TableCell>{subgroup.financial_group_name}</TableCell>
                    <TableCell>
                      <Badge variant={subgroup.active ? 'default' : 'outline'}
                             className={subgroup.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {subgroup.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(subgroup)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(subgroup.id)}>
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