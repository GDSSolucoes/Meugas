import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutGrid,
  Users,
  Package,
  UserCheck,
  Wallet,
  CreditCard,
  TrendingUp,
  Receipt,
  FileText,
  Menu,
  ClipboardList,
  Home,
  Settings,
  FolderOpen,
  ArrowRightLeft,
  PieChart,
  LogOut,
  Warehouse, // Added Warehouse icon for Sectors
  AlertTriangle, // Ícone adicionado
  DollarSign, // Adicionado DollarSign icon para Lançamentos Financeiros
  FolderKanban, // Adicionado
  Folder,       // Adicionado
  Gift, // Ícone para Vasilhames
  Archive, // Ícone para Retiradas
  Truck, // Ícone para Compras
  BarChart3, // Adicionado Building2 icon para Admin Empresas
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster"; // Importar o Toaster

// Import correto da entidade User
import  User  from "@/lib/providers/user";
import { Company } from "@/entities/Company"; // Import correto da entidade Company

const logoUrl = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ae08dc18c137aca4217238/a483a165f_logo5.png";

const modulePedidos = [
  { title: "Pedidos", url: createPageUrl("Orders"), icon: ClipboardList },
  { title: "Acompanhamento", url: createPageUrl("OrderTracking"), icon: TrendingUp },
  { title: "Cadastro de Pessoas", url: createPageUrl("People") + "?module=pedidos", icon: Users },
  { title: "Dashboard Pedidos", url: createPageUrl("PedidosDashboard"), icon: LayoutGrid },
  { title: "Configurações", url: createPageUrl("OrderConfig"), icon: Settings },
];

const moduleGerencial = [
  {
    groupLabel: "Geral",
    items: [{ title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutGrid }]
  },
  {
    groupLabel: "Cadastros",
    icon: FolderOpen,
    items: [
      { title: "Produtos", url: createPageUrl("Products"), icon: Package },
      { title: "Setor Master", url: createPageUrl("SectorMaster"), icon: Warehouse },
      { title: "Setores", url: createPageUrl("Sectors"), icon: Warehouse },
      { title: "Pessoas", url: createPageUrl("People"), icon: Users },
      { title: "Funcionários", url: createPageUrl("Employees"), icon: UserCheck },
      { title: "Usuários", url: createPageUrl("Users"), icon: Users },
      { title: "Contas/Caixa", url: createPageUrl("CashAccounts"), icon: Wallet },
      { title: "Tipos Pagamento", url: createPageUrl("PaymentTypes"), icon: CreditCard },
      { title: "Adquirentes", url: createPageUrl("Acquirers"), icon: CreditCard },
      { title: "Grupos Financeiros", url: createPageUrl("FinancialGroups"), icon: FolderKanban },
      { title: "Subgrupos Financeiros", url: createPageUrl("FinancialSubgroups"), icon: Folder },
      { title: "Facilitadores Fiscais", url: createPageUrl("Facilitadores"), icon: FileText },
    ],
  },
  {
    groupLabel: "Movimentação",
    icon: ArrowRightLeft,
    items: [
      { title: "Vendas", url: createPageUrl("Sales"), icon: Receipt },
      { title: "Vendas Realizadas", url: createPageUrl("SalesList"), icon: FileText },
      { title: "Orçamento", url: createPageUrl("Budget"), icon: FileText },
      { title: "Compras", url: createPageUrl("Purchases"), icon: Truck },
      { title: "Estoque", url: createPageUrl("StockMovement"), icon: Warehouse },
      { title: "Lançamentos Financeiros", url: createPageUrl("CashMovements"), icon: DollarSign },
      { title: "Contas a Pagar", url: createPageUrl("ContasAPagar"), icon: FileText },
      { title: "Contas a Receber", url: createPageUrl("AccountsReceivable"), icon: FileText },
      { title: "Empréstimo de Vasilhames", url: createPageUrl("VasilhameManagement"), icon: Gift },
      { title: "Retiradas de Produtos", url: createPageUrl("ProductPickupManagement"), icon: Archive },
      { title: "Limpeza de Dados", url: createPageUrl("DataCleanup"), icon: AlertTriangle },
      { title: "Acerto de Setores", url: createPageUrl("AcertoSetores"), icon: Warehouse },
      ],
      },
  {
    groupLabel: "Relatórios",
    icon: PieChart,
    items: [
      { title: "Relatório de Estoque", url: createPageUrl("StockReport"), icon: BarChart3 },
      { title: "Produtos", url: createPageUrl("ProductsReport"), icon: Package },
      { title: "Pessoas", url: createPageUrl("PeopleReport"), icon: Users },
      { title: "Funcionários", url: createPageUrl("EmployeesReport"), icon: UserCheck },
      { title: "Vendas", url: createPageUrl("SalesReport"), icon: Receipt },
      { title: "Pedidos", url: createPageUrl("OrdersReport"), icon: ClipboardList },
      { title: "Contas a Receber", url: createPageUrl("ReceivableReport"), icon: FileText },
    ],
  },
];

