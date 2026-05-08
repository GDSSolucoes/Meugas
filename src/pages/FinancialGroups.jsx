import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, FolderKanban } from "lucide-react";
import { FinancialGroup } from "@/entities/FinancialGroup";
import { User } from "@/entities/User";
import { useToast } from "@/components/ui/use-toast";

export default function FinancialGroupsPage() {
  const { toast } = useToast();
  const [financialGroups, setFinancialGroups] = useState([]); // Renamed from 'groups'
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const initialGroupState = {
    name: "",
    type: "despesa",
    description: "",
    active: true,
    createdByName: "",
  };

  const [currentGroup, setCurrentGroup] = useState(initialGroupState);
  // refreshTrigger is no longer needed as loadData is called directly after CUD operations

  const loadData = useCallback(async () => {
    try {
      const user = await User.me();
      const data = await FinancialGroup.filter(
        { companyId: user.companyId },
        { sort: "-createdAt" },
      );
      setFinancialGroups(data);
    } catch (error) {
      console.error("Erro ao carregar grupos financeiros:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os grupos financeiros.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (group) => {
    setIsEditing(true);
    setCurrentGroup(group);
    setShowForm(true);
  };

  const handleDelete = async (groupId) => {
    if (window.confirm("Tem certeza que deseja excluir este grupo?")) {
      try {
        await FinancialGroup.delete(groupId);
        loadData(); // Call loadData instead of setRefreshTrigger
        toast({ title: "Sucesso", description: "Grupo excluído." });
      } catch (error) {
        console.error("Erro ao excluir grupo:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o grupo.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await User.me();
      const groupData = {
        ...currentGroup,
        companyId: user.companyId,
        companyName: user.companyName,
        createdByName: user.name,
      };

      if (isEditing) {
        const { id, ...dataToUpdate } = groupData;
        await FinancialGroup.update(id, dataToUpdate);
        toast({
          title: "Sucesso",
          description: "Grupo financeiro atualizado com sucesso.",
        });
      } else {
        await FinancialGroup.create(groupData);
        toast({
          title: "Sucesso",
          description: "Grupo financeiro criado com sucesso.",
        });
      }

      setShowForm(false); // Preserve original functionality
      resetForm();
      loadData(); // Call loadData instead of setRefreshTrigger
    } catch (error) {
      console.error("Erro ao salvar grupo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o grupo financeiro.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCurrentGroup(initialGroupState);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: "linear-gradient(to bottom right, #f2f1ed, #95b4df)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Grupos Financeiros
            </h1>
            <p className="text-slate-600">
              Organize suas receitas e despesas em categorias.
            </p>
          </div>
          <Button
            onClick={() => {
              setShowForm(true);
              setIsEditing(false);
              resetForm();
            }}
            className="text-white"
            style={{ backgroundColor: "#e78b3a" }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Grupo
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5" />
                {isEditing ? "Editar Grupo" : "Novo Grupo Financeiro"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Grupo *</Label>
                    <Input
                      value={currentGroup.name}
                      onChange={(e) =>
                        setCurrentGroup((prev) => ({
                          ...prev,
                          name: e.target.value.toUpperCase(),
                        }))
                      }
                      required
                      placeholder="Ex: Despesas Fixas, Receitas de Vendas..."
                    />
                  </div>
                  <div>
                    <Label>Tipo *</Label>
                    <Select
                      value={currentGroup.type}
                      onValueChange={(value) =>
                        setCurrentGroup((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                        <SelectItem value="movimentacao">
                          Movimentação
                        </SelectItem>
                        <SelectItem value="investimento">
                          Investimento
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={currentGroup.description}
                    onChange={(e) =>
                      setCurrentGroup((prev) => ({
                        ...prev,
                        description: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="Descreva este grupo financeiro..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="text-white hover:opacity-90"
                    style={{ backgroundColor: "#223f61" }}
                  >
                    {isEditing ? "Salvar Alterações" : "Salvar"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Grupos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financialGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          group.type === "receita"
                            ? "default"
                            : group.type === "despesa"
                              ? "destructive"
                              : group.type === "movimentacao"
                                ? "secondary"
                                : "outline"
                        }
                        className={
                          group.type === "receita"
                            ? "bg-green-100 text-green-800"
                            : group.type === "despesa"
                              ? "bg-red-100 text-red-800"
                              : group.type === "movimentacao"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                        }
                      >
                        {group.type === "receita"
                          ? "Receita"
                          : group.type === "despesa"
                            ? "Despesa"
                            : group.type === "movimentacao"
                              ? "Movimentação"
                              : "Investimento"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {group.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={group.active ? "default" : "outline"}
                        className={
                          group.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {group.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(group)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(group.id)}
                      >
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
