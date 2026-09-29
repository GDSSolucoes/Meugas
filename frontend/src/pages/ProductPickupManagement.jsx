import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  X,
  LogOut,
  Printer,
  ArrowDown,
  Trash2,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as entities from "@/entities";
import { useToast } from "@/components/ui/use-toast";
import { format, startOfDay, endOfDay } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl, formatDateOnly } from "@/utils";
import PersonSelector from "@/components/people/PersonSelector";

export default function ProductPickupManagementPage() {
  const { toast } = useToast();

  // Data states
  const [pickups, setPickups] = useState([]);
  const [displayedPickups, setDisplayedPickups] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [people, setPeople] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);

  // Filtros
  const [filtrarCliente, setFiltrarCliente] = useState(true);
  const [filtrarPontoVenda, setFiltrarPontoVenda] = useState(false);
  const [clienteInput, setClienteInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  const [produtoInput, setProdutoInput] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [periodoTipo, setPeriodoTipo] = useState("aRetirar"); // 'aRetirar', 'retiradosEntre'
  const [dataInicial, setDataInicial] = useState(
    formatDateOnly(new Date(), "yyyy-MM-dd"),
  );
  const [dataFinal, setDataFinal] = useState(
    formatDateOnly(new Date(), "yyyy-MM-dd"),
  );

  const [codigoVendaInput, setCodigoVendaInput] = useState("");
  const [codigoVendaSearch, setCodigoVendaSearch] = useState("");
  const [codigoVendaLabel, setCodigoVendaLabel] = useState("TODAS");

  // Modais
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [lastBaixaData, setLastBaixaData] = useState(null);
  const [showClienteSearch, setShowClienteSearch] = useState(false);
  const [showProdutoSearch, setShowProdutoSearch] = useState(false);
  const [showVendaSearch, setShowVendaSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [qtdeBaixar, setQtdeBaixar] = useState("");
  const [sectorBaixa, setSectorBaixa] = useState("");
  const [dataBaixa, setDataBaixa] = useState(
    formatDateOnly(new Date(), "yyyy-MM-dd"),
  );
  const [notaFiscal, setNotaFiscal] = useState("");
  const [pedido, setPedido] = useState("");
  const [activeCaixa, setActiveCaixa] = useState(null); // 'cliente', 'produto', 'venda'

  // Totais
  const [totalARetirar, setTotalARetirar] = useState(0);
  const [totalRetirados, setTotalRetirados] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await entities.User.me();
      setCurrentUser(user);

      const [pickupsData, peopleData, productsData, salesData, sectorsData] =
        await Promise.all([
          entities.ProductPickup.filter(
            { companyId: user.companyId },
            { sort: "-saleDate" },
          ),
          entities.Person.filter({ companyId: user.companyId }),
          entities.Product.filter({ companyId: user.companyId, active: true }),
          entities.Sale.filter({ companyId: user.companyId }),
          entities.Sector.filter({ companyId: user.companyId, active: true }),
        ]);

      setPickups(pickupsData);
      setPeople(peopleData);
      setProducts(productsData);
      setSales(salesData);
      setSectors(sectorsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyFiltersAndShow = () => {
    let filtered = [...pickups];

    // Filtro por cliente específico ou por tipo
    if (clienteInput) {
      filtered = filtered.filter((p) => p.personId === clienteInput);
    } else {
      // Filtrar por tipo se não há cliente específico
      filtered = filtered.filter((p) => {
        const person = people.find((per) => per.id === p.personId);
        if (!person) return false;

        const isCliente = person.type === "cliente";
        const isPontoVenda = person.type === "pontoVenda";

        if (filtrarCliente && filtrarPontoVenda)
          return isCliente || isPontoVenda;
        if (filtrarCliente) return isCliente;
        if (filtrarPontoVenda) return isPontoVenda;

        return false;
      });
    }

    // Filtro por produto
    if (produtoInput) {
      filtered = filtered.filter((p) => p.productId === produtoInput);
    }

    // Filtro por status do produto
    if (periodoTipo === "aRetirar") {
      filtered = filtered.filter(
        (p) =>
          p.status === "pendente" ||
          (p.status === "retirado_parcial" &&
            (p.pickupQuantity || 0) > (p.collectedQuantity || 0)),
      );
    } else {
      // Retirados entre datas - considera TODAS as retiradas (parciais e totais) com data
      filtered = filtered.filter((p) => {
        if (!p.collectedDate) return false;
        if ((p.collectedQuantity || 0) === 0) return false;

        const collectedDate = p.collectedDate;
        const start = startOfDay(dataInicial);
        const end = endOfDay(dataFinal);

        return collectedDate >= start && collectedDate <= end;
      });
    }

    // Filtro por código da venda
    if (codigoVendaInput) {
      filtered = filtered.filter((p) => p.saleId === codigoVendaInput);
    }

    // Calcular totais
    const aRetirar = filtered
      .filter((p) => p.status !== "retirado_total")
      .reduce(
        (sum, p) =>
          sum + ((p.pickupQuantity || 0) - (p.collectedQuantity || 0)),
        0,
      );

    const retirados = filtered
      .filter((p) => p.status === "retirado_total")
      .reduce((sum, p) => sum + (p.collectedQuantity || 0), 0);

    setTotalARetirar(aRetirar);
    setTotalRetirados(retirados);

    setDisplayedPickups(filtered);
    setShowResults(true);
  };

  const handlePesquisar = () => {
    if (!activeCaixa) {
      toast({
        title: "Atenção",
        description: "Clique em uma das caixas de filtro primeiro.",
        variant: "default",
      });
      return;
    }

    if (activeCaixa === "cliente") {
      setShowClienteSearch(true);
    } else if (activeCaixa === "produto") {
      setShowProdutoSearch(true);
    } else if (activeCaixa === "venda") {
      setShowVendaSearch(true);
    }
  };

  const handleCancelar = () => {
    setFiltrarCliente(true);
    setFiltrarPontoVenda(false);
    setClienteInput("");
    setSelectedCustomer(null);
    setClientSearchTerm("");
    setProdutoInput("");
    setPeriodoTipo("aRetirar");
    setDataInicial(formatDateOnly(new Date(), "yyyy-MM-dd"));
    setDataFinal(formatDateOnly(new Date(), "yyyy-MM-dd"));
    setCodigoVendaInput("");
    setDisplayedPickups([]);
    setShowResults(false);
    setSelectedPickup(null);
    setTotalARetirar(0);
    setTotalRetirados(0);
  };

  const handleBaixar = (pickup = null) => {
    const pickupToUse = pickup || selectedPickup;

    if (!pickupToUse) {
      toast({
        title: "Atenção",
        description: "Selecione um registro para dar baixa.",
        variant: "destructive",
      });
      return;
    }
    if (pickupToUse.status === "retirado_total") {
      toast({
        title: "Atenção",
        description: "Este produto já foi totalmente retirado.",
        variant: "destructive",
      });
      return;
    }

    if (pickup) {
      setSelectedPickup(pickup);
    }

    // Pré-preencher campos
    const pendente =
      (pickupToUse.pickupQuantity || 0) - (pickupToUse.collectedQuantity || 0);
    setQtdeBaixar(pendente.toString());
    setDataBaixa(formatDateOnly(new Date(), "yyyy-MM-dd"));
    setSectorBaixa(sectors.length > 0 ? sectors[0].id : "");
    setNotaFiscal("");
    setPedido("");
    setShowBaixaModal(true);
  };

  const handleConfirmarBaixa = async () => {
    if (!selectedPickup) return;

    const qtde = parseInt(qtdeBaixar) || 0;
    const pendente =
      (selectedPickup.pickupQuantity || 0) -
      (selectedPickup.collectedQuantity || 0);

    if (qtde <= 0) {
      toast({
        title: "Erro",
        description: "Informe uma quantidade válida.",
        variant: "destructive",
      });
      return;
    }

    if (qtde > pendente) {
      toast({
        title: "Erro",
        description: `Quantidade inválida. Máximo permitido: ${pendente}`,
        variant: "destructive",
      });
      return;
    }

    if (!sectorBaixa) {
      toast({
        title: "Erro",
        description: "Selecione o setor para baixa.",
        variant: "destructive",
      });
      return;
    }

    if (!dataBaixa) {
      toast({
        title: "Erro",
        description: "Informe a data de retirada.",
        variant: "destructive",
      });
      return;
    }

    try {
      const sector = sectors.find((s) => s.id === sectorBaixa);

      await entities.ProductPickup.darBaixa(selectedPickup.id, {
        quantityToCollect: qtde,
        sectorId: sectorBaixa,
        sectorName: sector?.name || "",
        collectedDate: dataBaixa,
        notaFiscal: notaFiscal,
        pedido: pedido,
      });

      // Salvar dados para impressão
      const person = people.find((p) => p.id === selectedPickup.personId);
      setLastBaixaData({
        cliente: selectedPickup.personName,
        clienteDoc: person?.document || "",
        produto: selectedPickup.productName,
        quantidade: qtde,
        data: dataBaixa,
        setor: sector?.name || "",
        notaFiscal: notaFiscal,
        pedido: pedido,
      });

      toast({
        title: "Sucesso",
        description: `Baixa de ${qtde} produto(s) realizada com sucesso.`,
      });
      setShowBaixaModal(false);
      setShowPrintConfirm(true);

      await loadData();
      if (showResults) {
        setTimeout(() => applyFiltersAndShow(), 100);
      }
    } catch (error) {
      console.error("Erro ao dar baixa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a baixa.",
        variant: "destructive",
      });
    }
  };

  const handleExcluir = async () => {
    if (!selectedPickup) {
      toast({
        title: "Atenção",
        description: "Selecione um registro para excluir.",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm("Tem certeza que deseja excluir este registro?")) {
      return;
    }

    try {
      await entities.ProductPickup.delete(selectedPickup.id);
      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso.",
      });
      setSelectedPickup(null);
      await loadData();
      if (showResults) {
        setTimeout(() => applyFiltersAndShow(), 100);
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro.",
        variant: "destructive",
      });
    }
  };

  const handleImprimirComprovante = () => {
    if (!lastBaixaData) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante de Retirada</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 20px; margin-bottom: 5px; }
          .header p { font-size: 11px; color: #666; }
          .section { margin: 20px 0; }
          .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .field { margin: 8px 0; }
          .field label { font-weight: bold; display: inline-block; width: 150px; }
          .field span { color: #555; }
          .signature { margin-top: 80px; }
          .signature-line { border-top: 1px solid #333; width: 400px; margin: 0 auto; padding-top: 5px; text-align: center; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; }
          @media print { body { padding: 20px; } button { display: none; } }
          .btn-print { display: block; margin: 30px auto; padding: 10px 30px; font-size: 14px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${currentUser?.companyName || "EMPRESA"}</h1>
          <p>Comprovante de Retirada de Produto</p>
          <p>Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
        </div>

        <div class="section">
          <div class="section-title">Dados do Cliente</div>
          <div class="field">
            <label>Cliente:</label>
            <span>${lastBaixaData.cliente}</span>
          </div>
          ${
            lastBaixaData.clienteDoc
              ? `
          <div class="field">
            <label>CPF/CNPJ:</label>
            <span>${lastBaixaData.clienteDoc}</span>
          </div>
          `
              : ""
          }
        </div>

        <div class="section">
          <div class="section-title">Dados da Retirada</div>
          <div class="field">
            <label>Produto:</label>
            <span>${lastBaixaData.produto}</span>
          </div>
          <div class="field">
            <label>Quantidade:</label>
            <span>${lastBaixaData.quantidade}</span>
          </div>
          <div class="field">
            <label>Data da Retirada:</label>
            <span>${format(lastBaixaData.data, "dd/MM/yyyy")}</span>
          </div>
          <div class="field">
            <label>Setor:</label>
            <span>${lastBaixaData.setor}</span>
          </div>
          ${
            lastBaixaData.notaFiscal
              ? `
          <div class="field">
            <label>Nota Fiscal:</label>
            <span>${lastBaixaData.notaFiscal}</span>
          </div>
          `
              : ""
          }
          ${
            lastBaixaData.pedido
              ? `
          <div class="field">
            <label>Pedido:</label>
            <span>${lastBaixaData.pedido}</span>
          </div>
          `
              : ""
          }
        </div>

        <div class="signature">
          <div class="signature-line">
            Assinatura do Responsável pela Retirada
          </div>
        </div>

        <div class="footer">
          <p>Este documento comprova a retirada do(s) produto(s) descrito(s) acima.</p>
        </div>

        <button class="btn-print" onclick="window.print()">Imprimir Comprovante</button>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();

    setShowPrintConfirm(false);
    setLastBaixaData(null);
    setSelectedPickup(null);
  };

  const handleImprimir = () => {
    const dataToPrint = showResults ? displayedPickups : [];

    if (dataToPrint.length === 0) {
      toast({
        title: "Atenção",
        description: "Nenhum dado para imprimir. Execute a pesquisa primeiro.",
        variant: "destructive",
      });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Produtos Vendidos a Retirar</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
          h1 { text-align: center; margin-bottom: 5px; font-size: 16px; }
          .subtitle { text-align: center; margin-bottom: 15px; color: #666; font-size: 10px; }
          .filters { margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
          th { background-color: #e0e0e0; font-weight: bold; font-size: 10px; }
          td { font-size: 10px; }
          .text-center { text-align: center; }
          .footer { margin-top: 15px; text-align: center; font-size: 9px; color: #666; }
          @media print { body { padding: 10px; } button { display: none; } }
          .btn-print { display: block; margin: 15px auto; padding: 8px 25px; font-size: 12px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Produtos Vendidos a Retirar</h1>
        <p class="subtitle">Emitido em: ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        
        <div class="filters">
          <strong>Filtros:</strong> 
          Cliente: ${filtrarCliente ? "Sim" : "Não"} | 
          Pto. Venda: ${filtrarPontoVenda ? "Sim" : "Não"} |
          Status: ${periodoTipo === "aRetirar" ? "A Retirar" : `Retirados de ${format(dataInicial, "dd/MM/yyyy")} a ${format(dataFinal, "dd/MM/yyyy")}`}
        </div>

        <table>
          <thead>
            <tr>
              <th>Dt Venda</th>
              <th>Venda</th>
              <th>Cliente / Pto. Venda</th>
              <th>Produto</th>
              <th>Vend.</th>
              <th>A Ret.</th>
            </tr>
          </thead>
          <tbody>
            ${dataToPrint
              .map(
                (pickup) => `
              <tr>
                <td>${pickup.saleDate ? format(pickup.saleDate, "dd/MM/yyyy") : "-"}</td>
                <td>${pickup.saleId?.slice(-6) || "-"}</td>
                <td>${pickup.personName || "-"}</td>
                <td>${pickup.productName || "-"}</td>
                <td>${pickup.pickupQuantity || 0}</td>
                <td>${(pickup.pickupQuantity || 0) - (pickup.collectedQuantity || 0)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <p class="footer">Total a Retirar: ${totalARetirar} | Total Retirados: ${totalRetirados} | Total de registros: ${dataToPrint.length}</p>
        
        <button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const filteredPeople = people.filter((p) => {
    const isCliente = p.type === "cliente";
    const isPontoVenda = p.type === "pontoVenda";

    if (filtrarCliente && filtrarPontoVenda) return isCliente || isPontoVenda;
    if (filtrarCliente) return isCliente;
    if (filtrarPontoVenda) return isPontoVenda;

    return false;
  });

  const handleSelectCustomer = (person) => {
    setSelectedCustomer(person);
    setClienteInput(person.id);
    setClientSearchTerm(person.name);
    setShowClienteSearch(false);
    setSearchTerm("");
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setClienteInput("");
    setClientSearchTerm("");
    setSearchTerm("");
  };

  const clearProduct = () => {
    setSelectedProduct(null);
    setProdutoInput("");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-[1400px] mx-auto p-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">
          Produtos vendidos a retirar
        </h1>

        <Card className="mb-4 bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  Filtrar por:
                </Label>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Checkbox
                      id="filtroCliente"
                      checked={filtrarCliente}
                      onCheckedChange={setFiltrarCliente}
                    />
                    <Label htmlFor="filtroCliente" className="text-xs">
                      Cliente
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Checkbox
                      id="filtroPdv"
                      checked={filtrarPontoVenda}
                      onCheckedChange={setFiltrarPontoVenda}
                    />
                    <Label htmlFor="filtroPdv" className="text-xs">
                      Pto. Venda
                    </Label>
                  </div>
                </div>
                <div className="mt-2">
                  <PersonSelector
                    options={people}
                    selectedPerson={selectedCustomer}
                    value={clientSearchTerm}
                    title={
                      filtrarCliente && filtrarPontoVenda
                        ? "Selecionar Cliente/PDV"
                        : filtrarCliente
                          ? "Selecionar Cliente"
                          : "Selecionar Ponto de Venda"
                    }
                    inputPlaceholder="Buscar cliente..."
                    searchPlaceholder="Digite o nome..."
                    showType
                    onOpenChange={(open) => {
                      setShowClienteSearch(open);
                      if (open) setSearchTerm(clientSearchTerm);
                    }}
                    onValueChange={(value) => {
                      setClientSearchTerm(value);
                      setSearchTerm(value);
                    }}
                    onSelect={handleSelectCustomer}
                    onClear={clearCustomer}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700">
                  Produto:
                </Label>
                <div className="flex items-center mt-1">
                  {!selectedProduct ? (
                    <div className="flex items-center gap-2 w-full">
                      <Input
                        className="h-8 text-xs w-full"
                        value={produtoInput}
                        onChange={(e) => setProdutoInput(e.target.value)}
                        placeholder="Buscar produto..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => {
                          setSearchTerm(produtoInput);
                          setShowProdutoSearch(true);
                        }}
                        title="Pesquisar produto"
                        aria-label="Pesquisar produto"
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-between p-3 rounded-lg w-full"
                      style={{
                        background: "#F0FDF4",
                        border: "1px solid #BBF7D0",
                      }}
                    >
                      <div>
                        <p className="font-semibold text-sm text-green-700">
                          {selectedProduct.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearProduct}
                        className="text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  Código da Venda
                </Label>
                <div className="flex items-center mt-1">
                  <Input
                    value={
                      codigoVendaInput
                        ? sales.find((s) => s.id === codigoVendaInput)
                            ?.saleNumber || ""
                        : ""
                    }
                    onChange={(e) => {
                      setCodigoVendaInput(e.target.value);
                    }}
                    placeholder={!codigoVendaInput ? "Buscar venda..." : ""}
                    className={`h-8 text-sm flex-1 cursor-pointer ${!codigoVendaInput ? "placeholder:text-red-500" : ""} ${activeCaixa === "venda" ? "ring-2 ring-blue-500" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      setSearchTerm(codigoVendaSearch);
                      setShowVendaSearch(true);
                    }}
                    title="Pesquisar venda"
                    aria-label="Pesquisar venda"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LADO DIREITO - Produtos e Código da Venda */}
        <Card className="mb-4 bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-wrap items-end gap-4">
                <Label className="w-full text-xs font-medium text-gray-700">
                  Período da venda / retirada:
                </Label>
                <RadioGroup
                  value={periodoTipo}
                  onValueChange={setPeriodoTipo}
                  className="flex flex-wrap items-center gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="aRetirar" id="prodRetirar" />
                    <Label htmlFor="prodRetirar" className="text-xs">
                      A retirar
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="retiradosEntre" id="prodRetirados" />
                    <Label htmlFor="prodRetirados" className="text-xs">
                      Retirados entre:
                    </Label>
                  </div>
                </RadioGroup>

                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dataInicial}
                    onChange={(e) => setDataInicial(e.target.value)}
                    disabled={periodoTipo !== "retiradosEntre"}
                    className="h-8 text-xs w-36"
                  />
                  <span className="text-xs text-slate-600">e</span>
                  <Input
                    type="date"
                    value={dataFinal}
                    onChange={(e) => setDataFinal(e.target.value)}
                    disabled={periodoTipo !== "retiradosEntre"}
                    className="h-8 text-xs w-36"
                  />
                </div>
              </div>

              <div></div>

              <div>
                <Button
                  className="h-10 w-full text-white mt-3"
                  style={{ backgroundColor: "#e78b3a" }}
                  onClick={applyFiltersAndShow}
                >
                  <Search className="w-4 h-4" /> Pesquisar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GRID DE RESULTADOS */}
        <Card className="mb-4 bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-auto">
              {!showResults ? (
                <div className="flex items-center justify-center h-48 text-slate-500 text-sm p-8">
                  <div className="text-center">
                    <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>
                      Configure os filtros e clique no botão <strong>🔎︎</strong>{" "}
                      para exibir os resultados.
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs font-semibold w-24">
                        Dt Venda
                      </TableHead>
                      <TableHead className="text-xs font-semibold w-20">
                        Venda
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Cliente / Pto. Venda
                      </TableHead>
                      <TableHead className="text-xs font-semibold w-40">
                        Produto
                      </TableHead>
                      <TableHead className="text-xs font-semibold w-20 text-center">
                        Vend.
                      </TableHead>
                      {periodoTipo === "aRetirar" ? (
                        <TableHead className="text-xs w-20 text-center">
                          A Ret.
                        </TableHead>
                      ) : (
                        <>
                          <TableHead className="text-xs w-20 text-center">
                            Ret.
                          </TableHead>
                          <TableHead className="text-xs w-24">
                            Dat Ret.
                          </TableHead>
                          <TableHead className="text-xs w-20 text-center">
                            Saldo
                          </TableHead>
                        </>
                      )}
                      <TableHead className="text-xs w-20 text-center">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : displayedPickups.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-slate-500"
                        >
                          Nenhum produto encontrado com os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedPickups.map((pickup) => (
                        <TableRow
                          key={pickup.id}
                          className={`cursor-pointer hover:bg-slate-100 ${selectedPickup?.id === pickup.id ? "bg-blue-100" : ""}`}
                          onClick={() => setSelectedPickup(pickup)}
                        >
                          <TableCell className="text-xs">
                            {pickup.saleDate
                              ? format(pickup.saleDate, "dd/MM/yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {pickup.saleId?.slice(-6) || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {pickup.personName || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {pickup.productName || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            {pickup.pickupQuantity || 0}
                          </TableCell>
                          {periodoTipo === "aRetirar" ? (
                            <TableCell className="text-xs text-center">
                              {(pickup.pickupQuantity || 0) -
                                (pickup.collectedQuantity || 0)}
                            </TableCell>
                          ) : (
                            <>
                              <TableCell className="text-xs text-center">
                                {pickup.collectedQuantity || 0}
                              </TableCell>
                              <TableCell className="text-xs">
                                {pickup.collectedDate
                                  ? format(pickup.collectedDate, "dd/MM/yyyy")
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {(pickup.pickupQuantity || 0) -
                                  (pickup.collectedQuantity || 0)}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="text-right">
                            {pickup.status !== "retirado_total" && (
                              <Button
                                size="sm"
                                className="h7 text-xs gap-1 text-white"
                                style={{ background: "#a78b3a" }}
                                onClick={() => handleBaixar(pickup)}
                                title="Registrar retirada"
                              >
                                <ArrowDown className="w-3 h-3" /> Baixar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* TOTAIS */}
        {showResults && displayedPickups.length > 0 && (
          <Card className="mb-4 bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="">
                <Label className="w-full text-xs font-medium text-gray-700">
                  Totais
                </Label>
                <div className="grid grid-cols-12">
                  <div>
                    <p className="text-xs text-slate-700">a Retirar</p>
                    <p className="text-xl font-bold text-slate-800">
                      {totalARetirar}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-700">Retirados</p>
                    <p className="text-xl font-bold text-slate-800">
                      {totalRetirados}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* BARRA DE AÇÕES */}
        <div
          className="p-4 rounded-lg"
          style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
        >
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant="outline"
              className="ms-auto me-0 gap-2"
              onClick={handleImprimir}
              disabled={!showResults || displayedPickups.length === 0}
            >
              <Printer className="w-3 h-3" /> Imprimir
            </Button>
          </div>
        </div>

        {/* Modal Baixa */}
        <Dialog open={showBaixaModal} onOpenChange={setShowBaixaModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Dar baixa</DialogTitle>
            </DialogHeader>
            {selectedPickup && (
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-sm font-medium">
                    Baixar do Setor:
                  </Label>
                  <Select value={sectorBaixa} onValueChange={setSectorBaixa}>
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue placeholder="Selecione o setor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">
                      Qtde. a Baixar:
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max={
                        (selectedPickup.pickupQuantity || 0) -
                        (selectedPickup.collectedQuantity || 0)
                      }
                      value={qtdeBaixar}
                      onChange={(e) => setQtdeBaixar(e.target.value)}
                      className="h-9 mt-1"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Retirado em:</Label>
                    <Input
                      type="date"
                      value={dataBaixa}
                      onChange={(e) => setDataBaixa(e.target.value)}
                      className="h-9 mt-1"
                      max={formatDateOnly(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Nota Fiscal:</Label>
                  <Input
                    type="text"
                    value={notaFiscal}
                    onChange={(e) => setNotaFiscal(e.target.value)}
                    className="h-9 mt-1"
                    placeholder="Número da nota fiscal (opcional)"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Pedido:</Label>
                  <Input
                    type="text"
                    value={pedido}
                    onChange={(e) => setPedido(e.target.value)}
                    className="h-9 mt-1"
                    placeholder="Número do pedido (opcional)"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="bg-slate-50 -mx-6 -mb-6 px-6 py-3 mt-4 rounded-b-lg">
              <div className="flex gap-2 ml-auto">
                <Button
                  onClick={handleConfirmarBaixa}
                  className="h-8 w-8 p-0 bg-[#6ac252] hover:bg-[#5cb143]"
                  title="Confirmar"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBaixaModal(false)}
                  className="h-8 w-8 p-0 bg-[#e88d44] hover:bg-[#d97d34] border-[#e88d44] text-white"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Pesquisa Cliente/PDV */}
        <Dialog open={showClienteSearch} onOpenChange={setShowClienteSearch}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Pesquisar Cliente / Pto. Venda</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Digite o nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
                autoFocus
              />
              <div className="max-h-80 overflow-auto border rounded">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs">Código</TableHead>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Telefone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPeople
                      .filter((p) => {
                        if (!searchTerm) return true;
                        const term = searchTerm.toLowerCase();
                        return (
                          p.name?.toLowerCase().includes(term) ||
                          p.document?.toLowerCase().includes(term)
                        );
                      })
                      .map((p) => (
                        <TableRow
                          key={p.id}
                          className="cursor-pointer hover:bg-blue-50"
                          onDoubleClick={() => {
                            setClienteInput(p.id);
                            setShowClienteSearch(false);
                            setSearchTerm("");
                          }}
                        >
                          <TableCell className="text-xs font-mono">
                            {p.personNumber || p.id?.slice(-6)}
                          </TableCell>
                          <TableCell className="text-xs">{p.name}</TableCell>
                          <TableCell className="text-xs">
                            {p.type === "cliente" ? "Cliente" : "Pto. Venda"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {p.phone?.[0] || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-slate-500">
                Dê duplo clique para selecionar
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowClienteSearch(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Confirmação de Impressão */}
        <Dialog open={showPrintConfirm} onOpenChange={setShowPrintConfirm}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Imprimir Comprovante</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              <p className="text-sm text-slate-600 mb-4">
                Deseja imprimir o comprovante de retirada?
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPrintConfirm(false);
                  setLastBaixaData(null);
                  setSelectedPickup(null);
                }}
              >
                Não
              </Button>
              <Button
                onClick={handleImprimirComprovante}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Sim, Imprimir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Pesquisa Produto */}
        <Dialog open={showProdutoSearch} onOpenChange={setShowProdutoSearch}>
          <DialogContent className="max-w-xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Pesquisar Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Digite o nome do produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
                autoFocus
              />
              <div className="max-h-80 overflow-auto border rounded">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs">Código</TableHead>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Categoria</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products
                      .filter((prod) => {
                        if (!searchTerm) return true;
                        const term = searchTerm.toLowerCase();
                        return (
                          prod.name?.toLowerCase().includes(term) ||
                          prod.code?.toLowerCase().includes(term)
                        );
                      })
                      .map((prod) => (
                        <TableRow
                          key={prod.id}
                          className="cursor-pointer hover:bg-blue-50"
                          onDoubleClick={() => {
                            setProdutoInput(prod.id);
                            setShowProdutoSearch(false);
                            setSearchTerm("");
                          }}
                        >
                          <TableCell className="text-xs font-mono">
                            {prod.code || prod.id?.slice(-6)}
                          </TableCell>
                          <TableCell className="text-xs">{prod.name}</TableCell>
                          <TableCell className="text-xs">
                            {prod.category || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-slate-500">
                Dê duplo clique para selecionar
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowProdutoSearch(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Pesquisa Venda */}
        <Dialog open={showVendaSearch} onOpenChange={setShowVendaSearch}>
          <DialogContent className="max-w-xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Pesquisar Código de Venda</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Digite o código da venda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
                autoFocus
              />
              <div className="max-h-80 overflow-auto border rounded">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs">Código</TableHead>
                      <TableHead className="text-xs">Cliente</TableHead>
                      <TableHead className="text-xs">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales
                      .filter((s) => {
                        if (!searchTerm) return true;
                        const term = searchTerm.toLowerCase();
                        return (
                          s.saleNumber?.toLowerCase().includes(term) ||
                          s.personName?.toLowerCase().includes(term)
                        );
                      })
                      .slice(0, 50)
                      .map((s) => (
                        <TableRow
                          key={s.id}
                          className="cursor-pointer hover:bg-blue-50"
                          onDoubleClick={() => {
                            setCodigoVendaInput(s.id);
                            setShowVendaSearch(false);
                            setSearchTerm("");
                          }}
                        >
                          <TableCell className="text-xs font-mono">
                            {s.saleNumber}
                          </TableCell>
                          <TableCell className="text-xs">
                            {s.personName}
                          </TableCell>
                          <TableCell className="text-xs">
                            {s.saleDate
                              ? format(s.saleDate, "dd/MM/yyyy")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-slate-500">
                Dê duplo clique para selecionar
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowVendaSearch(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
