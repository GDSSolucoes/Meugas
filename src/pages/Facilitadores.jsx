import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import * as entities from "@/entities";
import { useToast } from "@/components/ui/use-toast";

export default function Facilitadores() {
  const { toast } = useToast();
  const [facilitadores, setFacilitadores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const initialFacilitadorState = {
    nome: '',
    modeloFiscal: '55',
    tipoOperacao: 'venda',
    cfop: '5102',
    regimeTributario: 'simplesNacional',
    icmsSituacaoTributaria: '102',
    pisSituacaoTributaria: '07',
    cofinsSituacaoTributaria: '07',
    ipiSituacaoTributaria: '',
    observacoes: '',
    ativo: true
  };

  const [currentFacilitador, setCurrentFacilitador] = useState(initialFacilitadorState);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await entities.User.me();
      setCurrentUser(user);

      const data = await entities.Facilitador.filter(
        { companyId: user.companyId },
        '-createdDate'
      );
      setFacilitadores(data);
    } catch (error) {
      console.error("Erro ao carregar facilitadores:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os facilitadores.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (facilitador) => {
    setIsEditing(true);
    setCurrentFacilitador(facilitador);
    setShowForm(true);
  };

  const handleDelete = async (facilitadorId) => {
    if (window.confirm("Tem certeza que deseja excluir este facilitador?")) {
      try {
        await entities.Facilitador.delete(facilitadorId);
        loadData();
        toast({
          title: "Sucesso",
          description: "Facilitador excluído com sucesso."
        });
      } catch (error) {
        console.error("Erro ao excluir facilitador:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o facilitador.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const facilitadorData = {
        ...currentFacilitador,
        companyId: currentUser.companyId,
        companyName: currentUser.companyName,
        createdByName: currentUser.fullName
      };

      if (isEditing) {
        const { id, ...dataToUpdate } = facilitadorData;
        await entities.Facilitador.update(id, dataToUpdate);
        toast({
          title: "Sucesso",
          description: "Facilitador atualizado com sucesso."
        });
      } else {
        await entities.Facilitador.create(facilitadorData);
        toast({
          title: "Sucesso",
          description: "Facilitador cadastrado com sucesso."
        });
      }

      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Erro ao salvar facilitador:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o facilitador.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentFacilitador(initialFacilitadorState);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const getModeloBadge = (modelo) => {
    return modelo === '55' 
      ? <Badge className="bg-blue-100 text-blue-800">NF-e (55)</Badge>
      : <Badge className="bg-purple-100 text-purple-800">NFC-e (65)</Badge>;
  };

  const getStatusBadge = (ativo) => {
    return ativo
      ? <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1 inline" />Ativo</Badge>
      : <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1 inline" />Inativo</Badge>;
  };

  if (isLoading && !showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <p className="text-lg text-slate-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(to bottom right, #f2f1ed, #95b4df)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Facilitadores Fiscais</h1>
            <p className="text-slate-600">Configure as operações fiscais para emissão de notas</p>
          </div>
          <Button
            onClick={() => { setShowForm(true); setIsEditing(false); resetForm(); }}
            className="text-white"
            style={{ backgroundColor: '#e78b3a' }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Facilitador
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {isEditing ? 'Editar Facilitador' : 'Cadastrar Facilitador'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Nome da Operação / Natureza *</Label>
                    <Input
                      value={currentFacilitador.nome}
                      onChange={(e) => setCurrentFacilitador(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))}
                      placeholder="Ex: VENDA DE MERCADORIAS"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Este nome aparecerá como "Natureza da Operação" na nota fiscal
                    </p>
                  </div>

                  <div>
                    <Label>Modelo Fiscal *</Label>
                    <Select
                      value={currentFacilitador.modeloFiscal}
                      onValueChange={(value) => setCurrentFacilitador(prev => ({ ...prev, modeloFiscal: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="55">NF-e (Modelo 55)</SelectItem>
                        <SelectItem value="65">NFC-e (Modelo 65)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tipo de Operação *</Label>
                    <Select
                      value={currentFacilitador.tipoOperacao}
                      onValueChange={(value) => setCurrentFacilitador(prev => ({ ...prev, tipoOperacao: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venda">Venda</SelectItem>
                        <SelectItem value="compra">Compra</SelectItem>
                        <SelectItem value="remessa">Remessa</SelectItem>
                        <SelectItem value="retorno">Retorno</SelectItem>
                        <SelectItem value="devolucao">Devolução</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="outras">Outras</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>CFOP *</Label>
                    <Input
                      value={currentFacilitador.cfop}
                      onChange={(e) => setCurrentFacilitador(prev => ({ ...prev, cfop: e.target.value }))}
                      placeholder="5102"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Ex: 5102 (Venda de mercadoria dentro do estado)
                    </p>
                  </div>

                  <div>
                    <Label>Regime Tributário *</Label>
                    <Select
                      value={currentFacilitador.regimeTributario}
                      onValueChange={(value) => setCurrentFacilitador(prev => ({ ...prev, regimeTributario: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simplesNacional">Simples Nacional</SelectItem>
                        <SelectItem value="lucroPresumido">Lucro Presumido</SelectItem>
                        <SelectItem value="lucroReal">Lucro Real</SelectItem>
                        <SelectItem value="mei">MEI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>CST ICMS *</Label>
                    <Input
                      value={currentFacilitador.icmsSituacaoTributaria}
                      onChange={(e) => setCurrentFacilitador(prev => ({ ...prev, icmsSituacaoTributaria: e.target.value }))}
                      placeholder="102"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Ex: 102 (Simples Nacional sem permissão de crédito)
                    </p>
                  </div>

                  <div>
                    <Label>CST PIS *</Label>
                    <Input
                      value={currentFacilitador.pisSituacaoTributaria}
                      onChange={(e) => setCurrentFacilitador(prev => ({ ...prev, pisSituacaoTributaria: e.target.value }))}
                      placeholder="07"
                      required
                    />
                  </div>

                  <div>
                    <Label>CST COFINS *</Label>
                    <Input
                      value={currentFacilitador.cofinsSituacaoTributaria}
                      onChange={(e) => setCurrentFacilitador(prev => ({ ...prev, cofinsSituacaoTributaria: e.target.value }))}
                      placeholder="07"
                      required
                    />
                  </div>

                  <div>
                    <Label>CST IPI (Opcional)</Label>
                    <Input
                      value={currentFacilitador.ipiSituacaoTributaria}
                      onChange={(e) => setCurrentFacilitador(prev => ({ ...prev, ipiSituacaoTributaria: e.target.value }))}
                      placeholder="53"
                    />
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select
                      value={currentFacilitador.ativo ? 'true' : 'false'}
                      onValueChange={(value) => setCurrentFacilitador(prev => ({ ...prev, ativo: value === 'true' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={currentFacilitador.observacoes}
                      onChange={(e) => setCurrentFacilitador(prev => ({ ...prev, observacoes: e.target.value }))}
                      rows={3}
                      placeholder="Informações adicionais sobre este facilitador..."
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Cadastrar')}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle>Facilitadores Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Operação</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>CFOP</TableHead>
                    <TableHead>Regime</TableHead>
                    <TableHead>CST ICMS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facilitadores.map(facilitador => (
                    <TableRow key={facilitador.id}>
                      <TableCell className="font-medium">{facilitador.nome}</TableCell>
                      <TableCell>{getModeloBadge(facilitador.modeloFiscal)}</TableCell>
                      <TableCell>{facilitador.cfop}</TableCell>
                      <TableCell className="text-xs">{facilitador.regimeTributario}</TableCell>
                      <TableCell>{facilitador.icmsSituacaoTributaria}</TableCell>
                      <TableCell>{getStatusBadge(facilitador.ativo)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(facilitador)}
                          className="mr-2 hover:bg-blue-100"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(facilitador.id)}
                          className="hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {facilitadores.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Nenhum facilitador cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Dica sobre Facilitadores</h3>
            <p className="text-sm text-blue-800">
              Os facilitadores são configurações pré-definidas para emissão de notas fiscais. 
              Crie um facilitador para cada tipo de operação fiscal que sua empresa realiza.
              Por exemplo: "VENDA DE GÁS" com CFOP 5102, ou "VENDA PARA CONSUMIDOR FINAL" para NFC-e.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}