import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, UsersIcon, Edit, Trash2, Search, Phone, MapPin, Gift } from "lucide-react";
import { Persons } from "@/entities/Persons";
import { Orders } from "@/entities/Orders";
import { Sales } from "@/entities/Sales";
import { AccountsReceivables } from "@/entities/AccountsReceivables";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useToast } from "@/components/ui/use-toast";
import { Users } from "@/entities/Users";
import { format, parseISO } from 'date-fns';

export default function PeoplePage() {
  const { toast } = useToast();
  const [people, setPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const moduleParam = urlParams.get('module') || 'gerencial'; // Default to 'gerencial'

  const loadPeople = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await Users.me();
      const data = await Persons.filter({ companyId: user.companyId }, '-createdDate');
      setPeople(data);
      setFilteredPeople(data);
    } catch (error) {
      console.error("Erro ao carregar pessoas:", error);
      toast({ title: "Erro", description: "Não foi possível carregar as pessoas.", variant: "destructive" });
      setPeople([]);
      setFilteredPeople([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPeople(people);
    } else {
      const filtered = people.filter(person => 
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.document?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.phone?.some(phone => phone.includes(searchTerm)) ||
        String(person.personNumber).includes(searchTerm)
      );
      setFilteredPeople(filtered);
    }
  }, [searchTerm, people]);

  const checkPersonMovements = async (personId) => {
    try {
      const [orders, sales, receivables] = await Promise.all([
        Orders.list().then(orders => orders.filter(o => o.personId === personId)),
        Sales.list().then(sales => sales.filter(s => s.personId === personId)),
        AccountsReceivables.list().then(acc => acc.filter(a => a.personId === personId))
      ]);

      return {
        hasMovements: orders.length > 0 || sales.length > 0 || receivables.length > 0,
        ordersCount: orders.length,
        salesCount: sales.length,
        receivablesCount: receivables.length
      };
    } catch (error) {
      console.error("Erro ao verificar movimentações:", error);
      return { hasMovements: true }; // Por segurança, assume que tem movimentações
    }
  };

  const handleDelete = async (person) => {
    setIsLoading(true);
    
    try {
      const movements = await checkPersonMovements(person.id);
      
      if (movements.hasMovements) {
        toast({
          title: "Exclusão Bloqueada",
          description: `Não é possível excluir ${person.name}. Esta pessoa possui movimentações no sistema.`,
          variant: "destructive"
        });
        return;
      }

      if (window.confirm(`Tem certeza que deseja excluir ${person.name}?\n\nEsta ação não pode ser desfeita.`)) {
        await Persons.delete(person.id);
        loadPeople();
        toast({ title: "Sucesso", description: "Pessoa excluída com sucesso!" });
      }
    } catch (error) {
      console.error("Erro ao excluir pessoa:", error);
      toast({ title: "Erro", description: "Não foi possível excluir a pessoa.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      cliente: "bg-blue-100 text-blue-800",
      fornecedor: "bg-green-100 text-green-800",
      pontoVenda: "bg-purple-100 text-purple-800",
      conveniada: "bg-amber-100 text-amber-800"
    };
    const labels = {
      cliente: "Cliente",
      fornecedor: "Fornecedor", 
      pontoVenda: "Ponto de Venda",
      conveniada: "Conveniada"
    };
    return <Badge className={colors[type]}>{labels[type]}</Badge>;
  };

  const getStatusBadge = (active) => {
    return active 
      ? <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      : <Badge className="bg-red-100 text-red-800">Inativo</Badge>;
  };

  // Contadores por tipo
  const clientes = people.filter(p => p.type === 'cliente').length;
  const fornecedores = people.filter(p => p.type === 'fornecedor').length;
  const pontosVenda = people.filter(p => p.type === 'pontoVenda').length;
  const conveniadas = people.filter(p => p.type === 'conveniada').length;

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom right, #f2f1ed, #95b4df)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Gerenciar Pessoas</h1>
            <p className="text-slate-600">Visualize e gerencie todas as pessoas cadastradas no sistema</p>
          </div>
          <Link to={`${createPageUrl("CustomerRegistration")}?module=${moduleParam}`}>
            <Button className="shadow-lg text-white" style={{ backgroundColor: '#e78b3a' }}>
              <Plus className="w-5 h-5 mr-2" />
              Nova Pessoa
            </Button>
          </Link>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{people.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <UsersIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientes}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
              <UsersIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fornecedores}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pontos de Venda</CardTitle>
              <UsersIcon className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pontosVenda}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conveniadas</CardTitle>
              <UsersIcon className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conveniadas}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Pessoas</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome, documento ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Carregando...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Aniversário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPeople.length > 0 ? filteredPeople.map(person => (
                      <TableRow key={person.id}>
                        <TableCell className="font-medium">
                          {person.name}
                          <div className="text-xs text-slate-500">Cód: {person.personNumber || person.id.substring(0, 6)}</div>
                        </TableCell>
                        <TableCell>{getTypeBadge(person.type)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-600">{person.phone?.[0] || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-600">{person.address?.city || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {person.birthday ? (
                              <>
                                <Gift className="w-3 h-3 text-pink-500" />
                                <span className="text-slate-600">{format(parseISO(person.birthday), 'dd/MM')}</span>
                              </>
                            ) : (
                              '-'
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(person.active)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link to={`${createPageUrl("CustomerRegistration")}?module=${moduleParam}&edit=${person.id}`}>
                              <Button variant="ghost" size="icon" className="hover:bg-blue-100">
                                <Edit className="w-4 h-4 text-blue-600" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(person)}
                              className="hover:bg-red-100"
                              disabled={isLoading}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          {searchTerm ? 'Nenhuma pessoa encontrada com os termos de busca' : 'Nenhuma pessoa cadastrada ainda'}
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