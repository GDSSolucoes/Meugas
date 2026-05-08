import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/entities/Order";
import { Product } from "@/entities/Product";
import { Employee } from "@/entities/Employee";
import { PaymentType } from "@/entities/PaymentType";
import { User } from "@/entities/User";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Truck,
  CheckCircle,
  Package,
  Clock,
  Send,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
  XCircle,
} from "lucide-react"; // Added XCircle
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

const FilterSection = ({ employees, filters, onFilterChange }) => (
  <Card className="mb-8 bg-white/80 backdrop-blur-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-xl">
        <Filter className="w-5 h-5" />
        Filtros
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label>Data Inicial</Label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange("startDate", e.target.value)}
            className="bg-white"
          />
        </div>
        <div>
          <Label>Data Final</Label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange("endDate", e.target.value)}
            className="bg-white"
          />
        </div>
        <div>
          <Label>Entregador</Label>
          <Select
            value={filters.employeeId}
            onValueChange={(value) => onFilterChange("employeeId", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Entregadores</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFilterChange("status", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function OrderTrackingPage() {
  const { toast } = useToast();
  const [allOrders, setAllOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    employeeId: "all",
    status: "all",
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const [ordersData, allEmployees, allPaymentTypes] = await Promise.all([
        Order.filter({ companyId: user.companyId }, { sort: "-createdAt" }),
        Employee.filter(
          { companyId: user.companyId, position: "entregador", active: true },
          { sort: "name" },
        ),
        PaymentType.filter({ companyId: user.companyId, active: true }),
      ]);

      // Sort orders by created date (newest first)
      const sortedOrders = ordersData.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      setAllOrders(sortedOrders);
      setEmployees(allEmployees);
      setPaymentTypes(allPaymentTypes);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar os dados. Tente novamente.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtro simplificado que está funcionando
  const filteredOrders = useMemo(() => {
    if (isLoading || allOrders.length === 0) return [];

    let filtered = allOrders;

    // Aplicar filtro de funcionário
    if (filters.employeeId !== "all") {
      filtered = filtered.filter(
        (order) => order.employeeId === filters.employeeId,
      );
    }

    // Aplicar filtro de status
    if (filters.status !== "all") {
      filtered = filtered.filter((order) => order.status === filters.status);
    }

    // Aplicar filtro de data (simplificado)
    if (filters.startDate && filters.endDate) {
      const filterStartDate = filters.startDate;
      const filterEndDate = filters.endDate;

      filtered = filtered.filter((order) => {
        const orderDateString = order.createdAt.split("T")[0];
        return (
          orderDateString >= filterStartDate && orderDateString <= filterEndDate
        );
      });
    }

    return filtered;
  }, [allOrders, filters, isLoading]);

  const pendingOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === "pendente"),
    [filteredOrders],
  );

  const inProgressOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === "em_atendimento"),
    [filteredOrders],
  );
  // Atualizado: Finalizados agora inclui os Cancelados
  const completedOrders = useMemo(
    () =>
      filteredOrders.filter(
        (o) => o.status === "finalizado" || o.status === "cancelado",
      ),
    [filteredOrders],
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleAssignEmployee = async (orderId, employeeId) => {
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) {
      toast({
        title: "Erro",
        description: "Entregador não encontrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      await Order.update(orderId, {
        employeeId: employee.id,
        employeeName: employee.name,
      });
      setAllOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? { ...order, employeeId: employee.id, employeeName: employee.name }
            : order,
        ),
      );
      toast({
        title: "Sucesso",
        description: `Entregador ${employee.name} atribuído ao pedido.`,
      });
    } catch (error) {
      console.error("Erro ao atribuir entregador:", error);
      toast({
        title: "Erro",
        description: "Falha ao atribuir entregador. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleAssignPaymentType = async (orderId, paymentTypeId) => {
    const paymentType = paymentTypes.find((p) => p.id === paymentTypeId);
    if (!paymentType) {
      toast({
        title: "Erro",
        description: "Forma de pagamento não encontrada.",
        variant: "destructive",
      });
      return;
    }

    try {
      await Order.update(orderId, {
        paymentTypeId: paymentType.id,
        paymentTypeName: paymentType.name,
      });
      setAllOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                paymentTypeId: paymentType.id,
                paymentTypeName: paymentType.name,
              }
            : order,
        ),
      );
      toast({
        title: "Sucesso",
        description: `Forma de pagamento ${paymentType.name} atribuída ao pedido.`,
      });
    } catch (error) {
      console.error("Erro ao atribuir forma de pagamento:", error);
      toast({
        title: "Erro",
        description: "Falha ao atribuir forma de pagamento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (order, newStatus) => {
    if (newStatus === "em_atendimento" && !order.employeeId) {
      toast({
        title: "Atenção",
        description: "Selecione um entregador antes de enviar para entrega.",
        variant: "destructive",
      });
      return;
    }
    if (newStatus === "em_atendimento" && !order.paymentTypeId) {
      toast({
        title: "Atenção",
        description:
          "Selecione uma forma de pagamento antes de enviar para entrega.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        status: newStatus,
        attendedAt: new Date(),
      };
      const updatedOrder = await Order.update(order.id, updateData);
      setAllOrders((prev) =>
        prev.map((o) => (o.id === order.id ? updatedOrder : o)),
      );
      toast({
        title: "Sucesso",
        description: `Status do pedido ${order.orderNumber} atualizado para '${newStatus}'.`,
      });
    } catch (error) {
      console.error(`Erro ao atualizar status para ${newStatus}:`, error);
      toast({
        title: "Erro",
        description: `Falha ao atualizar o status para '${newStatus}'. Tente novamente.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeOrder = async (order) => {
    setIsLoading(true);
    try {
      const updateData = {
        status: "finalizado",
        finalizedAt: new Date(),
      };
      const updatedOrder = await Order.update(order.id, updateData);
      setAllOrders((prev) =>
        prev.map((o) => (o.id === order.id ? updatedOrder : o)),
      );

      const allProducts = await Product.filter({
        companyId: currentUser.companyId,
      });
      for (const item of order.items) {
        try {
          const product = allProducts.find((p) => p.id === item.productId);
          if (product) {
            const newStock =
              (product.stockQuantity || 0) - (item.quantity || 0);
            await Product.update(product.id, {
              stockQuantity: Math.max(0, newStock),
            });
          }
        } catch (productError) {
          console.error(
            `Erro ao atualizar estoque para o produto ID ${item.productId}:`,
            productError,
          );
          toast({
            title: "Atenção",
            description: `Falha ao atualizar estoque para o produto ${item.productName}.`,
            variant: "warning",
          });
        }
      }
      toast({
        title: "Sucesso",
        description: `Pedido ${order.orderNumber} finalizado com sucesso!`,
      });
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      toast({
        title: "Erro",
        description: "Falha ao finalizar o pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (order) => {
    setIsLoading(true);
    try {
      const updateData = {
        status: "cancelado",
        canceledAt: new Date(),
      };
      const updatedOrder = await Order.update(order.id, updateData);
      setAllOrders((prev) =>
        prev.map((o) => (o.id === order.id ? updatedOrder : o)),
      );
      toast({
        title: "Sucesso",
        description: `Pedido ${order.orderNumber} cancelado com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
      toast({
        title: "Erro",
        description: "Falha ao cancelar o pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const OrderCard = ({
    order,
    onStart,
    onFinalize,
    onCancel,
    onAssign,
    onAssignPayment,
    employeeList,
    paymentTypeList,
    isLoading,
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getBadge = (status) => {
      switch (status) {
        case "pendente":
          return (
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              Pendente
            </Badge>
          );
        case "em_atendimento":
          return (
            <Badge className="bg-blue-100 text-blue-800 text-xs">
              Em Atendimento
            </Badge>
          );
        case "finalizado":
          return (
            <Badge className="bg-green-100 text-green-800 text-xs">
              Finalizado
            </Badge>
          );
        case "cancelado":
          return (
            <Badge className="bg-red-100 text-red-800 text-xs">Cancelado</Badge>
          );
        default:
          return <Badge className="text-xs">{status}</Badge>;
      }
    };

    // Define personAddress directly from the order object.
    const personAddress = order.personAddress || {};

    const isOrderActionable =
      order.status === "pendente" || order.status === "em_atendimento";

    const cardClassName =
      order.status === "cancelado"
        ? "bg-red-50 border-red-200 shadow-md hover:shadow-lg transition-shadow"
        : "bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-md hover:shadow-lg transition-shadow";

    return (
      <Card className={cardClassName}>
        <CardHeader className="pb-2 flex justify-between items-start">
          <div className="flex-1 pr-2">
            <CardTitle className="text-sm font-bold text-slate-800 flex justify-between items-center mb-1">
              <span>{order.personName}</span>
              {getBadge(order.status)}
            </CardTitle>

            {/* Mostrar número do pedido apenas quando expandido */}
            {isExpanded && (
              <p className="text-xs text-slate-600 mb-1">
                Pedido: {order.orderNumber}
              </p>
            )}

            {/* Informações sempre visíveis quando não expandido */}
            {!isExpanded && (
              <div className="text-xs text-slate-500 space-y-1">
                <p className="truncate">
                  <span className="font-medium">Entregador:</span>{" "}
                  {order.employeeName || "Não atribuído"}
                </p>
              </div>
            )}

            {/* Mostrar valor total apenas quando expandido */}
            {isExpanded && (
              <p className="text-sm font-bold text-slate-800 mt-1">
                R$ {order.totalAmount?.toFixed(2)}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 h-6 w-6"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-600" />
            )}
          </Button>
        </CardHeader>

        {isExpanded && (
          <>
            <CardContent className="pt-0 border-t border-slate-200/30">
              <div className="space-y-1 mt-2">
                <p className="text-xs text-slate-500 pt-1">
                  Data:{" "}
                  {format(order.createdAt, "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}{" "}
                  por {order.createdByName || "Sistema"}
                </p>
                {order.attendedAt && (
                  <p className="text-xs text-slate-500 pt-1 flex items-center gap-1.5">
                    <Send className="w-3 h-3 text-blue-500" />
                    Em Atendimento:{" "}
                    {format(order.attendedAt, "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                )}
                {order.finalizedAt && (
                  <p className="text-xs text-slate-500 pt-1 flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Finalizado:{" "}
                    {format(order.finalizedAt, "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                )}
                {order.canceledAt /* Display canceledAt */ && (
                  <p className="text-xs text-red-500 pt-1 flex items-center gap-1.5">
                    <XCircle className="w-3 h-3 text-red-500" />
                    Cancelado:{" "}
                    {format(order.canceledAt, "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                )}
                {order.cancellationReason && (
                  <p className="text-xs text-red-600 pt-1 bg-red-50 p-2 rounded border-l-2 border-red-300">
                    <span className="font-medium">Motivo:</span>{" "}
                    {order.cancellationReason}
                  </p>
                )}
              </div>

              <div className="my-3 border-t pt-2 space-y-1">
                <p className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Endereço de Entrega
                </p>
                <p className="text-xs text-slate-600 pl-5">
                  {personAddress.street || "Rua não informada"},{" "}
                  {personAddress.number || "S/N"}
                </p>
                <p className="text-xs text-slate-600 pl-5">
                  {personAddress.neighborhood || "Bairro não informado"} -{" "}
                  {personAddress.city || "Cidade não informada"}
                </p>
                {personAddress.referencePoint && (
                  <p className="text-xs text-slate-500 pl-5">
                    Ref: {personAddress.referencePoint}
                  </p>
                )}
              </div>

              <div className="space-y-2 mt-3 border-t pt-2">
                {isOrderActionable ? (
                  <div>
                    <Label className="text-xs font-medium text-slate-700">
                      {order.status === "pendente"
                        ? "Atribuir Entregador *"
                        : "Alterar Entregador"}
                    </Label>
                    <Select
                      onValueChange={(employeeId) =>
                        onAssign(order.id, employeeId)
                      }
                      value={order.employeeId || ""}
                      disabled={!isOrderActionable}
                    >
                      <SelectTrigger className="w-full mt-1 bg-white text-xs h-8">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeList.map((emp) => (
                          <SelectItem
                            key={emp.id}
                            value={emp.id}
                            className="text-xs"
                          >
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Entregador: {order.employeeName || "Não definido"}
                  </p>
                )}

                {isOrderActionable ? (
                  <div>
                    <Label className="text-xs font-medium text-slate-700">
                      {order.status === "pendente"
                        ? "Forma de Pagamento *"
                        : "Alterar Forma de Pagamento"}
                    </Label>
                    <Select
                      onValueChange={(paymentTypeId) =>
                        onAssignPayment(order.id, paymentTypeId)
                      }
                      value={order.paymentTypeId || ""}
                      disabled={!isOrderActionable}
                    >
                      <SelectTrigger className="w-full mt-1 bg-white text-xs h-8">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTypeList.map((pt) => (
                          <SelectItem
                            key={pt.id}
                            value={pt.id}
                            className="text-xs"
                          >
                            {pt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Pagamento: {order.paymentTypeName || "Não definido"}
                  </p>
                )}
              </div>

              <div className="space-y-1 my-3 border-t pt-2">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-xs"
                  >
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-700">{item.productName}</span>
                    </div>
                    <span className="text-slate-500">Qtd: {item.quantity}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-slate-600">Total:</span>
                <span className="text-sm font-bold text-slate-800">
                  R$ {order.totalAmount?.toFixed(2)}
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2">
              {/* Botão de Cancelar - para pedidos pendentes e em atendimento */}
              {(order.status === "pendente" ||
                order.status === "em_atendimento") && (
                <Button
                  onClick={() => onCancel(order)}
                  disabled={isLoading}
                  variant="outline"
                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 text-xs h-8 px-3"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Cancelar
                </Button>
              )}

              {order.status === "pendente" && (
                <Button
                  onClick={() => onStart(order, "em_atendimento")}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-xs h-8 px-3"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Enviar para Entrega
                </Button>
              )}
              {order.status === "em_atendimento" && (
                <Button
                  onClick={() => onFinalize(order)}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-xs h-8 px-3"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Finalizar Pedido
                </Button>
              )}
            </CardFooter>
          </>
        )}
      </Card>
    );
  };

  const OrderColumn = ({
    title,
    icon: Icon,
    color,
    orders,
    onStart,
    onFinalize,
    onCancel,
    onAssign,
    onAssignPayment,
    employeeList,
    paymentTypeList,
    isLoading,
  }) => (
    <div>
      <div
        className={`flex items-center gap-3 mb-4 border-b-2 pb-2 border-${color}-500`}
      >
        <Icon className={`w-6 h-6 text-${color}-600`} />
        <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
        <Badge variant="secondary" className="text-base">
          {orders.length}
        </Badge>
      </div>
      <div className="space-y-2 h-[60vh] overflow-y-auto p-2 rounded-lg bg-slate-100/50">
        {isLoading && <p>Carregando...</p>}
        {!isLoading && orders.length > 0
          ? orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStart={onStart}
                onFinalize={onFinalize}
                onCancel={onCancel}
                onAssign={onAssign}
                onAssignPayment={onAssignPayment}
                employeeList={employeeList}
                paymentTypeList={paymentTypes}
                isLoading={isLoading}
              />
            ))
          : !isLoading && (
              <p className="text-slate-500 text-center pt-10">
                Nenhum pedido nesta etapa.
              </p>
            )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Acompanhamento de Pedidos
              </h1>
              <p className="text-slate-600">
                Visualize e gerencie o andamento das entregas em tempo real.
              </p>
            </div>
            <button
              onClick={() => loadData()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Atualizar
            </button>
          </div>
        </div>

        <FilterSection
          employees={employees}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <OrderColumn
            title="Pendentes"
            icon={Clock}
            color="yellow"
            orders={pendingOrders}
            onStart={handleUpdateStatus}
            onFinalize={handleFinalizeOrder}
            onCancel={handleCancelOrder}
            onAssign={handleAssignEmployee}
            onAssignPayment={handleAssignPaymentType}
            employeeList={employees}
            paymentTypeList={paymentTypes}
            isLoading={isLoading}
          />
          <OrderColumn
            title="Em Atendimento"
            icon={Truck}
            color="blue"
            orders={inProgressOrders}
            onStart={handleUpdateStatus}
            onFinalize={handleFinalizeOrder}
            onCancel={handleCancelOrder}
            onAssign={handleAssignEmployee}
            onAssignPayment={handleAssignPaymentType}
            employeeList={employees}
            paymentTypeList={paymentTypes}
            isLoading={isLoading}
          />
          <OrderColumn
            title="Finalizados"
            icon={CheckCircle}
            color="green"
            orders={completedOrders}
            onStart={handleUpdateStatus}
            onFinalize={handleFinalizeOrder}
            onCancel={handleCancelOrder}
            onAssign={handleAssignEmployee}
            onAssignPayment={handleAssignPaymentType}
            employeeList={employees}
            paymentTypeList={paymentTypes}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
