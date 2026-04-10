import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Database, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { Company } from "@/entities/Company";
import { Product } from "@/entities/Product";
import { Person } from "@/entities/Person";
import { Employee } from "@/entities/Employee";
import { Order } from "@/entities/Order";
import { Sale } from "@/entities/Sale";
import { CashAccount } from "@/entities/CashAccount";
import { PaymentType } from "@/entities/PaymentType";
import { Sector } from "@/entities/Sector";
import { ProductStock } from "@/entities/ProductStock";
import { CashMovement } from "@/entities/CashMovement";
import { FinancialGroup } from "@/entities/FinancialGroup";
import { FinancialSubgroup } from "@/entities/FinancialSubgroup";
import { ContasAPagar } from "@/entities/ContasAPagar";
import { AccountsReceivable } from "@/entities/AccountsReceivable";
import { VasilhameLoan } from "@/entities/VasilhameLoan";
import { ProductPickup } from "@/entities/ProductPickup";
import { Purchase } from "@/entities/Purchase";
import { StockTransfer } from "@/entities/StockTransfer";
import { User } from "@/entities/User";

export default function DataMigration() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [companiesData, user] = await Promise.all([
        Company.list(),
        User.me()
      ]);
      setCompanies(companiesData);
      setCurrentUser(user);

      // Contar registros sem companyId para cada entidade
      const entities = [
        { name: 'Produtos', entity: Product },
        { name: 'Pessoas', entity: Person },
        { name: 'Funcionários', entity: Employee },
        { name: 'Pedidos', entity: Order },
        { name: 'Vendas', entity: Sale },
        { name: 'Contas/Caixa', entity: CashAccount },
        { name: 'Formas Pagamento', entity: PaymentType },
        { name: 'Setores', entity: Sector },
        { name: 'Estoque', entity: ProductStock },
        { name: 'Movimentações', entity: CashMovement },
        { name: 'Grupos Financeiros', entity: FinancialGroup },
        { name: 'Subgrupos Financeiros', entity: FinancialSubgroup },
        { name: 'Contas a Pagar', entity: ContasAPagar },
        { name: 'Contas a Receber', entity: AccountsReceivable },
        { name: 'Empréstimo Vasilhames', entity: VasilhameLoan },
        { name: 'Retirada Produtos', entity: ProductPickup },
        { name: 'Compras', entity: Purchase },
        { name: 'Transferências', entity: StockTransfer }
      ];

      const newStats = {};
      for (const { name, entity } of entities) {
        try {
          const items = await entity.list();
          const itemsWithoutCompany = items.filter(item => !item.companyId);
          newStats[name] = itemsWithoutCompany.length;
        } catch (error) {
          console.error(`Erro ao carregar ${name}:`, error);
          newStats[name] = 0;
        }
      }
      
      setStats(newStats);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleMigration = async () => {
    if (!selectedCompany) {
      alert('Selecione uma empresa para associar os dados');
      return;
    }

    const totalItems = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    if (totalItems === 0) {
      alert('Não há dados para migrar. Todos os registros já possuem empresa associada.');
      return;
    }

    if (!window.confirm(`ATENÇÃO: Esta operação irá associar ${totalItems} registros à empresa selecionada.\n\nEsta operação NÃO PODE SER DESFEITA!\n\nDeseja continuar?`)) {
      return;
    }

    setIsLoading(true);
    setProgress('Iniciando migração...');
    
    try {
      const company = companies.find(c => c.id === selectedCompany);
      const companyData = {
        companyId: company.id,
        companyName: company.name
      };

      console.log('Iniciando migração para:', company.name);

      // Lista de entidades para migrar
      const entitiesToMigrate = [
        { name: 'Produtos', entity: Product },
        { name: 'Pessoas', entity: Person },
        { name: 'Funcionários', entity: Employee },
        { name: 'Setores', entity: Sector },
        { name: 'Contas/Caixa', entity: CashAccount },
        { name: 'Formas Pagamento', entity: PaymentType },
        { name: 'Grupos Financeiros', entity: FinancialGroup },
        { name: 'Subgrupos Financeiros', entity: FinancialSubgroup },
        { name: 'Estoque', entity: ProductStock },
        { name: 'Movimentações', entity: CashMovement },
        { name: 'Contas a Pagar', entity: ContasAPagar },
        { name: 'Contas a Receber', entity: AccountsReceivable },
        { name: 'Pedidos', entity: Order },
        { name: 'Vendas', entity: Sale },
        { name: 'Compras', entity: Purchase },
        { name: 'Transferências', entity: StockTransfer },
        { name: 'Empréstimo Vasilhames', entity: VasilhameLoan },
        { name: 'Retirada Produtos', entity: ProductPickup }
      ];

      for (const { name, entity } of entitiesToMigrate) {
        setProgress(`Migrando ${name}...`);
        
        try {
          const items = await entity.list();
          const itemsWithoutCompany = items.filter(item => !item.companyId);
          
          console.log(`${name}: ${itemsWithoutCompany.length} registros para migrar`);
          
          for (const item of itemsWithoutCompany) {
            await entity.update(item.id, companyData);
          }
          
          console.log(`${name}: Concluído`);
        } catch (error) {
          console.error(`Erro ao migrar ${name}:`, error);
        }
      }

      setProgress('Migração concluída!');
      setIsDone(true);
      
      // Recarregar estatísticas para mostrar que está tudo zerado
      await loadData();
      
      alert(`Migração concluída com sucesso!\n\nTodos os dados foram associados à empresa: ${company.name}`);
      
    } catch (error) {
      console.error("Erro durante migração:", error);
      alert("Erro durante a migração: " + error.message);
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  };

  // Verificar se usuário tem permissão
  if (!currentUser || currentUser.email !== 'brasileirosilvia@gmail.com') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-slate-600">
              Esta ferramenta é restrita ao super administrador do sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalItems = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Migração de Dados para Empresas</h1>
          <p className="text-slate-600">Ferramenta para associar dados existentes às empresas corretas</p>
        </div>

        <Card className="mb-8 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Registros Sem Empresa Associada
            </CardTitle>
            <CardDescription>
              Total de registros que precisam ser migrados: <strong className="text-lg text-blue-600">{totalItems}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalItems > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(stats).map(([entityName, count]) => (
                  count > 0 && (
                    <div key={entityName} className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-sm text-slate-600">{entityName}</p>
                      <p className="text-lg font-bold text-blue-600">{count}</p>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-green-600 font-semibold">Todos os dados já estão associados a empresas!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {totalItems > 0 && !isDone && (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Executar Migração</CardTitle>
              <CardDescription>
                Selecione a empresa que deve receber todos os dados existentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Empresa de Destino *</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {progress && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-blue-700">{progress}</span>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleMigration} 
                  disabled={!selectedCompany || isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Migrando...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Executar Migração Completa
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isDone && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-800 mb-2">Migração Concluída!</h3>
                <p className="text-green-700">
                  Todos os dados foram associados à empresa selecionada. 
                  Agora cada usuário verá apenas os dados de sua própria empresa.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}