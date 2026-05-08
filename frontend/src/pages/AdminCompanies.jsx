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
import {
  Plus,
  Building2,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  AlertCircle,
  UsersIcon,
  DollarSign,
  Home,
  Database,
} from "lucide-react";
import { User } from "@/entities/User";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Company } from "@/entities";

export default function AdminCompaniesPage() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    suspendedCompanies: 0,
    totalRevenue: 0,
  });

  const initialCompanyState = {
    name: "",
    document: "",
    email: "",
    phone: "",
    address: {
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      zipcode: "",
    },
    planType: "basic",
    monthlyFee: 0,
    dueDate: format(new Date(), "yyyy-MM-dd"),
    status: "ativa",
    suspensionReason: "",
    notes: "",
    adminName: "",
    adminEmail: "",
    createdByName: "",
  };

  const [currentCompany, setCurrentCompany] = useState(initialCompanyState);

  const loadCompanies = useCallback(async () => {
    try {
      const user = await User.me();

      if (user.email !== "brasileirosilvia@gmail.com") {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para acessar esta área.",
          variant: "destructive",
        });
        window.location.href = "/";
        return;
      }

      const companiesData = await Company.filter();
      setCompanies(companiesData);

      const active = companiesData.filter((c) => c.status === "ativa").length;
      const suspended = companiesData.filter(
        (c) => c.status === "suspensa_pagamento",
      ).length;
      debugger;
      const totalRevenue = companiesData.reduce(
        (sum, c) => sum + (c.monthlyFee || 0),
        0,
      );

      setStats({
        totalCompanies: companiesData.length,
        activeCompanies: active,
        suspendedCompanies: suspended,
        totalRevenue: totalRevenue,
      });
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as empresas.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleEdit = (company) => {
    setIsEditing(true);
    setCurrentCompany(company);
    setShowForm(true);
  };

  const handleDelete = async (companyId) => {
    if (
      window.confirm(
        "Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.",
      )
    ) {
      try {
        await Company.delete(companyId);
        loadCompanies();
        toast({
          title: "Sucesso",
          description: "Empresa excluída com sucesso.",
        });
      } catch (error) {
        console.error("Erro ao excluir empresa:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a empresa.",
          variant: "destructive",
        });
      }
    }
  };

  const handleStatusChange = async (companyId, newStatus, reason = "") => {
    try {
      const updateData = {
        status: newStatus,
        suspensionReason: newStatus === "suspensa_pagamento" ? reason : "",
      };
      await Company.update(companyId, updateData);
      loadCompanies();

      const statusLabels = {
        ativa: "ativada",
        inativa: "inativada",
        suspensa_pagamento: "suspensa",
      };

      toast({
        title: "Sucesso",
        description: `Empresa ${statusLabels[newStatus]} com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da empresa.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await User.me();

      if (isEditing) {
        const { id, ...companyData } = currentCompany;
        await Company.update(id, companyData);
        toast({
          title: "Sucesso",
          description: "Empresa atualizada com sucesso.",
        });
      } else {
        // Criar a empresa
        const newCompany = await Company.create({
          ...currentCompany,
          createdByName: user.name,
        });

        // AUTOMATICAMENTE vincular o usuário administrador à empresa criada
        try {
          // Buscar se o usuário já existe
          const existingUser = await User.filter({
            email: currentCompany.adminEmail,
          });

          if (existingUser.length > 0) {
            // Usuário já existe, apenas atualizar o vínculo com a empresa
            await User.updateMyUserData(existingUser[0].id, {
              companyId: newCompany.id,
              companyName: newCompany.name,
              userType: "admin", // Garantir que é admin da empresa
            });
            console.log(
              `Usuário ${currentCompany.adminEmail} vinculado automaticamente à empresa ${newCompany.name}`,
            );
            toast({
              title: "Sucesso",
              description: `Empresa criada e o administrador ${currentCompany.adminEmail} foi vinculado automaticamente.`,
              duration: 10000,
            });
          } else {
            console.log(
              `Usuário ${currentCompany.adminEmail} não existe ainda. Será vinculado quando fizer o primeiro login.`,
            );
            toast({
              title: "Sucesso",
              description: `Empresa criada! O administrador ${currentCompany.adminEmail} será vinculado no primeiro login. Convide-o pela plataforma se ainda não for usuário.`,
              duration: 10000,
            });
          }
        } catch (userError) {
          console.error("Erro ao vincular usuário à empresa:", userError);
          toast({
            title: "Empresa Criada",
            description: `Empresa criada com sucesso, mas houve um problema ao vincular o administrador. Vincule manualmente em "Gerenciar Usuários".`,
            duration: 8000,
          });
        }
      }

      setShowForm(false);
      resetForm();
      loadCompanies();
    } catch (error) {
      console.error("Erro ao salvar empresa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a empresa.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCurrentCompany(initialCompanyState);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const getStatusBadge = (status) => {
    const configs = {
      ativa: { color: "bg-green-100 text-green-800", label: "Ativa" },
      inativa: { color: "bg-gray-100 text-gray-800", label: "Inativa" },
      suspensa_pagamento: {
        color: "bg-red-100 text-red-800",
        label: "Suspensa",
      },
    };
    const config = configs[status] || configs.inativa;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPlanBadge = (plan) => {
    const configs = {
      basic: { color: "bg-blue-100 text-blue-800", label: "Básico" },
      premium: { color: "bg-purple-100 text-purple-800", label: "Premium" },
      enterprise: {
        color: "bg-orange-100 text-orange-800",
        label: "Enterprise",
      },
    };
    const config = configs[plan] || configs.basic;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Administração de Empresas
            </h1>
            <p className="text-slate-300 text-lg">
              Controle total do sistema multi-empresa
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Home")}>
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar para o Menu
              </Button>
            </Link>
            <Link to={createPageUrl("Users")}>
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <UsersIcon className="w-4 h-4 mr-2" />
                Gerenciar Usuários
              </Button>
            </Link>
            <Link to={createPageUrl("DataMigration")}>
              <Button
                variant="outline"
                className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border-yellow-500/30"
              >
                <Database className="w-4 h-4 mr-2" />
                Migrar Dados
              </Button>
            </Link>
            <Button
              onClick={() => {
                setShowForm(true);
                setIsEditing(false);
                resetForm();
              }}
              className="bg-green-600 hover:bg-green-700 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Empresa
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Total de Empresas
              </CardTitle>
              <Building2 className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.totalCompanies}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Empresas Ativas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {stats.activeCompanies}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Empresas Suspensas
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {stats.suspendedCompanies}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Receita Mensal
              </CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                R$ {stats.totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {showForm && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {isEditing ? "Editar Empresa" : "Cadastrar Nova Empresa"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-lg font-semibold -mb-2">
                  Dados da Empresa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome da Empresa *</Label>
                    <Input
                      value={currentCompany.name}
                      onChange={(e) =>
                        setCurrentCompany((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label>CNPJ *</Label>
                    <Input
                      value={currentCompany.document}
                      onChange={(e) =>
                        setCurrentCompany((prev) => ({
                          ...prev,
                          document: e.target.value,
                        }))
                      }
                      required
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={currentCompany.email}
                      onChange={(e) =>
                        setCurrentCompany((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={currentCompany.phone}
                      onChange={(e) =>
                        setCurrentCompany((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="bg-white/80"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold -mb-2">
                  Administrador Principal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Administrador *</Label>
                    <Input
                      value={currentCompany.adminName}
                      onChange={(e) =>
                        setCurrentCompany((prev) => ({
                          ...prev,
                          adminName: e.target.value,
                        }))
                      }
                      required
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label>Email do Administrador *</Label>
                    <Input
                      type="email"
                      value={currentCompany.adminEmail}
                      onChange={(e) =>
                        setCurrentCompany((prev) => ({
                          ...prev,
                          adminEmail: e.target.value,
                        }))
                      }
                      required
                      className="bg-white/80"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>CEP</Label>
                      <Input
                        value={currentCompany.address.zipcode}
                        onChange={(e) =>
                          setCurrentCompany((prev) => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              zipcode: e.target.value,
                            },
                          }))
                        }
                        className="bg-white/80"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label>Rua/Logradouro</Label>
                      <Input
                        value={currentCompany.address.street}
                        onChange={(e) =>
                          setCurrentCompany((prev) => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              street: e.target.value,
                            },
                          }))
                        }
                        className="bg-white/80"
                      />
                    </div>
                    <div>
                      <Label>Número</Label>
                      <Input
                        value={currentCompany.address.number}
                        onChange={(e) =>
                          setCurrentCompany((prev) => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              number: e.target.value,
                            },
                          }))
                        }
                        className="bg-white/80"
                      />
                    </div>
                    <div>
                      <Label>Bairro</Label>
                      <Input
                        value={currentCompany.address.neighborhood}
                        onChange={(e) =>
                          setCurrentCompany((prev) => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              neighborhood: e.target.value,
                            },
                          }))
                        }
                        className="bg-white/80"
                      />
                    </div>
                    <div>
                      <Label>Cidade</Label>
                      <Input
                        value={currentCompany.address.city}
                        onChange={(e) =>
                          setCurrentCompany((prev) => ({
                            ...prev,
                            address: { ...prev.address, city: e.target.value },
                          }))
                        }
                        className="bg-white/80"
                      />
                    </div>
                    <div>
                      <Label>Estado</Label>
                      <Input
                        value={currentCompany.address.state}
                        onChange={(e) =>
                          setCurrentCompany((prev) => ({
                            ...prev,
                            address: { ...prev.address, state: e.target.value },
                          }))
                        }
                        className="bg-white/80"
                      />
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold -mb-2">
                  Plano e Pagamento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Plano</Label>
                    <Select
                      value={currentCompany.planType}
                      onValueChange={(value) =>
                        setCurrentCompany((prev) => ({
                          ...prev,
                          planType: value,
                        }))
                      }
                    >
                      <SelectTrigger className="bg-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Básico</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Mensalidade (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentCompany.monthlyFee}
                      onChange={(e) =>
                        setCurrentCompany((prev) => ({
                          ...prev,
                          monthlyFee: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label>Data de Vencimento</Label>
                    <Input
                      type="date"
                      value={currentCompany.dueDate}
                      onChange={(e) =>
                        setCurrentCompany((prev) => ({
                          ...prev,
                          dueDate: e.target.value,
                        }))
                      }
                      className="bg-white/80"
                    />
                  </div>
                </div>

                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={currentCompany.notes}
                    onChange={(e) =>
                      setCurrentCompany((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="bg-white/80"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isEditing ? "Salvar Alterações" : "Cadastrar Empresa"}
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

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle>Lista de Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Admin Principal</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Mensalidade</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-gray-500">
                            {company.document}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{company.adminName}</div>
                          <div className="text-sm text-gray-500">
                            {company.adminEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(company.planType)}</TableCell>
                      <TableCell>
                        R$ {Number(company.monthlyFee)?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell>
                        {company.dueDate
                          ? format(new Date(company.dueDate), "dd/MM/yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(company.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(company)}
                            className="hover:bg-blue-100"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>

                          {company.status === "ativa" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const reason = prompt("Motivo da suspensão:");
                                if (reason)
                                  handleStatusChange(
                                    company.id,
                                    "suspensa_pagamento",
                                    reason,
                                  );
                              }}
                              className="hover:bg-red-100"
                            >
                              <Ban className="w-4 h-4 text-red-600" />
                            </Button>
                          )}

                          {company.status === "suspensa_pagamento" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleStatusChange(company.id, "ativa")
                              }
                              className="hover:bg-green-100"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(company.id)}
                            className="hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {companies.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-slate-500"
                      >
                        Nenhuma empresa cadastrada ainda
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
