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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, X, Printer, PackageCheck } from "lucide-react";
import * as entities from "@/entities";
import { useToast } from "@/components/ui/use-toast";
import { format, startOfDay, endOfDay, isBefore } from "date-fns";
import { formatDateOnly } from "@/utils";
import PersonSelector from "@/components/people/PersonSelector";

export default function VasilhameManagementPage() {
  const { toast } = useToast();
  const [displayedLoans, setDisplayedLoans] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [people, setPeople] = useState([]);
  const [vasilhames, setVasilhames] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Modais
  const [showClienteSearch, setShowClienteSearch] = useState(false);
  const [showProdutoSearch, setShowProdutoSearch] = useState(false);
  const [showModificarModal, setShowModificarModal] = useState(false);
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [qtdeBaixar, setQtdeBaixar] = useState("");
  const [baixaError, setBaixaError] = useState("");

  // Filtros
  const [filtrarCliente, setFiltrarCliente] = useState(true);
  const [filtrarPontoVenda, setFiltrarPontoVenda] = useState(true);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSector, setCurrentSector] = useState(null);

  const [setorGeral, setSetorGeral] = useState(true);
  const [setorMaster, setSetorMaster] = useState(false);
  const [setorMasterValue, setSetorMasterValue] = useState("");
  const [setorMasterNome, setSetorMasterNome] = useState("");
  const [setorEstqProprio, setSetorEstqProprio] = useState(false);
  const [setorEstqProprioValue, setSetorEstqProprioValue] = useState("");
  const [setorEstqProprioNome, setSetorEstqProprioNome] = useState("");

  const [periodoTipo, setPeriodoTipo] = useState("aDevolver");
  const [dataInicial, setDataInicial] = useState(
    formatDateOnly(new Date(), "yyyy-MM-dd"),
  );
  const [dataFinal, setDataFinal] = useState(
    formatDateOnly(new Date(), "yyyy-MM-dd"),
  );

  const [filtroProduto, setFiltroProduto] = useState("");
  const [filtroProdutoNome, setFiltroProdutoNome] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Campo ativo para pesquisa
  const [activeSearchField, setActiveSearchField] = useState(null);

  // Modificar modal state
  const [modDevolvido, setModDevolvido] = useState(false);
  const [modDataDevolucao, setModDataDevolucao] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await entities.User.me();
      setCurrentUser(user);

      const sectorsData = await entities.Sector.filter({
        companyId: user.companyId,
        active: true,
      });
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

  useEffect(() => {
    if (!showClienteSearch && !showProdutoSearch) return;

    const loadSearchOptions = async () => {
      setIsSearchLoading(true);
      try {
        if (showClienteSearch) {
          const peopleData = await entities.Person.filter(
            {
              companyId: currentUser?.companyId,
              type: ["cliente", "ponto_venda"],
            },
            { q: searchTerm, limit: 25, sort: "name", order: "asc" },
          );
          setPeople(peopleData);
        } else {
          const productsData = await entities.Product.filter(
            {
              companyId: currentUser?.companyId,
              category: "vasilhame",
              active: true,
            },
            { q: searchTerm, limit: 25, sort: "name", order: "asc" },
          );
          setVasilhames(productsData);
        }
      } catch (error) {
        console.error("Erro ao pesquisar opções:", error);
      } finally {
        setIsSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(loadSearchOptions, 250);
    return () => clearTimeout(timeoutId);
  }, [
    currentUser?.companyId,
    searchTerm,
    showClienteSearch,
    showProdutoSearch,
  ]);

  // Aplicar filtros
  const applyFiltersAndShow = async () => {
    setIsLoading(true);
    try {
      const filters = {
        companyId: currentUser?.companyId,
        status:
          periodoTipo === "aDevolver"
            ? ["pendente", "devolvido_parcial"]
            : "devolvido_total",
        ...(selectedCustomer?.id && { personId: selectedCustomer.id }),
        ...(selectedSector?.id && { sectorId: selectedSector.id }),
        ...(filtroProduto && { vasilhameId: filtroProduto }),
        ...(periodoTipo === "devolvidos" && {
          returnDate_gte: startOfDay(
            new Date(`${dataInicial}T00:00:00`),
          ).toISOString(),
          returnDate_lte: endOfDay(
            new Date(`${dataFinal}T23:59:59`),
          ).toISOString(),
        }),
      };

      const filtered = await entities.VasilhameLoan.filter(filters, {
        sort: "-loanDate",
        limit: 100,
      });
      setDisplayedLoans(filtered);
      setShowResults(true);
    } catch (error) {
      console.error("Erro ao pesquisar vasilhames:", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a pesquisa.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePesquisar = () => {
    // Se um campo está focado, abre modal de pesquisa
    if (activeSearchField === "cliente") {
      setSearchTerm(clientSearchTerm);
      setShowClienteSearch(true);
      return;
    }
    if (activeSearchField === "produto") {
      setSearchTerm(filtroProdutoNome);
      setShowProdutoSearch(true);
      return;
    }
    // Senão, aplica filtros
    applyFiltersAndShow();
  };

  const handleCancelar = () => {
    // Limpar todos os filtros
    setFiltrarCliente(true);
    setFiltrarPontoVenda(true);
    setClientSearchTerm("");
    setSelectedCustomer(null);
    setSetorGeral(true);
    setSetorMaster(false);
    setSetorMasterValue("");
    setSetorMasterNome("");
    setSetorEstqProprio(false);
    setSetorEstqProprioValue("");
    setSetorEstqProprioNome("");
    setPeriodoTipo("aDevolver");
    setDataInicial(formatDateOnly(new Date(), "yyyy-MM-dd"));
    setDataFinal(formatDateOnly(new Date(), "yyyy-MM-dd"));
    setFiltroProduto("");
    setFiltroProdutoNome("");
    setSelectedProduct(null);
    setDisplayedLoans([]);
    setShowResults(false);
    setSelectedLoan(null);
  };

  const handleModificar = () => {
    if (!selectedLoan) {
      toast({
        title: "Atenção",
        description: "Selecione um registro para modificar.",
        variant: "destructive",
      });
      return;
    }
    setModDevolvido(selectedLoan.status === "devolvido_total");
    setModDataDevolucao(
      selectedLoan.returnDate || formatDateOnly(new Date(), "yyyy-MM-dd"),
    );
    setShowModificarModal(true);
  };

  const handleSalvarModificacao = async () => {
    if (!selectedLoan) return;

    try {
      await entities.VasilhameLoan.update(selectedLoan.id, {
        status: modDevolvido ? "devolvido_total" : "pendente",
        returnedQuantity: modDevolvido ? selectedLoan.loanQuantity : 0,
        returnDate: modDevolvido ? modDataDevolucao : null,
      });

      toast({
        title: "Sucesso",
        description: "Registro atualizado com sucesso.",
      });
      setShowModificarModal(false);
      setSelectedLoan(null);
      await loadData();
      if (showResults) {
        setTimeout(() => applyFiltersAndShow(), 100);
      }
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o registro.",
        variant: "destructive",
      });
    }
  };

  const handleImprimir = () => {
    const dataToprint = showResults ? displayedLoans : [];

    if (dataToprint.length === 0) {
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
        <title>Controle de Vasilhames Emprestados</title>
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
          .devolvido { background-color: #d4edda; }
          .pendente { background-color: #fff3cd; }
          .footer { margin-top: 15px; text-align: center; font-size: 9px; color: #666; }
          @media print { body { padding: 10px; } button { display: none; } }
          .btn-print { display: block; margin: 15px auto; padding: 8px 25px; font-size: 12px; background: #1e3a8a; color: white; border: none; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Controle de Vasilhames Emprestados (Venda)</h1>
        <p class="subtitle">Emitido em: ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        
        <div class="filters">
          <strong>Filtros:</strong> 
          Tipo: ${filtrarCliente && filtrarPontoVenda ? "Cliente e Pto. Venda" : filtrarCliente ? "Cliente" : "Pto. Venda"} |
          Período: ${periodoTipo === "aDevolver" ? "A Devolver" : `Devolvidos de ${format(dataInicial, "dd/MM/yyyy")} a ${format(dataFinal, "dd/MM/yyyy")}`}
          ${filtroProdutoNome ? ` | Produto: ${filtroProdutoNome}` : ""}
        </div>

        <table>
          <thead>
            <tr>
              <th>Dt Venda</th>
              <th>Venda</th>
              <th>Cliente / Pto. Venda</th>
              <th>Produto</th>
              <th>Qtd</th>
              <th class="text-center">Devolvido</th>
              <th>Data Dev.</th>
            </tr>
          </thead>
          <tbody>
            ${dataToprint
              .map(
                (loan) => `
              <tr class="${loan.status === "devolvido_total" ? "devolvido" : "pendente"}">
                <td>${loan.loanDate ? format(loan.loanDate, "dd/MM/yyyy") : "-"}</td>
                <td>${loan.saleId?.slice(-6) || "-"}</td>
                <td>${loan.personName || "-"}</td>
                <td>${loan.vasilhameName || "-"}</td>
                <td>${loan.loanQuantity || 0}</td>
                <td class="text-center">${loan.status === "devolvido_total" ? "Sim" : "Não"}</td>
                <td>${loan.returnDate ? format(loan.returnDate, "dd/MM/yyyy") : "-"}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <p class="footer">Total de registros: ${dataToprint.length}</p>
        
        <button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const getRowColor = (loan) => {
    if (loan.status === "devolvido_total") return "bg-green-50";
    // Verificar se é venda antiga (mais de 30 dias)
    if (loan.loanDate) {
      const loanDate = loan.loanDate;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (isBefore(loanDate, thirtyDaysAgo)) {
        return "bg-red-50";
      }
    }
    return "bg-yellow-50";
  };

  const handleRegisterReturn = (loan) => {
    if (loan.status === "devolvido_total") return;
    setSelectedLoan(loan);
    setQtdeBaixar("");
    setBaixaError("");
    setShowBaixaModal(true);
  };

  const handleConfirmarBaixa = async () => {
    if (!selectedLoan) return;

    const qtde = parseInt(qtdeBaixar) || 0;
    const pendente =
      (selectedLoan.loanQuantity || 0) - (selectedLoan.returnedQuantity || 0);

    if (qtde <= 0) {
      setBaixaError("Informe uma quantidade válida.");
      return;
    }

    if (qtde > pendente) {
      setBaixaError(
        `Quantidade inválida. Máximo permitido: ${pendente}. Por favor, redigite.`,
      );
      return;
    }

    try {
      const novaQtdeDevolvida = (selectedLoan.returnedQuantity || 0) + qtde;
      const totalEmprestado = selectedLoan.loanQuantity || 0;
      const novoStatus =
        novaQtdeDevolvida >= totalEmprestado
          ? "devolvido_total"
          : "devolvido_parcial";

      await entities.VasilhameLoan.update(selectedLoan.id, {
        status: novoStatus,
        returnedQuantity: novaQtdeDevolvida,
        returnDate:
          novoStatus === "devolvido_total"
            ? formatDateOnly(new Date(), "yyyy-MM-dd")
            : selectedLoan.returnDate,
      });

      toast({
        title: "Sucesso",
        description: `Baixa de ${qtde} vasilhame(s) realizada com sucesso.`,
      });
      setShowBaixaModal(false);
      setSelectedLoan(null);
      await loadData();
      if (showResults) {
        await applyFiltersAndShow();
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

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setClientSearchTerm("");
  };

  const clearProduct = () => {
    setSelectedProduct(null);
    setFiltroProduto("");
    setFiltroProdutoNome("");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-[1400px] mx-auto p-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">
          Controle de vasilhames emprestados (Venda)
        </h1>

        {/* Main Content */}
        <Card className="mb-4 bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtrar por */}
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  Filtrar por:
                </Label>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Checkbox
                      id="fpCliente"
                      checked={filtrarCliente}
                      onCheckedChange={setFiltrarCliente}
                    />
                    <label htmlFor="fpCliente" className="text-xs">
                      Cliente
                    </label>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Checkbox
                      id="fpPdv"
                      checked={filtrarPontoVenda}
                      onCheckedChange={setFiltrarPontoVenda}
                    />
                    <label htmlFor="fpPdv" className="text-xs">
                      Pto. Venda
                    </label>
                  </div>
                </div>
                <div className="mt-2">
                  <PersonSelector
                    options={people}
                    selectedPerson={selectedCustomer}
                    open={showClienteSearch}
                    value={clientSearchTerm}
                    title={
                      filtrarCliente && filtrarPontoVenda
                        ? "Selecionar Cliente/PDV"
                        : filtrarCliente
                          ? "Selecionar Cliente"
                          : "Selecionar Ponto de Venda"
                    }
                    inputPlaceholder="Buscar por Nome"
                    searchPlaceholder="Digite o nome..."
                    showType
                    isLoading={isSearchLoading}
                    onOpenChange={(open) => {
                      setShowClienteSearch(open);
                      if (open) setSearchTerm(clientSearchTerm);
                    }}
                    onValueChange={(value) => {
                      setClientSearchTerm(value);
                      setSearchTerm(value);
                    }}
                    onSelect={(person) => {
                      setSelectedCustomer(person);
                      setClientSearchTerm(person.name);
                      setShowClienteSearch(false);
                      setSearchTerm("");
                    }}
                    onClear={clearCustomer}
                  />
                </div>
              </div>
              {/* Setor */}
              <div className="">
                <Label className="text-xs font-medium text-gray-700">
                  Setor:
                </Label>
                <div className="mt-1">
                  <Select
                    value={selectedSector?.id || ""}
                    onValueChange={(value) => {
                      const sector = sectors.find((s) => s.id === value);
                      setCurrentSector(sector || null);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o setor" />
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
              </div>

              {/* Produto */}
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  Produto:
                </Label>
                <div className="flex items-center mt-1">
                  {!selectedProduct ? (
                    <div className="flex items-center gap-2 w-full">
                      <Input
                        value={filtroProdutoNome}
                        onChange={(e) => setFiltroProdutoNome(e.target.value)}
                        onFocus={() => setActiveSearchField("produto")}
                        onBlur={() =>
                          setTimeout(() => setActiveSearchField(null), 200)
                        }
                        placeholder="Buscar produto..."
                        className="h-8 text-xs w-full"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => {
                          setSearchTerm(filtroProdutoNome);
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
                        <p className="text-xs text-gray-600">
                          {selectedProduct.code || "Sem código"}
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
            </div>
          </CardContent>
        </Card>
        <Card className="mb-4 bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            {/* Período */}
            <div className="flex flex-wrap items-end gap-4">
              <Label className="w-full text-xs font-medium text-gray-700">
                Período da venda / devolução:
              </Label>
              <RadioGroup
                value={periodoTipo}
                onValueChange={setPeriodoTipo}
                className="flex flex-wrap items-center gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="aDevolver" id="periodoDevolver" />
                  <label htmlFor="periodoDevolver" className="text-xs">
                    A Devolver
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="devolvidos" id="periodoDevolvidos" />
                  <label htmlFor="periodoDevolvidos" className="text-xs">
                    Devolvidos entre:
                  </label>
                </div>
              </RadioGroup>

              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  disabled={periodoTipo !== "devolvidos"}
                  className="h-8 text-xs w-36"
                />
                <span className="text-xs text-slate-600">a</span>
                <Input
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  disabled={periodoTipo !== "devolvidos"}
                  className="h-8 text-xs w-36"
                />
              </div>
              <Button
                className="text-white h-8 ms-auto me-0"
                style={{ backgroundColor: "#e78b3a" }}
                onClick={applyFiltersAndShow}
              >
                <Search className="w-4 h-4" />
                Pesquisar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* GRID DE RESULTADOS */}
        <Card className="mb-4 bg-white border-gray-200 shadow-sm">
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-auto">
              {!showResults ? (
                <div className="flex items-center justify-center h-48 text-slate-500 text-sm p-8">
                  <div className="text-center">
                    <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>
                      Selecione os filtros e clique no botão <strong>➔</strong>{" "}
                      para pesquisar
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs w-24">Dt Venda</TableHead>
                      <TableHead className="text-xs w-20">Venda</TableHead>
                      <TableHead className="text-xs">
                        Cliente / Pto. Venda
                      </TableHead>
                      <TableHead className="text-xs w-32">Produto</TableHead>
                      <TableHead className="text-xs w-16 text-center">
                        Qtd
                      </TableHead>
                      <TableHead className="text-xs w-20 text-center">
                        Devolvido
                      </TableHead>
                      <TableHead className="text-xs w-24">Data Dev.</TableHead>
                      <TableHead className="text-xs w-40 text-right">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : displayedLoans.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-slate-500"
                        >
                          Nenhum vasilhame encontrado com os filtros
                          selecionados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedLoans.map((loan) => (
                        <TableRow
                          key={loan.id}
                          className={`cursor-pointer hover:bg-slate-100 ${getRowColor(loan)} ${selectedLoan?.id === loan.id ? "ring-2 ring-blue-500" : ""}`}
                          onClick={() => setSelectedLoan(loan)}
                        >
                          <TableCell className="text-xs">
                            {loan.loanDate
                              ? format(loan.loanDate, "dd/MM/yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {loan.saleId?.slice(-6) || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {loan.personName || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {loan.vasilhameName || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            {loan.loanQuantity || 0}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            {loan.status === "devolvido_total" ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Sim
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                Não
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {loan.returnDate
                              ? format(loan.returnDate, "dd/MM/yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {loan.status !== "devolvido_total" && (
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1 text-white"
                                style={{ backgroundColor: "#e78b3a" }}
                                onClick={() => handleRegisterReturn(loan)}
                                title="Registrar devolução"
                              >
                                <PackageCheck className="w-3 h-3" />
                                Registrar devolução
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

        {/* Legenda */}
        {showResults && displayedLoans.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Devolvido</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>Pendente</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>Pendente há mais de 30 dias</span>
            </div>
            <div className="ml-auto text-slate-600">
              Total de registros: {displayedLoans.length}
            </div>
          </div>
        )}
        {/* BARRA DE AÇÕES */}
        <div
          className="p-4 rounded-lg"
          style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
        >
          <div className="flex flex-wrap gap-3 justify-center">
            {/* <Button
              variant="outline"
              className="gap-2"
              onClick={handleModificar}
              disabled={!selectedLoan}
            >
              <Edit className="w-3 h-3" /> Alterar
            </Button> */}
            <Button
              variant="outline"
              className="ms-auto me-0 gap-2"
              onClick={handleImprimir}
              disabled={!showResults || displayedLoans.length === 0}
            >
              <Printer className="w-3 h-3" /> Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Pesquisa Produto */}
      <Dialog open={showProdutoSearch} onOpenChange={setShowProdutoSearch}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-900">
              Pesquisar Produto/Vasilhame
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Digite o código ou nome do produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-80 overflow-auto border rounded">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="text-xs">Código</TableHead>
                    <TableHead className="text-xs">Nome</TableHead>
                    <TableHead className="text-xs text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isSearchLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-8 text-slate-500"
                      >
                        Pesquisando...
                      </TableCell>
                    </TableRow>
                  ) : vasilhames.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-8 text-slate-500"
                      >
                        Nenhum produto encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    vasilhames.map((v) => (
                      <TableRow
                        key={v.id}
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => {
                          setFiltroProduto(v.id);
                          setFiltroProdutoNome(v.name);
                          setSelectedProduct(v);
                          setShowProdutoSearch(false);
                          setSearchTerm("");
                        }}
                      >
                        <TableCell className="text-xs font-mono">
                          {v.code || v.id?.slice(-6)}
                        </TableCell>
                        <TableCell className="text-xs">{v.name}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setFiltroProduto(v.id);
                              setFiltroProdutoNome(v.name);
                              setSelectedProduct(v);
                              setShowProdutoSearch(false);
                              setSearchTerm("");
                            }}
                          >
                            Selecionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-slate-500">
              Clique em um produto para selecionar
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

      {/* Modal Modificar */}
      <Dialog open={showModificarModal} onOpenChange={setShowModificarModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-900">
              Modificar Vasilhame Emprestado
            </DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
                <p>
                  <strong>Cliente:</strong> {selectedLoan.personName}
                </p>
                <p>
                  <strong>Produto:</strong> {selectedLoan.vasilhameName}
                </p>
                <p>
                  <strong>Quantidade:</strong> {selectedLoan.loanQuantity}
                </p>
                <p>
                  <strong>Data Empréstimo:</strong>{" "}
                  {selectedLoan.loanDate
                    ? format(selectedLoan.loanDate, "dd/MM/yyyy")
                    : "-"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="modDevolvido"
                  checked={modDevolvido}
                  onCheckedChange={setModDevolvido}
                />
                <label htmlFor="modDevolvido" className="text-sm font-medium">
                  Marcar como Devolvido
                </label>
              </div>

              {modDevolvido && (
                <div>
                  <Label className="text-sm">Data da Devolução:</Label>
                  <Input
                    type="date"
                    value={modDataDevolucao}
                    onChange={(e) => setModDataDevolucao(e.target.value)}
                    className="h-9"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModificarModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarModificacao}
              className="text-white hover:opacity-90"
              style={{ backgroundColor: "#e78b3a" }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Baixa Rápida */}
      <Dialog open={showBaixaModal} onOpenChange={setShowBaixaModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-900">
              Baixa de Vasilhame
            </DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
                <p>
                  <strong>Cliente:</strong> {selectedLoan.personName}
                </p>
                <p>
                  <strong>Produto:</strong> {selectedLoan.vasilhameName}
                </p>
                <p>
                  <strong>Emprestado:</strong> {selectedLoan.loanQuantity}
                </p>
                <p>
                  <strong>Já devolvido:</strong>{" "}
                  {selectedLoan.returnedQuantity || 0}
                </p>
                <p>
                  <strong>Pendente:</strong>{" "}
                  {(selectedLoan.loanQuantity || 0) -
                    (selectedLoan.returnedQuantity || 0)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Qtde. a baixar:</Label>
                <Input
                  type="number"
                  min="1"
                  max={
                    (selectedLoan.loanQuantity || 0) -
                    (selectedLoan.returnedQuantity || 0)
                  }
                  value={qtdeBaixar}
                  onChange={(e) => {
                    setQtdeBaixar(e.target.value);
                    setBaixaError("");
                  }}
                  className="h-9 mt-1"
                  placeholder="Informe a quantidade..."
                  autoFocus
                />
                {baixaError && (
                  <p className="text-red-600 text-xs mt-2">{baixaError}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBaixaModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarBaixa}
              className="text-white hover:opacity-90"
              style={{ backgroundColor: "#e78b3a" }}
            >
              Ok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
