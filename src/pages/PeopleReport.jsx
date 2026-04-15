
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UsersIcon, UserCheck, Phone, MapPin, Gift } from "lucide-react";
import { Persons } from "@/entities/Persons";
import { Users } from "@/entities/Users";
import { format, parseISO } from 'date-fns';

export default function PeopleReportPage() {
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      const user = await Users.me();
      if (!user.companyId) {
        setIsLoading(false);
        return;
      }
      const data = await Persons.filter({ companyId: user.companyId }, '-createdDate');
      setPeople(data);
    } catch (error) {
      console.error("Erro ao carregar pessoas:", error);
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

  const clientes = people.filter(p => p.type === 'cliente');
  const fornecedores = people.filter(p => p.type === 'fornecedor');
  const pontosVenda = people.filter(p => p.type === 'pontoVenda');
  const conveniadas = people.filter(p => p.type === 'conveniada');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Relatório de Pessoas</h1>
          <p className="text-slate-600">Visão completa de clientes, fornecedores e pontos de venda</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pessoas</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{people.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
              <UsersIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fornecedores.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pontos de Venda</CardTitle>
              <UsersIcon className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pontosVenda.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas Conveniadas</CardTitle>
              <UsersIcon className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conveniadas.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle>Lista Completa de Pessoas</CardTitle>
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
                      <TableHead>Tipo</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Aniversário</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {people.map(person => (
                      <TableRow key={person.id}>
                        <TableCell className="font-medium">{person.name}</TableCell>
                        <TableCell>{getTypeBadge(person.type)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {person.phone?.[0] || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {person.address?.city || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {person.birthday ? (
                              <>
                                <Gift className="w-3 h-3 text-pink-500" />
                                {format(parseISO(person.birthday), 'dd/MM/yyyy')}
                              </>
                            ) : (
                              '-'
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={person.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {person.active ? "Ativo" : "Inativo"}
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
