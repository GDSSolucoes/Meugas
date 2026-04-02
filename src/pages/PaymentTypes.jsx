import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, CreditCard, Edit, Trash2 } from "lucide-react";
import { PaymentType } from "@/entities/PaymentType";
import  User  from "@/api/providers/user";

export default function PaymentTypes() {
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const initialPaymentTypeState = {
    name: '',
    type: 'aVista',
    maxInstallments: 1,
    daysInterval: 0,
    active: true,
    createdByName: '',
    companyId: '',
    companyName: ''
  };
  
  const [currentPaymentType, setCurrentPaymentType] = useState(initialPaymentTypeState);

  useEffect(() => {
    loadPaymentTypes();
  }, []);

  const loadPaymentTypes = async () => {
    try {
      const user = await User.me();
      const data = await PaymentType.filter({ companyId: user.companyId }, '-createdDate');
      setPaymentTypes(data);
    } catch (error) {
      console.error("Erro ao carregar tipos de pagamento:", error);
      setPaymentTypes([]);
    }
  };

  const handleEdit = (paymentType) => {
    setIsEditing(true);
    setCurrentPaymentType({
      ...paymentType,
      daysInterval: paymentType.daysInterval || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (paymentTypeId) => {
    if (window.confirm("Tem certeza que deseja deletar este tipo de pagamento?")) {
      try {
        await PaymentType.delete(paymentTypeId);
        loadPaymentTypes();
      } catch (error) {
        console.error("Erro ao deletar tipo de pagamento:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await User.me();
      const payload = {
        ...currentPaymentType,
        maxInstallments: Number(currentPaymentType.maxInstallments) || 1,
        daysInterval: Number(currentPaymentType.daysInterval) || 0,
        companyId: user.companyId,
        companyName: user.companyName
      };

      if (isEditing) {
        const { id, ...data } = payload;
        await PaymentType.update(id, data);
      } else {
        await PaymentType.create({ ...payload, createdByName: user.fullName });
      }
      setShowForm(false);
      resetForm();
      loadPaymentTypes();
    } catch (error) {
      console.error("Erro ao salvar tipo de pagamento:", error);
    }
  };

  const resetForm = () => {
    setCurrentPaymentType(initialPaymentTypeState);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const getTypeBadge = (type) => {
    const info = {
      aVista: { label: "À Vista", color: "bg-green-100 text-green-800" },
      aPrazo: { label: "À Prazo", color: "bg-blue-100 text-blue-800" },
      cartao: { label: "Cartão", color: "bg-purple-100 text-purple-800" }
    };
    return <Badge className={info[type]?.color || info.aVista.color}>{info[type]?.label || type}</Badge>;
  };

  const isAPrazo = (type) => type === 'aPrazo';
  const isCartao = (type) => type === 'cartao';

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom right, #f2f1ed, #95b4df)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Tipos de Pagamento</h1>
            <p className="text-slate-600">Gerencie as formas de pagamento aceitas</p>
          </div>
          <Button 
            onClick={() => { setShowForm(true); setIsEditing(false); resetForm(); }}
            className="shadow-lg text-white"
            style={{ backgroundColor: '#e78b3a' }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Tipo
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {isEditing ? 'Editar Tipo de Pagamento' : 'Cadastrar Novo Tipo de Pagamento'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome *</Label>
                    <Input
                      value={currentPaymentType.name}
                      onChange={(e) => setCurrentPaymentType(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                      required
                      className="bg-white/80"
                      placeholder="Ex: Cartão Visa, Dinheiro, Pix da Casa..."
                    />
                  </div>
                  <div>
                    <Label>Tipo *</Label>
                    <Select
                      value={currentPaymentType.type}
                      onValueChange={(value) => setCurrentPaymentType(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="bg-white/80">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aVista">À Vista</SelectItem>
                        <SelectItem value="aPrazo">À Prazo</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Máx. de Parcelas</Label>
                    <Input
                      type="number"
                      min="1"
                      value={currentPaymentType.maxInstallments}
                      onChange={(e) => setCurrentPaymentType(prev => ({ ...prev, maxInstallments: e.target.value }))}
                      className="bg-white/80"
                      placeholder="1"
                    />
                     <p className="text-xs text-slate-500 mt-1">
                        Use 1 para pagamentos à vista.
                     </p>
                  </div>
                  {(isAPrazo(currentPaymentType.type) || isCartao(currentPaymentType.type)) && (
                     <div>
                       <Label>Intervalo de Dias para 1º Venc.</Label>
                       <Input
                         type="number"
                         min="0"
                         value={currentPaymentType.daysInterval}
                         onChange={(e) => setCurrentPaymentType(prev => ({ ...prev, daysInterval: e.target.value }))}
                         className="bg-white/80"
                         placeholder="Ex: 30"
                       />
                       <p className="text-xs text-slate-500 mt-1">
                          Dias a somar na data da venda/compra para o 1º vencimento.
                       </p>
                     </div>
                  )}
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="active-switch"
                      checked={currentPaymentType.active}
                      onCheckedChange={(checked) => setCurrentPaymentType(prev => ({ ...prev, active: checked }))}
                    />
                    <Label htmlFor="active-switch">Ativo</Label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="text-white hover:opacity-90" style={{ backgroundColor: '#223f61' }}>
                    {isEditing ? 'Salvar Alterações' : 'Salvar'}
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
            <CardTitle>Lista de Tipos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Condição</TableHead>
                    <TableHead>Intervalo Dias</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lançado por</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentTypes.map(pt => (
                    <TableRow key={pt.id}>
                      <TableCell className="font-medium">{pt.name}</TableCell>
                      <TableCell>{getTypeBadge(pt.type)}</TableCell>
                      <TableCell>
                        {pt.maxInstallments > 1 
                          ? <Badge variant="outline">A Prazo ({pt.maxInstallments}x)</Badge>
                          : <Badge variant="outline">À Vista</Badge>
                        }
                      </TableCell>
                      <TableCell>{(isAPrazo(pt.type) || isCartao(pt.type)) ? `${pt.daysInterval || 0} dias` : '-'}</TableCell>
                      <TableCell>
                        <Badge className={pt.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {pt.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{pt.createdByName}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(pt)} className="mr-2 hover:bg-blue-100">
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(pt.id)} className="hover:bg-red-100">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paymentTypes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Nenhum tipo de pagamento cadastrado ainda
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