const moduleStyles = {
  pedidos: {
    label: "text-blue-600",
    buttonHover: "hover:bg-[#95b4df]/20",
    buttonActive: "bg-[#95b4df]/20 text-[#95b4df] shadow-sm",
  },
  gerencial: {
    label: "text-[#e78b3a]",
    buttonHover: "hover:bg-[#95b4df]/20",
    buttonActive: "bg-[#95b4df]/20 text-[#95b4df] shadow-sm",
  }
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        
        // LÓGICA DE AUTO-VÍNCULO: Se o usuário não tem company_id, tentar encontrar uma empresa pelo email
        if (!user.company_id && user.email) {
          try {
            const companies = await Company.list();
            const matchingCompany = companies.find(company => 
              company.admin_email === user.email && company.status === 'ativa'
            );
            
            if (matchingCompany) {
              // Auto-vincular usuário à empresa encontrada
              await User.updateMyUserData({
                company_id: matchingCompany.id,
                company_name: matchingCompany.name,
                user_type: 'admin'
              });
              
              console.log(`✅ Usuário ${user.email} vinculado automaticamente à empresa ${matchingCompany.name}`);
              
              // Recarregar os dados do usuário com o vínculo atualizado
              const updatedUser = await User.me();
              setCurrentUser(updatedUser);
              return; // Sair da função para evitar o setCurrentUser duplo
            }
          } catch (autoLinkError) {
            console.error("Erro no auto-vínculo:", autoLinkError);
          }
        }
        
        // DEBUG: Vamos ver exatamente o que está vindo do usuário
        console.log('=== DEBUG USUÁRIO ===');
        console.log('Dados completos do usuário:', user);
        console.log('company_id:', user.company_id);
        console.log('company_name:', user.company_name);
        console.log('====================');
        
        setCurrentUser(user);
      } catch (error) {
        // Se houver erro (usuário não logado), redireciona para a página Home que tem o botão de login
        window.location.href = createPageUrl("Home");
        console.error("Erro ao carregar usuário, redirecionando:", error);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Tem certeza que deseja sair do sistema?")) {
      try {
        await User.logout();
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      }
    }
  };

  // Se é a página AdminCompanies, usar layout especial
  if (currentPageName === 'AdminCompanies') {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  if (currentPageName === 'Home') {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  // Check URL parameters to determine module context for CustomerRegistration
  const urlParams = new URLSearchParams(window.location.search);
  const moduleParam = urlParams.get('module');
  
  let isPedidosModule;
  if (currentPageName === 'People') { // Changed from CustomerRegistration to People
    isPedidosModule = moduleParam === 'pedidos';
  } else {
    // The 'People' page is part of the 'gerencial' module.
    // The 'AddressSearch' page remains part of the 'pedidos' module,
    // as it's likely a utility for order-related address input, not a core gerencial entity.
    // 'OrderPeople' (Cadastro de Clientes) has been removed from the pedidos module list.
    isPedidosModule = ['Orders', 'OrderTracking', 'PedidosDashboard', 'AddressSearch', 'OrderConfig'].includes(currentPageName);
  }

  // Verificar permissões de acesso
  const isAtendente = currentUser?.user_type === 'atendente';
  const isAdmin = currentUser?.user_type === 'admin';
  const isSuperAdmin = currentUser?.email === 'brasileirosilvia@gmail.com';

  // Se é atendente e está tentando acessar módulo gerencial, redirecionar
  // Only redirect if currentUser data has been loaded
  if (currentUser && isAtendente && !isPedidosModule) {
    window.location.href = createPageUrl("PedidosDashboard");
    return null; // Return null to prevent rendering the current page
  }
  
  const currentModuleKey = isPedidosModule ? 'pedidos' : 'gerencial';
  const menuItems = isPedidosModule ? modulePedidos : moduleGerencial; // menuItems is now potentially grouped
  const styles = moduleStyles[currentModuleKey];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" style={{ background: 'linear-gradient(to bottom right, #f2f1ed, #95b4df)' }}>
        <Sidebar className="border-r border-slate-200/60 bg-white/95 backdrop-blur-sm">
          <SidebarHeader className="border-b border-slate-200/60 p-6">
            <div className="flex flex-col gap-3 mb-4">
              <img src={logoUrl} alt="MeuGás" className="w-32" />
              <p className="text-sm text-slate-500 font-medium border-l-2 pl-2 border-slate-200">
                {isPedidosModule ? 'Módulo Pedidos' : 'Módulo Gerencial'}
              </p>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-2">
            {isPedidosModule ? (
              <SidebarGroup>
                <SidebarGroupLabel className={`text-xs font-semibold uppercase tracking-wider px-3 py-3 ${styles.label}`}>
                  Navegação - Pedidos
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`transition-all duration-200 rounded-lg mb-1 ${styles.buttonHover} ${
                            location.pathname === item.url.split('?')[0] && 
                            (location.search === (item.url.includes('?') ? '?' + item.url.split('?')[1] : '') || !item.url.includes('?')) 
                            ? styles.buttonActive : ''
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                            <item.icon className="w-4 h-4" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ) : (
              // If not pedidos module, render gerencial groups.
              // Ensure that if isAtendente, only modules/pages allowed for atendente are shown (already handled by redirection logic)
              menuItems.map((group, index) => group.items.length > 0 && (
                <SidebarGroup key={index}>
                  <SidebarGroupLabel className={`text-xs font-semibold uppercase tracking-wider px-3 py-3 ${styles.label} flex items-center gap-2`}>
                    {group.icon && <group.icon className="w-3.5 h-3.5" />}
                    {group.groupLabel}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`transition-all duration-200 rounded-lg mb-1 ${styles.buttonHover} ${
                              location.pathname === item.url.split('?')[0] && 
                              (location.search === (item.url.includes('?') ? '?' + item.url.split('?')[1] : '') || !item.url.includes('?')) 
                              ? styles.buttonActive : ''
                            }`}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                              <item.icon className="w-4 h-4" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200/60 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {currentUser?.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 text-sm truncate">
                  {currentUser?.full_name || 'Usuário'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {currentUser?.user_type === 'admin' ? 'Administrador' : (currentUser?.user_type === 'atendente' ? 'Atendente' : 'Carregando...')}
                  {currentUser?.company_name && ` - ${currentUser.company_name}`}
                </p>
            </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4">
            <div className="flex items-center justify-between">
              {/* This part is md:hidden, only for smaller screens */}
              <div className="flex items-center gap-4 md:hidden">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
                <h1 className="text-xl font-semibold text-slate-800">MeuGás</h1>
              </div>
              
              <div className="flex items-center gap-6 ml-auto">
                <div className="text-right hidden sm:block">
                  <p className="font-semibold text-slate-700 text-sm truncate">
                    {currentUser?.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {currentUser?.company_name || 'Empresa não definida'}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Link to={createPageUrl("Home")}>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Menu Principal
                    </Button>
                  </Link>
                  
                  {/* O botão Admin Empresas foi removido daqui */}
                  
                  {/* Só mostrar botão do módulo gerencial se for admin */}
                  {isPedidosModule && isAdmin && (
                    <Link to={createPageUrl("Dashboard")}>
                      <Button variant="outline" size="sm" className="flex items-center gap-2 text-white hover:opacity-90" style={{ backgroundColor: '#223f61' }}>
                        <Settings className="w-4 h-4" />
                        Gerencial
                      </Button>
                    </Link>
                  )}
                  {/* Só mostrar botão do módulo pedidos se não for módulo pedidos E for admin */}
                  {!isPedidosModule && isAdmin && (
                    <Link to={createPageUrl("PedidosDashboard")}>
                      <Button variant="outline" size="sm" className="flex items-center gap-2 text-white hover:opacity-90" style={{ backgroundColor: '#223f61' }}>
                        <ClipboardList className="w-4 h-4" />
                        Pedidos
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-white hover:opacity-90"
                    style={{ backgroundColor: '#e78b3a' }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}