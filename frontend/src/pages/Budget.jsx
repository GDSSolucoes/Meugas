import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Search, Save, Printer } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/entities";
import * as entities from "@/entities";
import ProductSearchDialog from "@/components/products/ProductSearchDialog";
import ProductItemsTable from "@/components/products/ProductItemsTable";
import ProductEntryPanel from "@/components/products/ProductEntryPanel";
import PersonSelector from "@/components/people/PersonSelector";

export default function BudgetPage() {
  const { toast } = useToast();
  const codigoInputRef = React.useRef(null);
  const codigoProdutoInputRef = React.useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [codigo, setCodigo] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [products, setProducts] = useState([]);
  const [people, setPeople] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [lastFocusedField, setLastFocusedField] = useState("codigo");

  // Produtos
  const [items, setItems] = useState([]);
  const [codigoProduto, setCodigoProduto] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [valorUnitario, setValorUnitario] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // Focar no campo Código ao carregar
  useEffect(() => {
    codigoInputRef.current?.focus();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);

      const [budgetsData, productsData, peopleData] = await Promise.all([
        entities.Budget.filter({ companyId: user.companyId }),
        entities.Product.filter({ companyId: user.companyId, active: true }),
        entities.Person.filter({ companyId: user.companyId }),
      ]);

      setBudgets(budgetsData);
      setProducts(productsData);
      setPeople(peopleData.filter((person) => person.type === "cliente"));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const limparCampos = () => {
    setCodigo("");
    setSelectedCustomer(null);
    setCustomerSearchTerm("");
    setShowCustomerSearch(false);
    setItems([]);
    setCodigoProduto("");
    setQuantidade("1");
    setValorUnitario("");
    setSelectedProduct(null);
  };

  const buscarOrcamentoPorCodigo = () => {
    // Se código vazio, novo orçamento
    if (!codigo || codigo.trim() === "") {
      setSelectedCustomer(null);
      setItems([]);
      toast({
        title: "Novo Orçamento",
        description: "Preencha os dados para criar um novo orçamento.",
      });
      return;
    }

    const orcamento = budgets.find((b) => b.budgetNumber === codigo);

    if (orcamento) {
      const customer = people.find(
        (person) => person.id === orcamento.personId,
      );
      setSelectedCustomer(customer || null);
      setCustomerSearchTerm(customer?.name || "");
      setItems(orcamento.items || []);
      toast({
        title: "Orçamento encontrado",
        description: `Orçamento #${orcamento.budgetNumber} carregado com sucesso.`,
      });
    } else {
      setShowErrorModal(true);
    }
  };

  const handleCodigoKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      buscarOrcamentoPorCodigo();
    }
  };

  const handleCodigoChange = (value) => {
    setCodigo(value);
  };

  const handleModificar = () => {
    if (!codigo) {
      toast({
        title: "Atenção",
        description: "Informe um código para modificar.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Info", description: "Campos liberados para edição." });
  };

  const handleSelectCustomer = (customer) => {
    const address = customer.address || {};
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name || "");
  };

  const handleExcluir = async () => {
    if (!codigo) {
      toast({
        title: "Atenção",
        description: "Informe um código para excluir.",
        variant: "destructive",
      });
      return;
    }

    const orcamento = budgets.find((b) => b.budgetNumber === codigo);
    if (!orcamento) {
      toast({
        title: "Erro",
        description: "Orçamento não encontrado.",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm("Tem certeza que deseja excluir este orçamento?")) {
      return;
    }

    try {
      await entities.Budget.delete(orcamento.id);
      toast({
        title: "Sucesso",
        description: "Orçamento excluído com sucesso.",
      });
      await loadData();
      limparCampos();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir.",
        variant: "destructive",
      });
    }
  };

  const handlePesquisar = () => {
    if (lastFocusedField === "codigo") {
      setShowSearchModal(true);
    } else if (lastFocusedField === "produto") {
      setShowProductSearch(true);
    } else {
      // Fallback: se nenhum campo estiver focado, perguntar ao usuário
      setShowSearchModal(true);
    }
  };

  const handleAdicionarProduto = () => {
    if (!selectedProduct) {
      toast({
        title: "Atenção",
        description: "Selecione um produto.",
        variant: "destructive",
      });
      return;
    }

    const qtd = parseFloat(quantidade) || 0;
    const valor = parseFloat(valorUnitario) || 0;

    if (qtd <= 0) {
      toast({
        title: "Atenção",
        description: "Quantidade deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (valor <= 0) {
      toast({
        title: "Atenção",
        description: "Valor unitário deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    const novoItem = {
      productId: selectedProduct.id,
      productCode: selectedProduct.code || "",
      productName: selectedProduct.name,
      quantity: qtd,
      unitPrice: valor,
      total: qtd * valor,
    };

    setItems((prev) => [...prev, novoItem]);
    setCodigoProduto("");
    setQuantidade("1");
    setValorUnitario("");
    setSelectedProduct(null);
  };

  const handleRemoverItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOk = async () => {
    if (isSaving) return;

    if (!selectedCustomer?.id) {
      toast({
        title: "Erro",
        description: "Selecione um cliente cadastrado.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      // Se tem código, é edição
      if (codigo) {
        const orcamento = budgets.find((b) => b.budgetNumber === codigo);
        if (orcamento) {
          await entities.Budget.update(orcamento.id, {
            personId: selectedCustomer.id,
            items: items,
            totalAmount: totalAmount,
            companyId: currentUser.companyId,
            companyName: currentUser.companyName,
            createdByName: currentUser.name,
          });

          toast({
            title: "Sucesso",
            description: `Orçamento #${codigo} atualizado com sucesso!`,
          });
        }
      } else {
        // Novo orçamento - gerar código sequencial
        const allBudgets = await entities.Budget.filter({
          companyId: currentUser.companyId,
        });
        const maxBudgetNumber = allBudgets.reduce((max, budget) => {
          const currentNum = parseInt(budget.budgetNumber, 10);
          return !isNaN(currentNum) && currentNum > max ? currentNum : max;
        }, 0);
        const newBudgetNumber = String(maxBudgetNumber + 1);

        await entities.Budget.create({
          budgetNumber: newBudgetNumber,
          personId: selectedCustomer.id,
          items: items,
          totalAmount: totalAmount,
          companyId: currentUser.companyId,
          companyName: currentUser.companyName,
          createdByName: currentUser.name,
        });

        setCodigo(newBudgetNumber);
        toast({
          title: "Sucesso",
          description: `Orçamento #${newBudgetNumber} criado com sucesso!`,
        });
      }

      await loadData();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImprimir = () => {
    if (!codigo && items.length === 0) {
      toast({
        title: "Atenção",
        description: "Preencha os dados para imprimir.",
        variant: "destructive",
      });
      return;
    }

    const totalGeral = items.reduce((sum, item) => sum + item.total, 0);
    const dataAtual = new Date().toLocaleDateString("pt-BR");

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orçamento #${codigo || "Novo"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; font-size: 12px; }
          h1 { text-align: center; margin-bottom: 10px; }
          .data { text-align: center; margin-bottom: 20px; font-size: 11px; color: #666; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
          .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; background: #f0f0f0; padding: 5px; }
          .field { margin: 5px 0; display: flex; }
          .field label { font-weight: bold; width: 150px; }
          .field span { color: #555; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f0f0f0; }
          .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 20px; }
          .assinatura { margin-top: 60px; padding-top: 30px; }
          .assinatura-linha { border-top: 1px solid #000; width: 300px; margin: 0 auto; padding-top: 5px; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>ORÇAMENTO ${codigo ? "#" + codigo : ""}</h1>
        <div class="data">Data: ${dataAtual}</div>
        <div class="section">
          <div class="section-title">Dados do Cliente</div>
          <div class="field"><label>Nome:</label><span>${nome}</span></div>
          <div class="field"><label>Endereço:</label><span>${rua}, ${numero} ${complemento}</span></div>
          <div class="field"><label>Bairro:</label><span>${bairro}</span></div>
          <div class="field"><label>Cidade/UF:</label><span>${cidade}/${uf}</span></div>
        </div>
        <div class="section">
          <div class="section-title">Produtos</div>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Valor Unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                <tr>
                  <td>${item.productCode}</td>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>R$ ${item.unitPrice.toFixed(2)}</td>
                  <td>R$ ${item.total.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <div class="total">Total Geral: R$ ${totalGeral.toFixed(2)}</div>
        </div>
        <div class="assinatura">
          <div class="assinatura-linha">
            Assinatura do Responsável
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleSelectBudget = (budget) => {
    const customer = people.find((person) => person.id === budget.personId);
    setSelectedCustomer(customer || null);
    setCustomerSearchTerm(customer?.name || "");
    setCodigo(budget.budgetNumber);
    setItems(budget.items || []);
    setShowSearchModal(false);
    setSearchTerm("");
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setCodigoProduto(product.code || product.id?.slice(-6) || "");
    setValorUnitario(product.unitPrice?.toString() || "0");
    setShowProductSearch(false);
    setSearchTerm("");
  };

  const totalGeral = items.reduce((sum, item) => sum + item.total, 0);
  const budgetProductColumns = [
    { key: "productCode", header: "Código", cellClassName: "text-xs" },
    { key: "productName", header: "Produto", cellClassName: "text-xs" },
    {
      key: "quantity",
      header: "Qtde",
      headerClassName: "text-xs text-right",
      cellClassName: "text-xs text-right",
    },
    {
      key: "unitPrice",
      header: "Vlr. Unit.",
      headerClassName: "text-xs text-right",
      cellClassName: "text-xs text-right",
      render: (item) => `R$ ${Number(item.unitPrice || 0).toFixed(2)}`,
    },
    {
      key: "total",
      header: "Total",
      headerClassName: "text-xs text-right",
      cellClassName: "text-xs text-right font-semibold",
      render: (item) => `R$ ${Number(item.total || 0).toFixed(2)}`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-[1400px] mx-auto p-6">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Orçamento</h1>

        <div className="space-y-4">
          {/* Código do Orçamento */}
          <Card className="mb-4 bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-2">
                <Label className="text-xs font-medium text-gray-700">
                  Código:
                </Label>
                <Input
                  ref={codigoInputRef}
                  value={codigo}
                  onChange={(e) => handleCodigoChange(e.target.value)}
                  onKeyDown={handleCodigoKeyDown}
                  onFocus={() => setLastFocusedField("codigo")}
                  className="w-40 h-9 mt-1"
                  placeholder=""
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={handlePesquisar}
                  title="Pesquisar orçamento"
                  aria-label="Pesquisar orçamento"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Cliente */}
          <Card className="mb-4 bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold text-blue-900 mb-3">
                Cliente: <span className="text-red-500">*</span>
              </h2>
              <PersonSelector
                options={people}
                selectedPerson={selectedCustomer}
                open={showCustomerSearch}
                value={customerSearchTerm}
                title="Selecionar Cliente"
                inputPlaceholder="Buscar cliente..."
                searchPlaceholder="Digite o nome do cliente..."
                onOpenChange={setShowCustomerSearch}
                onValueChange={setCustomerSearchTerm}
                onSelect={handleSelectCustomer}
                onClear={() => {
                  setSelectedCustomer(null);
                  setCustomerSearchTerm("");
                  setNome("");
                  setRua("");
                  setNumero("");
                  setComplemento("");
                  setBairro("");
                  setCidade("");
                  setUf("PR");
                }}
              />
            </CardContent>
          </Card>

          {/* Produtos */}
          <Card className="mb-4 bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold text-blue-900 mb-4">
                Produtos
              </h2>
              <ProductEntryPanel
                products={products}
                variant="budget"
                draft={{
                  productId: selectedProduct?.id,
                  productName: selectedProduct?.name,
                  quantity: quantidade,
                  unitPrice: valorUnitario,
                }}
                onDraftChange={(field, value) => {
                  if (field === "quantity") setQuantidade(value);
                  if (field === "unitPrice") setValorUnitario(value);
                }}
                onProductSelect={handleSelectProduct}
                onAdd={handleAdicionarProduto}
              />

              {/* Lista de Produtos */}
              <ProductItemsTable
                items={items}
                columns={budgetProductColumns}
                onRemove={handleRemoverItem}
              />

              {/* Total */}
              {items.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-xs font-semibold text-green-700">
                      Total Geral:
                    </p>
                    <p className="text-xl font-bold text-green-800">
                      R$ {totalGeral.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
          <div className="flex flex-wrap gap-3 items-center justify-center">
            <Button
              variant="outline"
              className="gap-2 text-red-600 hover:bg-red-50"
              onClick={handleExcluir}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs">Excluir</span>
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-white"
              style={{ backgroundColor: "#e78b3a" }}
              onClick={handleOk}
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              <span className="text-xs">{isSaving ? "Salvando..." : "Ok"}</span>
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleImprimir}
              disabled={!codigo}
            >
              <Printer className="w-4 h-4" />
              <span className="text-xs">Imprimir</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Erro */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">
              Código Não Encontrado
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              O código de orçamento digitado não foi encontrado. Por favor,
              verifique e digite novamente.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowErrorModal(false);
                setCodigo("");
              }}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Pesquisa Orçamento */}
      <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-900">
              Pesquisar Orçamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por código, nome do cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-96 overflow-auto border rounded">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">
                      Código
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Cliente
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Data
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets
                    .filter((b) => {
                      if (!searchTerm) return true;
                      const term = searchTerm.toLowerCase();
                      return (
                        b.budgetNumber?.toLowerCase().includes(term) ||
                        b.customerData?.name?.toLowerCase().includes(term)
                      );
                    })
                    .map((b) => (
                      <TableRow
                        key={b.id}
                        className="cursor-pointer hover:bg-blue-50"
                        onDoubleClick={() => handleSelectBudget(b)}
                      >
                        <TableCell className="text-xs font-mono">
                          {b.budgetNumber}
                        </TableCell>
                        <TableCell className="text-xs">
                          {b.customerData?.name || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {b.createdAt
                            ? new Date(b.createdAt).toLocaleDateString("pt-BR")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          R$ {(b.totalAmount || 0).toFixed(2)}
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
            <Button variant="outline" onClick={() => setShowSearchModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductSearchDialog
        open={showProductSearch}
        onOpenChange={setShowProductSearch}
        products={products}
        onSelect={handleSelectProduct}
      />
    </div>
  );
}
