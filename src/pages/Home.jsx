
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, ClipboardList, ArrowRight, LogOut, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users } from "@/entities/Users";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await Users.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Tem certeza que deseja sair do sistema?")) {
      try {
        await Users.logout();
        // Optionally redirect to login page or update state if logout is successful
        // navigate('/login'); // Example if using react-router-dom navigate hook
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const isAtendente = currentUser?.userType === 'atendente';
  const isAdmin = currentUser?.userType === 'admin';
  const isSuperAdmin = currentUser?.email === 'brasileirosilvia@gmail.com';

  return (
    <div className="min-h-screen">
      {/* Header com fundo branco */}
      <header className="bg-white shadow-md py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center relative">
            <div className="text-center flex-1">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ae08dc18c137aca4217238/a483a165fLogo5.png" 
                alt="MeuGás Logo" 
                className="mx-auto w-32 h-32 object-contain"
              />
            </div>
            <div className="absolute right-6">
              <Button
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-6 min-h-[calc(100vh-120px)]">
        <div className="max-w-7xl mx-auto">
          {/* Texto de apresentação */}
          <div className="text-center mb-12">
            <p className="text-xl text-slate-300">Sistema de Gestão Completo para Distribuidoras</p>
            <p className="text-lg text-slate-400 mt-2">
              Bem-vindo, {currentUser?.fullName} - {isSuperAdmin ? 'Proprietário(a)' : (isAdmin ? 'Administrador' : 'Atendente')}
            </p>
            <p className="text-lg text-slate-400 mt-1">
              {isAtendente ? 'Acesse o módulo de pedidos' : 'Selecione o módulo que deseja acessar'}
            </p>
          </div>

          {/* Module Selection */}
          <div className={`grid gap-8 ${isSuperAdmin ? 'md:grid-cols-3' : (isAtendente ? 'grid-cols-1 max-w-md mx-auto' : 'md:grid-cols-2')}`}>
            {/* Módulo Pedidos */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
                  <ClipboardList className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">Módulo Pedidos</CardTitle>
                <p className="text-slate-300 text-sm">Gestão de pedidos e entregas</p>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-slate-300 space-y-2 mb-6 text-left">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Cadastrar novos pedidos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Acompanhar entregas
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Gerenciar clientes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Controle de status
                  </li>
                </ul>
                <Link to={createPageUrl("PedidosDashboard")} className="w-full">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
                    Acessar Módulo Pedidos
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Módulo Gerencial - só mostrar para admins */}
            {isAdmin && (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">Módulo Gerencial</CardTitle>
                  <p className="text-slate-300 text-sm">Administração completa do negócio</p>
                </CardHeader>
                <CardContent className="text-center">
                  <ul className="text-slate-300 space-y-2 mb-6 text-left">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Dashboard executivo
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Vendas e financeiro
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Gestão de estoque
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Contas a receber
                    </li>
                  </ul>
                  <Link to={createPageUrl("Dashboard")} className="w-full">
                    <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg">
                      Acessar Módulo Gerencial
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Módulo Admin Empresas - só para super admin */}
            {isSuperAdmin && (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">Admin Empresas</CardTitle>
                  <p className="text-slate-300 text-sm">Gestão de todas as empresas</p>
                </CardHeader>
                <CardContent className="text-center">
                  <ul className="text-slate-300 space-y-2 mb-6 text-left">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      Cadastrar e gerenciar empresas
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      Controlar status e pagamentos
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      Definir planos e mensalidades
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      Visão geral da plataforma
                    </li>
                  </ul>
                  <Link to={createPageUrl("AdminCompanies")} className="w-full">
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg">
                      Acessar Admin
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-slate-400 text-sm">
              © 2024 MeuGás - Sistema de Gestão para Distribuidoras de Gás
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
