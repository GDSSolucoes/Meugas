import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Edit,
  Search,
  LogOut,
  Printer,
  FileText,
  BarChart3,
  Coins,
  Wallet,
  ArrowLeftRight,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl, formatDateOnly } from "@/utils";
import SalesPage from "./Sales";
import CashMovementsPage from "./CashMovements";
import PaymentModal from "@/components/acerto/PaymentModal";
import * as entities from "@/entities";
import AccountsReceivablePage from "./AccountsReceivable";

export default function AcertoSetoresPage() {
  const { toast } = useToast();
  const [setores, setSetores] = useState([]);
  const [showSetorModal, setShowSetorModal] = useState(false);
  const [setorSearchTerm, setSetorSearchTerm] = useState("");
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [showAccountsReceivableModal, setShowAccountsReceivableModal] =
    useState(false);
  const [showCashMovementsModal, setShowCashMovementsModal] = useState(false);
  const [showNoResultsModal, setShowNoResultsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Carregar filtros salvos do localStorage
  const getStoredFilters = () => {
    try {
      const stored = localStorage.getItem("acertoSetoresFilters");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Erro ao carregar filtros:", e);
    }
    return null;
  };

  const storedFilters = getStoredFilters();

  const [lancamento, setLancamento] = useState(
    storedFilters?.lancamento || formatDateOnly(new Date(), "yyyy-MM-dd"),
  );
  const [setorSelecionado, setSetorSelecionado] = useState(null);
  const [mostrarEntregues, setMostrarEntregues] = useState(
    storedFilters?.mostrarEntregues ?? true,
  );
  const [mostrarNaoEntregues, setMostrarNaoEntregues] = useState(
    storedFilters?.mostrarNaoEntregues ?? true,
  );
  const [dataInicial, setDataInicial] = useState(
    storedFilters?.dataInicial || formatDateOnly(new Date(), "yyyy-MM-dd"),
  );
  const [horaInicial, setHoraInicial] = useState(
    storedFilters?.horaInicial || "00:00",
  );
  const [dataFinal, setDataFinal] = useState(
    storedFilters?.dataFinal || formatDateOnly(new Date(), "yyyy-MM-dd"),
  );
  const [horaFinal, setHoraFinal] = useState(
    storedFilters?.horaFinal || "23:59",
  );
  const [mostrarLancados, setMostrarLancados] = useState(
    storedFilters?.mostrarLancados || false,
  );
  const [convenio, setConvenio] = useState("nao");
  const [selectedTab, setSelectedTab] = useState("venda");

  const [pedidos, setPedidos] = useState([]);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [itensPedido, setItensPedido] = useState([]);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [isLoadingPedidos, setIsLoadingPedidos] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const pageSize = 50;

  // Valores do painel de resumo
  const [resumo, setResumo] = useState({
    naoLancados: { qtd: 0, valor: 0 },
    vendasVista: { qtd: 0, valor: 0 },
    entradas: { qtd: 0, valor: 0 },
    vendasPrazo: { qtd: 0, valor: 0 },
    total: { qtd: 0, valor: 0 },
    cartoes: { qtd: 0, valor: 0 },
  });

  // Salvar filtros no localStorage sempre que mudarem
  useEffect(() => {
    const filters = {
      lancamento,
      mostrarEntregues,
      mostrarNaoEntregues,
      dataInicial,
      horaInicial,
      dataFinal,
      horaFinal,
      mostrarLancados,
    };
    localStorage.setItem("acertoSetoresFilters", JSON.stringify(filters));
  }, [
    lancamento,
    mostrarEntregues,
    mostrarNaoEntregues,
    dataInicial,
    horaInicial,
    dataFinal,
    horaFinal,
    mostrarLancados,
  ]);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await entities.User.me();

      const setoresData = await entities.Sector.filter({
        companyId: user.companyId,
        active: true,
      });

      setSetores(setoresData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados iniciais.",
        variant: "destructive",
      });
    }
  };

  const handleSelectSetor = (setor) => {
    setSetorSelecionado(setor);
    setShowSetorModal(false);
  };

  const handleOpenSetorModal = () => {
    setSetorSearchTerm("");
    setShowSetorModal(true);
  };

  const filteredSetores = setores.filter((setor) =>
    setor.name.toLowerCase().includes(setorSearchTerm.toLowerCase()),
  );

  const loadOrders = async (requestedPage = 1) => {
    const dataHoraInicio = new Date(`${dataInicial}T${horaInicial}:00`);
    const dataHoraFim = new Date(`${dataFinal}T${horaFinal}:59`);
    if (
      Number.isNaN(dataHoraInicio.getTime()) ||
      Number.isNaN(dataHoraFim.getTime()) ||
      dataHoraInicio > dataHoraFim
    ) {
      toast({
        title: "Período inválido",
        description: "Informe um período válido para pesquisar os pedidos.",
        variant: "destructive",
      });
      return;
    }

    setSearchExecuted(true);
    setIsLoadingPedidos(true);

    if (!mostrarEntregues && !mostrarNaoEntregues) {
      setPedidos([]);
      setPage(1);
      setTotalPages(1);
      setTotalPedidos(0);
      calcularResumo({ total: 0, totalAmount: 0 });
      setSelectedPedido(null);
      setItensPedido([]);
      setIsLoadingPedidos(false);
      setShowNoResultsModal(true);
      return;
    }

    try {
      const user = await entities.User.me();
      const filters = {
        companyId: user.companyId,
        effectiveDeliveryDate_gte: dataInicial,
        effectiveDeliveryDate_lte: dataFinal,
        effectiveCreatedAt_gte: dataHoraInicio.toISOString(),
        effectiveCreatedAt_lte: dataHoraFim.toISOString(),
        ...(!mostrarNaoEntregues ? { status: "finalizado" } : {}),
        ...(!mostrarEntregues ? { status_ne: "finalizado" } : {}),
      };
      const result = await entities.Order.filterPaginated(filters, {
        page: requestedPage,
        limit: pageSize,
        sort: "-createdAt",
      });

      setPedidos(result.data);
      setPage(result.page);
      setTotalPages(Math.max(result.totalPages, 1));
      setTotalPedidos(result.total);
      calcularResumo(result);
      setSelectedPedido(null);
      setItensPedido([]);

      if (result.total === 0) {
        setShowNoResultsModal(true);
      }
    } catch (error) {
      console.error("Erro ao pesquisar pedidos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível pesquisar os pedidos.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPedidos(false);
    }
  };

  const applyFilters = () => {
    setPage(1);
    loadOrders(1);
  };

  const calcularResumo = (resultado) => {
    const resumoCalculado = {
      naoLancados: { qtd: 0, valor: 0 },
      vendasVista: { qtd: 0, valor: 0 },
      entradas: { qtd: 0, valor: 0 },
      vendasPrazo: { qtd: 0, valor: 0 },
      total: { qtd: resultado.total, valor: resultado.totalAmount },
      cartoes: { qtd: 0, valor: 0 },
    };
    setResumo(resumoCalculado);
  };

  const handleTransformToSale = () => {
    if (!selectedPedido) {
      toast({
        title: "Atenção",
        description: "Selecione um pedido para transformar em venda.",
        variant: "destructive",
      });
      return;
    }
    if (!setorSelecionado) {
      toast({
        title: "Atenção",
        description:
          "Selecione o setor de estoque antes de converter o pedido.",
        variant: "destructive",
      });
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (paymentData) => {
    try {
      const { pedido, payments, parcelas, totalAReceber } = paymentData;
      await entities.Sale.createFromOrder({
        orderId: pedido.id,
        sectorId: setorSelecionado.id,
        totalAmount: totalAReceber,
        paymentMethods: payments.map((payment) => ({
          paymentTypeId: payment.tipo,
          amount: payment.valor,
          cashAccountId: payment.caixaId || undefined,
          installmentsDetails: parcelas
            .filter((installment) => installment.paymentId === payment.id)
            .map((installment) => ({
              number: installment.numero,
              dueDate: installment.vencimento,
              amount: installment.valor,
            })),
        })),
      });

      toast({
        title: "Sucesso",
        description: "Venda realizada com sucesso!",
      });

      setShowPaymentModal(false);
      setSelectedPedido(null);
      setItensPedido([]);
      await loadData();
      await loadOrders(1);
    } catch (error) {
      console.error("Erro ao processar venda:", error);
      toast({
        title: "Erro",
        description:
          error?.response?.data?.message ||
          "Não foi possível processar a venda.",
        variant: "destructive",
      });
    }
  };

  const handleSelectPedido = (pedido) => {
    setSelectedPedido(pedido);
    setItensPedido(pedido.items || []);
  };

  const formatMoney = (value) => {
    return value.toFixed(4).replace(".", ",");
  };

  return (
    <div className="min-h-screen" style={{ background: "#F3F4F6" }}>
      <div className="max-w-[1400px] mx-auto p-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">
          Acerto de Setores
        </h1>

        {/* Layout Principal - Grid de 2 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* COLUNA ESQUERDA (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* QUADRANTE SUPERIOR ESQUERDO - Controles de Filtro */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="w-40">
                    <Label className="text-sm font-medium mb-1 block">
                      Lançamento
                    </Label>
                    <Input
                      type="date"
                      value={lancamento}
                      onChange={(e) => setLancamento(e.target.value)}
                    />
                  </div>

                  <div className="w-full">
                    <Label className="text-sm font-medium mb-1 block">
                      Setor de estoque
                    </Label>
                    <div
                      className="border rounded px-3 py-2 bg-white cursor-pointer hover:border-gray-400 transition-colors"
                      onClick={handleOpenSetorModal}
                    >
                      <span className="text-red-600 font-medium">
                        {setorSelecionado ? setorSelecionado.name : "Todos"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QUADRANTE CENTRAL ESQUERDO - Tabela de Pedidos */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Pedidos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto" style={{ height: "300px" }}>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-center w-20">
                          Código
                        </TableHead>
                        <TableHead className="w-52">
                          Cliente/Pto. venda
                        </TableHead>
                        <TableHead className="text-center w-24">Data</TableHead>
                        <TableHead className="text-center w-20">
                          Setor
                        </TableHead>
                        <TableHead className="text-center w-20">
                          Baixa
                        </TableHead>
                        <TableHead className="text-right w-24">
                          Total F
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!searchExecuted ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-gray-400 py-8"
                          >
                            Clique no botão de pesquisa para visualizar pedidos
                          </TableCell>
                        </TableRow>
                      ) : isLoadingPedidos ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-gray-400 py-8"
                          >
                            Carregando pedidos...
                          </TableCell>
                        </TableRow>
                      ) : pedidos.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-gray-400 py-8"
                          >
                            Nenhum pedido encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        pedidos.map((pedido) => (
                          <TableRow
                            key={pedido.id}
                            className={`cursor-pointer hover:bg-blue-50 ${selectedPedido?.id === pedido.id ? "bg-blue-100" : ""}`}
                            onClick={() => handleSelectPedido(pedido)}
                            onDoubleClick={() => {
                              handleSelectPedido(pedido);
                              if (!setorSelecionado) {
                                toast({
                                  title: "Atenção",
                                  description:
                                    "Selecione o setor de estoque antes de converter o pedido.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setShowPaymentModal(true);
                            }}
                          >
                            <TableCell className="text-center">
                              {pedido.orderNumber}
                            </TableCell>
                            <TableCell>{pedido.personName}</TableCell>
                            <TableCell className="text-center">
                              {pedido.deliveryDate || pedido.createdAt
                                ? format(
                                    pedido.deliveryDate || pedido.createdAt,
                                    "dd/MM/yyyy",
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center">-</TableCell>
                            <TableCell className="text-center">
                              {pedido.status === "finalizado" ? "✓" : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {pedido.totalAmount?.toFixed(2) || "0,00"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between gap-2 p-2 border-t">
                  <span className="text-xs text-gray-500">
                    {totalPedidos} pedido(s) · Página {page} de {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => loadOrders(page - 1)}
                      disabled={
                        !searchExecuted || page <= 1 || isLoadingPedidos
                      }
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => loadOrders(page + 1)}
                      disabled={
                        !searchExecuted ||
                        page >= totalPages ||
                        isLoadingPedidos
                      }
                      aria-label="Próxima página"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QUADRANTE INFERIOR ESQUERDO - Detalhes do Pedido */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Itens</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto" style={{ height: "200px" }}>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-64">Produto</TableHead>
                        <TableHead className="text-center w-20">
                          Qtde.
                        </TableHead>
                        <TableHead className="text-right w-24">Preço</TableHead>
                        <TableHead className="text-right w-24">
                          Desconto
                        </TableHead>
                        <TableHead className="text-center w-20">Vas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itensPedido.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-gray-400 py-8"
                          >
                            Selecione um pedido para ver os itens
                          </TableCell>
                        </TableRow>
                      ) : (
                        itensPedido.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-center">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {item.unitPrice?.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {item.discount?.toFixed(2) || "0,00"}
                            </TableCell>
                            <TableCell className="text-center">-</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="p-4 border-t space-y-4">
                  <div className="flex justify-end items-center gap-3">
                    <Label className="text-sm">Total Pedido........:</Label>
                    <Input
                      type="text"
                      readOnly
                      className="w-40 text-right"
                      value={
                        selectedPedido
                          ? `R$ ${selectedPedido.totalAmount?.toFixed(2)}`
                          : "0,00"
                      }
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Observação do Pedido
                    </Label>
                    <Textarea
                      rows={3}
                      className="resize-none"
                      value={selectedPedido?.notes || ""}
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COLUNA DIREITA (1/3) */}
          <div className="space-y-6">
            {/* QUADRANTE SUPERIOR DIREITO - Controles de Pedidos e Período */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4 space-y-6">
                {/* Seção Pedidos */}
                <div className="border rounded-lg p-3">
                  <Label className="text-sm font-bold mb-3 block">
                    Pedidos
                  </Label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="entregues"
                        checked={mostrarEntregues}
                        onCheckedChange={setMostrarEntregues}
                      />
                      <Label
                        htmlFor="entregues"
                        className="text-sm cursor-pointer"
                      >
                        Entregues
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="naoEntregues"
                        checked={mostrarNaoEntregues}
                        onCheckedChange={setMostrarNaoEntregues}
                      />
                      <Label
                        htmlFor="naoEntregues"
                        className="text-sm cursor-pointer"
                      >
                        Não Entregues
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Seção Período */}
                <div className="border rounded-lg p-3">
                  <Label className="text-sm font-bold mb-3 block">
                    Período
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="date"
                      value={dataInicial}
                      onChange={(e) => setDataInicial(e.target.value)}
                      className="w-40"
                    />
                    <Input
                      type="time"
                      value={horaInicial}
                      onChange={(e) => setHoraInicial(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm">a</span>
                    <Input
                      type="date"
                      value={dataFinal}
                      onChange={(e) => setDataFinal(e.target.value)}
                      className="w-40"
                    />
                    <Input
                      type="time"
                      value={horaFinal}
                      onChange={(e) => setHoraFinal(e.target.value)}
                      className="w-24"
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 text-white"
                      style={{ backgroundColor: "#e78b3a" }}
                      onClick={applyFilters}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QUADRANTE CENTRAL DIREITO - Painel de Resumo */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="mostrar-lancados"
                    checked={mostrarLancados}
                    onCheckedChange={setMostrarLancados}
                  />
                  <Label
                    htmlFor="mostrar-lancados"
                    className="text-sm cursor-pointer"
                  >
                    Mostrar ped. lançados
                  </Label>
                </div>

                <div className="space-y-4">
                  {/* Não lançados */}
                  <div>
                    <Label className="text-sm block mb-1">Não lançados</Label>
                    <div className="flex justify-between items-center">
                      <span className="text-base">
                        {resumo.naoLancados.qtd}
                      </span>
                      <span className="text-base font-bold text-red-600">
                        {formatMoney(resumo.naoLancados.valor)}
                      </span>
                    </div>
                  </div>

                  {/* Vendas Vista */}
                  <div>
                    <Label className="text-sm block mb-1">Vendas Vista</Label>
                    <div className="flex justify-between items-center">
                      <span className="text-base">
                        {resumo.vendasVista.qtd}
                      </span>
                      <span className="text-base font-bold text-red-600">
                        {formatMoney(resumo.vendasVista.valor)}
                      </span>
                    </div>
                  </div>

                  {/* Entradas */}
                  <div>
                    <Label className="text-sm block mb-1">Entradas</Label>
                    <div className="flex justify-between items-center">
                      <span className="text-base">{resumo.entradas.qtd}</span>
                      <span className="text-base font-bold text-red-600">
                        {formatMoney(resumo.entradas.valor)}
                      </span>
                    </div>
                  </div>

                  {/* Vendas Prazo/A Rec. */}
                  <div>
                    <Label className="text-sm block mb-1">
                      Vendas Prazo/A Rec.
                    </Label>
                    <div className="flex justify-between items-center">
                      <span className="text-base">
                        {resumo.vendasPrazo.qtd}
                      </span>
                      <span className="text-base font-bold text-red-600">
                        {formatMoney(resumo.vendasPrazo.valor)}
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div>
                    <Label className="text-sm block mb-1">Total</Label>
                    <div className="flex justify-between items-center">
                      <span className="text-base">{resumo.total.qtd}</span>
                      <span className="text-base font-bold text-red-600">
                        {formatMoney(resumo.total.valor)}
                      </span>
                    </div>
                  </div>

                  {/* Cartões */}
                  <div>
                    <Label className="text-sm block mb-1">Cartões</Label>
                    <div className="flex justify-between items-center">
                      <span className="text-base">{resumo.cartoes.qtd}</span>
                      <span className="text-base font-bold text-red-600">
                        {formatMoney(resumo.cartoes.valor)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QUADRANTE INFERIOR DIREITO - Abas */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="venda">Venda</TabsTrigger>
                    <TabsTrigger value="bxCartao">Bx. Cartão</TabsTrigger>
                    <TabsTrigger value="cancelamento">Cancelamento</TabsTrigger>
                  </TabsList>

                  <TabsContent value="venda" className="space-y-4 mt-4">
                    {/* Nota Fiscal */}
                    <div>
                      <Label className="text-sm font-bold block mb-2">
                        Nota Fiscal
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs block mb-1">Nº:</Label>
                          <Input type="text" className="w-full" />
                        </div>
                        <div className="w-20">
                          <Label className="text-xs block mb-1">S.:</Label>
                          <Input type="text" className="w-full" />
                        </div>
                      </div>
                    </div>

                    {/* Documento */}
                    <div>
                      <Label className="text-sm font-bold block mb-2">
                        Documento
                      </Label>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label className="text-xs block mb-1">Nº:</Label>
                          <Input type="text" className="w-full" />
                        </div>
                        <Button
                          size="icon"
                          className="text-white"
                          style={{ backgroundColor: "#e78b3a" }}
                          onClick={handleTransformToSale}
                          disabled={!selectedPedido}
                        >
                          <Check className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Convênio */}
                    <div>
                      <Label className="text-sm font-bold block mb-2">
                        Convênio
                      </Label>
                      <RadioGroup
                        value={convenio}
                        onValueChange={setConvenio}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sim" id="convenio-sim" />
                          <Label
                            htmlFor="convenio-sim"
                            className="text-sm cursor-pointer"
                          >
                            Sim
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nao" id="convenio-nao" />
                          <Label
                            htmlFor="convenio-nao"
                            className="text-sm cursor-pointer"
                          >
                            Não
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </TabsContent>

                  <TabsContent value="bxCartao" className="mt-4">
                    <p className="text-sm text-gray-500">
                      Informações de baixa de cartão
                    </p>
                  </TabsContent>

                  <TabsContent value="cancelamento" className="mt-4">
                    <p className="text-sm text-gray-500">
                      Dados de cancelamento
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BARRA DE AÇÕES (RODAPÉ) */}
        <div className="bg-gray-100 rounded-lg p-4 shadow-lg">
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 px-4 bg-white"
            >
              <Edit className="w-6 h-6 text-gray-700" />
              <span className="text-xs text-gray-700">Alterar</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 px-4 bg-white"
              onClick={() =>
                (window.location.href = createPageUrl("Dashboard"))
              }
            >
              <LogOut className="w-6 h-6 text-gray-700" />
              <span className="text-xs text-gray-700">Sair</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 px-4 bg-white"
            >
              <Printer className="w-6 h-6 text-gray-700" />
              <span className="text-xs text-gray-700">Imprimir</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 px-4 bg-white"
            >
              <FileText className="w-6 h-6 text-gray-700" />
              <span className="text-xs text-gray-700">Rel. Venda</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 px-4 bg-white"
            >
              <FileText className="w-6 h-6 text-gray-700" />
              <span className="text-xs text-gray-700">Rel. Ped</span>
            </Button>

            <div className="w-px bg-gray-400 h-16 mx-2"></div>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 px-4 bg-white"
              onClick={() => setShowSalesModal(true)}
            >
              <BarChart3 className="w-6 h-6 text-gray-700" />
              <span className="text-xs text-gray-700">Vendas</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 px-4 bg-white"
              onClick={() => setShowAccountsReceivableModal(true)}
            >
              <Coins className="w-6 h-6 text-gray-700" />
              <span className="text-xs text-gray-700">Ctas Rec</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 px-4 bg-white"
              onClick={() => setShowCashMovementsModal(true)}
            >
              <Wallet className="w-6 h-6 text-gray-700" />
              <span className="text-xs text-gray-700">Caixa</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-1 h-auto py-3 px-4 bg-white"
            >
              <ArrowLeftRight className="w-6 h-6 text-gray-700" />
              <span className="text-xs text-gray-700">Transferências</span>
            </Button>
          </div>
        </div>

        {/* Modal de Seleção de Setor */}
        <Dialog open={showSetorModal} onOpenChange={setShowSetorModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Selecionar Setor</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar setor..."
                  value={setorSearchTerm}
                  onChange={(e) => setSetorSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                <div
                  className="p-3 border rounded cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => handleSelectSetor(null)}
                >
                  <span className="font-medium text-red-600">Todos</span>
                </div>
                {filteredSetores.map((setor) => (
                  <div
                    key={setor.id}
                    className={`p-3 border rounded cursor-pointer hover:bg-blue-50 transition-colors ${
                      setorSelecionado?.id === setor.id
                        ? "bg-blue-100 border-blue-500"
                        : ""
                    }`}
                    onClick={() => handleSelectSetor(setor)}
                  >
                    <span className="font-medium">{setor.name}</span>
                  </div>
                ))}
                {filteredSetores.length === 0 && (
                  <div className="p-3 text-center text-gray-400">
                    Nenhum setor encontrado
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Vendas */}
        <Dialog open={showSalesModal} onOpenChange={setShowSalesModal}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto p-0">
            <SalesPage
              onSaleComplete={() => {
                setShowSalesModal(false);
                loadData();
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Modal de Contas a Receber */}
        <Dialog
          open={showAccountsReceivableModal}
          onOpenChange={setShowAccountsReceivableModal}
        >
          <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto p-0">
            <AccountsReceivablePage
              onComplete={() => {
                setShowAccountsReceivableModal(false);
                loadData();
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Modal de Lançamentos Financeiros */}
        <Dialog
          open={showCashMovementsModal}
          onOpenChange={setShowCashMovementsModal}
        >
          <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto p-0">
            <CashMovementsPage
              onComplete={() => {
                setShowCashMovementsModal(false);
                loadData();
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Modal de Nenhum Resultado */}
        <Dialog open={showNoResultsModal} onOpenChange={setShowNoResultsModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Aviso</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center text-gray-600">
                Nenhum registro de pedido encontrado
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => setShowNoResultsModal(false)}
                className="text-white"
                style={{ backgroundColor: "#e78b3a" }}
              >
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Pagamento */}
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          pedido={selectedPedido}
          onConfirm={handlePaymentConfirm}
        />
      </div>
    </div>
  );
}
