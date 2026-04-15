import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UsersIcon, Edit, Info } from "lucide-react";
import { Users } from "@/entities/Users";
import { Companies } from "@/entities/Companies"; // Importar a entidade Company
import { format, parseISO } from "date-fns";
import { useToast } from "@/components/ui/use-toast"; // Importar useToast

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]); // State para armazenar as empresas
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // State para armazenar o usuário logado
  const { toast } = useToast(); // Inicializar useToast
  
  const loadData = useCallback(async () => { // Renamed from loadUsers
    try {
      const user = await Users.me();
      setCurrentUser(user);

      // Verificar se o usuário tem permissão para acessar esta página
      if (user.userType !== 'admin' && user.userType !== 'superAdmin') {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para gerenciar usuários.",
          variant: "destructive"
        });
        window.location.href = "/"; 
        return;
      }

      let usersData, companiesData;

      if (user.email === 'brasileirosilvia@gmail.com') { // Condição para super admin
        // Super admin vê todos os usuários e empresas
        [usersData, companiesData] = await Promise.all([
          Users.list('-createdDate'),
          Companies.list('name') // Carregar todas as empresas em ordem alfabética
        ]);
      } else {
        // Admin da empresa vê usuários da sua empresa E usuários sem empresa
        const allUsers = await Users.list();
        const usersOfCompany = user.companyId ? allUsers.filter(u => u.companyId === user.companyId) : [];
        const usersWithoutCompany = allUsers.filter(u => !u.companyId);
        
        usersData = [...usersOfCompany, ...usersWithoutCompany];
        
        // Carregar apenas a empresa do admin, se ele tiver uma
        companiesData = user.companyId ? await Companies.filter({ id: user.companyId }) : [];
      }

      setUsers(usersData);
      setCompanies(companiesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setUsers([]);
      setCompanies([]);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive"
      });
    }
  }, [toast]); // `toast` is a dependency here because it's used inside loadData

  useEffect(() => {
    loadData(); // Changed to loadData
  }, [loadData]); // Added loadData to the dependency array

  const handleEdit = (user) => {
    setEditingUser({ ...user });
    setShowForm(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsLoading(true);
    
    try {
      const { id, ...userData } = editingUser;
      
      // GARANTIR que companyName seja salvo junto com companyId
      const company = companies.find(c => c.id === userData.companyId);
      if (company) {
        userData.companyName = company.name;
        console.log('Salvando usuário com:', { companyId: userData.companyId, companyName: userData.companyName });
      } else if (userData.companyId === null || userData.companyId === '') {
        userData.companyName = null; // Explicitly set to null if companyId is null or empty
      }
      
      const updatedUser = await Users.update(id, userData);
      console.log('Usuário atualizado:', updatedUser);
      
      toast({ title: "Sucesso", description: "Usuário atualizado com sucesso." });
      
      setShowForm(false);
      setEditingUser(null);
      loadData(); // Recarrega os dados para refletir a mudança
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o usuário.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const getUserTypeBadge = (userType) => {
    // Adicionado superAdmin para o badge também, caso necessário.
    // O outline não especifica badge para superAdmin, então manter admin para superAdmin.
    return userType === 'admin' || userType === 'superAdmin'
      ? <Badge className="bg-purple-100 text-purple-800">Administrador</Badge>
      : <Badge className="bg-blue-100 text-blue-800">Atendente</Badge>;
  };

  const getStatusBadge = (active) => {
    return active 
      ? <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      : <Badge className="bg-red-100 text-red-800">Inativo</Badge>;
  };

  // Se o currentUser foi carregado e não tem permissão, renderizar mensagem de acesso restrito
  if (currentUser && currentUser.userType !== 'admin' && currentUser.userType !== 'superAdmin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <UsersIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Acesso Restrito</h2>
              <p className="text-red-600">Apenas administradores podem gerenciar usuários.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Se o currentUser ainda não foi carregado, pode-se renderizar um loader ou null
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <p className="text-slate-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Gerenciamento de Usuários</h1>
            <p className="text-slate-600">
              {currentUser?.email === 'brasileirosilvia@gmail.com' 
                ? "Edite as permissões e dados de todos os usuários do sistema."
                : `Edite os usuários da sua empresa: ${currentUser?.companyName || 'N/A'}`
              }
            </p>
          </div>
        </div>

        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Info className="w-5 h-5" />
                  Como convidar e associar novos usuários?
              </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-2">
              <p>
                  O processo tem duas etapas. Primeiro, convide o usuário para a plataforma e, depois, associe-o a uma empresa.
              </p>
              <ol className="list-decimal list-inside space-y-1 font-medium">
                  <li><strong>Passo 1: Convidar.</strong> Navegue até a aba <strong>"Dashboard" &rarr; "Users"</strong> no menu da plataforma (fora deste app). Clique em "Invite User" e preencha o email.</li>
                  <li><strong>Passo 2: Associar.</strong> Após o usuário aceitar o convite e fazer login, ele aparecerá nesta lista. Clique no botão de edição (✏️) para associá-lo a uma empresa e definir seu tipo de acesso.</li>
              </ol>
          </CardContent>
        </Card>

        {showForm && editingUser && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5" />
                Editar Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <Input
                      value={editingUser.fullName || ''}
                      readOnly
                      disabled
                      className="bg-slate-100"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editingUser.email || ''}
                      readOnly
                      disabled
                      className="bg-slate-100"
                    />
                  </div>
                  
                  {/* Só mostrar seleção de empresa se for super admin */}
                  {currentUser?.email === 'brasileirosilvia@gmail.com' ? (
                    <div>
                      <Label>Empresa *</Label>
                      <Select
                        value={editingUser.companyId || ''}
                        onValueChange={(value) => {
                          const company = companies.find(c => c.id === value);
                          setEditingUser(prev => ({ 
                            ...prev, 
                            companyId: value === "" ? null : value, // Set to null if empty string is selected
                            companyName: value === "" ? null : company?.name // Set name to null if empty string is selected
                          }));
                        }}
                      >
                        <SelectTrigger className="bg-white/80">
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Não Associado</SelectItem> {/* Option for super admin to unassign */}
                          {companies.map(company => (
                            <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    // Lógica para admin de empresa: só pode associar à sua própria empresa ou deixar desassociado
                    <div>
                      <Label>Empresa *</Label>
                      <Select
                        value={editingUser.companyId || ''}
                        onValueChange={(value) => {
                          // For company admin, 'value' can only be their company's ID or empty string.
                          if (value === "") { // User selected "Não Associado"
                            setEditingUser(prev => ({
                              ...prev,
                              companyId: null,
                              companyName: null
                            }));
                          } else if (value === currentUser.companyId) { // User selected their company
                            setEditingUser(prev => ({ 
                              ...prev, 
                              companyId: currentUser.companyId,
                              companyName: currentUser.companyName 
                            }));
                          }
                        }}
                        // Disabled if the user is already associated with ANY company OTHER THAN the current user's company.
                        // Since this is not a super admin, they can only manage their own company's users.
                        disabled={!!(editingUser.companyId && editingUser.companyId !== currentUser.companyId)}
                      >
                        <SelectTrigger className="bg-white/80">
                          <SelectValue placeholder={editingUser.companyId ? companies.find(c => c.id === editingUser.companyId)?.name : "Selecione a empresa"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={null}>Não Associado</SelectItem>
                            {currentUser.companyId && (
                                <SelectItem value={currentUser.companyId}>
                                    {currentUser.companyName}
                                </SelectItem>
                            )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div>
                    <Label>Tipo de Usuário *</Label>
                    <Select
                      value={editingUser.userType || ''}
                      onValueChange={(value) => setEditingUser(prev => ({ ...prev, userType: value }))}
                    >
                      <SelectTrigger className="bg-white/80">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="atendente">Atendente (Apenas Pedidos)</SelectItem>
                        <SelectItem value="admin">Administrador (Todos os Módulos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Telefone *</Label>
                    <Input
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                      required
                      className="bg-white/80"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label>Departamento *</Label>
                    <Input
                      value={editingUser.department || ''}
                      onChange={(e) => setEditingUser(prev => ({ ...prev, department: e.target.value }))}
                      required
                      className="bg-white/80"
                      placeholder="Ex: Vendas, Atendimento, Gerência"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle>
              {currentUser?.email === 'brasileirosilvia@gmail.com' 
                ? "Todos os Usuários do Sistema"
                : `Usuários da ${currentUser?.companyName || 'N/A'} e Não Associados`
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.companyName || <span className="text-slate-400">Não associada</span>}</TableCell>
                      <TableCell>{getUserTypeBadge(user.userType)}</TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>{getStatusBadge(user.active)}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {user.createdDate ? format(parseISO(user.createdDate), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(user)} 
                          className="mr-2 hover:bg-blue-100"
                          title="Editar usuário"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                        {currentUser?.email === 'brasileirosilvia@gmail.com' 
                          ? "Nenhum usuário encontrado no sistema."
                          : "Nenhum usuário encontrado para sua empresa. Convide usuários através do painel da plataforma."
                        }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}