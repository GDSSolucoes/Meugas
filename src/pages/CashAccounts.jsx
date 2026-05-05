import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Plus, Wallet, Edit, Trash2 } from "lucide-react";
import { CashAccount } from "@/entities/CashAccount";
import { User } from "@/entities/User";
import { format } from "date-fns";

export default function CashAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalAccountBeforeEdit, setOriginalAccountBeforeEdit] = useState(null);
  
  const initialAccountState = {
    name: '',
    type: 'caixa_fisico', // Added type with a default value
    balance: 0,
    initialBalance: 0,
    initialBalanceDate: format(new Date(), 'yyyy-MM-dd'),
    active: true,
    createdByName: ''
  };
  
  const [currentAccount, setCurrentAccount] = useState(initialAccountState);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const user = await User.me();
      const data = await CashAccount.filter({ companyId: user.companyId }, {sort: '-createdDate'});
      setAccounts(data);
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
      setAccounts([]);
    }
  };

  const handleEdit = (account) => {
    setIsEditing(true);
    setCurrentAccount({
        ...account,
        type: account.type || 'caixaFisico' // Ensures 'type' has a value, defaulting for old entries
    });
    setOriginalAccountBeforeEdit(account); // Store the original account for comparison
    setShowForm(true);
  };

  const handleDelete = async (accountId) => {
    if (window.confirm("Tem certeza que deseja deletar esta conta?")) {
      try {
        await CashAccount.delete(accountId);
        loadAccounts();
      } catch (error) {
        console.error("Erro ao deletar conta:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await User.me();
      
      if (isEditing) {
        const { id } = currentAccount;

        // Calculate difference in initial balance
        const oldInitialBalance = originalAccountBeforeEdit?.initialBalance || 0;
        const newInitialBalance = Number(currentAccount.initialBalance) || 0;
        const initialBalanceDifference = newInitialBalance - oldInitialBalance;

        // Adjust the current balance based on the initial balance change
        const newCurrentBalance = (originalAccountBeforeEdit?.balance || 0) + initialBalanceDifference;

        const accountPayload = {
          name: currentAccount.name,
          type: currentAccount.type,
          active: currentAccount.active,
          initialBalance: newInitialBalance,
          initialBalanceDate: currentAccount.initialBalanceDate,
          balance: newCurrentBalance,
        };
        
        await CashAccount.update(id, accountPayload);
      } else {
        // Creation of a new account
        const initialBalance = Number(currentAccount.initialBalance) || 0;
        
        const accountPayload = {
          name: currentAccount.name,
          type: currentAccount.type,
          balance: initialBalance, // O saldo atual é igual ao saldo inicial
          initialBalance: initialBalance,
          initialBalanceDate: currentAccount.initialBalanceDate,
          active: currentAccount.active,
          createdByName: user.fullName,
          companyId: user.companyId,
          companyName: user.companyName,
        };
        
        await CashAccount.create(accountPayload);
        
        // NÃO criar movimento automático - o saldo inicial já está definido na conta
        // Se necessário, movimentos podem ser criados manualmente depois
      }
      setShowForm(false);
      resetForm();
      loadAccounts();
    } catch (error) {
      console.error("Erro ao salvar conta:", error);
    }
  };

  const resetForm = () => {
    setCurrentAccount(initialAccountState);
    setIsEditing(false);
    setOriginalAccountBeforeEdit(null); // Clear original account state
  };
  
  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom right, #f2f1ed, #95b4df)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Contas e Caixas</h1>
            <p className="text-slate-600">Gerencie suas contas, caixas e carteiras</p>
          </div>
          <Button 
            onClick={() => { setShowForm(true); setIsEditing(false); resetForm(); }}
            className="shadow-lg text-white"
            style={{ backgroundColor: '#e78b3a' }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Conta
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                {isEditing ? 'Editar Conta' : 'Cadastrar Nova Conta'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Removed md:col-span-2 from here */}
                  <div> 
                    <Label>Nome da Conta *</Label>
                    <Input
                      value={currentAccount.name}
                      onChange={(e) => setCurrentAccount(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                      required
                      className="bg-white/80"
                      placeholder="Ex: Caixa Principal, Banco Bradesco..."
                    />
                  </div>
                  {/* New field for Type */}
                  <div>
                    <Label>Tipo de Conta *</Label>
                    <Select
                      value={currentAccount.type}
                      onValueChange={(value) => setCurrentAccount(prev => ({ ...prev, type: value }))}
                      required
                    >
                      <SelectTrigger className="bg-white/80"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="caixa_fisico">Caixa Físico</SelectItem>
                        <SelectItem value="conta_bancaria">Conta Bancária</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Saldo Inicial (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentAccount.initialBalance}
                      onChange={(e) => setCurrentAccount(prev => ({ ...prev, initialBalance: e.target.value }))}
                      className="bg-white/80"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label>Data do Saldo Inicial</Label>
                    <Input
                      type="date"
                      value={currentAccount.initialBalanceDate}
                      onChange={(e) => setCurrentAccount(prev => ({ ...prev, initialBalanceDate: e.target.value }))}
                      className="bg-white/80"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-6 md:col-span-2">
                    <Switch
                      checked={currentAccount.active}
                      onCheckedChange={(checked) => setCurrentAccount(prev => ({ ...prev, active: checked }))}
                    />
                    <Label>Conta Ativa</Label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="text-white hover:opacity-90" style={{ backgroundColor: '#223f61' }}>
                    {isEditing ? 'Salvar Alterações' : 'Salvar Conta'}
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
            <CardTitle>Lista de Contas e Caixas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Saldo Atual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lançado por</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map(account => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(account.balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={account.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {account.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{account.createdByName}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(account)} className="mr-2 hover:bg-blue-100">
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)} className="hover:bg-red-100">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {accounts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        Nenhuma conta cadastrada ainda
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