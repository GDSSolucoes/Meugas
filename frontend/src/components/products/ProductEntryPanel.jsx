import React from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductSearchDialog from "./ProductSearchDialog";

export default function ProductEntryPanel({
  products = [],
  draft,
  variant = "sale",
  onDraftChange,
  onProductSelect,
  onAdd,
}) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const isPurchase = variant === "purchase";
  const priceLabel = isPurchase ? "Custo Unit." : "Preço Unit.";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-4">
        <div className="md:col-span-3">
          <Label>Código / Produto</Label>
          <div className="mt-1 flex items-center gap-1">
            <Select
              value={draft.productId || ""}
              onValueChange={(id) =>
                onProductSelect(products.find((product) => product.id === id))
              }
            >
              <SelectTrigger className="bg-white flex-1">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.code
                      ? `${product.code} - ${product.name}`
                      : product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setSearchOpen(true)}
              title="Pesquisar produto"
              aria-label="Pesquisar produto"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="md:col-span-1">
          <Label>Quantidade</Label>
          <Input
            type="number"
            min="1"
            step="1"
            value={draft.quantity ?? 1}
            onChange={(event) => onDraftChange("quantity", event.target.value)}
            className="mt-1"
          />
        </div>
        <div className="md:col-span-2">
          <Label>{priceLabel}</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={draft.unitPrice ?? 0}
            onChange={(event) => onDraftChange("unitPrice", event.target.value)}
            className="mt-1"
          />
        </div>
        <div className="md:col-span-2">
          <Label>Descrição</Label>
          <Input
            value={draft.productName || ""}
            readOnly
            className="mt-1 bg-slate-50"
            placeholder="Selecione um produto"
          />
        </div>
        {variant !== "budget" && (
          <div className="md:col-span-2">
            <Label>Desconto</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={draft.discount ?? 0}
              onChange={(event) =>
                onDraftChange("discount", event.target.value)
              }
              className="mt-1"
            />
          </div>
        )}
        <div className="md:col-span-2">
          <Button
            type="button"
            onClick={onAdd}
            className="w-full mt-1 text-white"
            style={{ background: "#e78b3a" }}
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar
          </Button>
        </div>
      </div>
      {isPurchase && (
        <div className="flex items-center gap-2 mb-4">
          <input
            id="product-stock-only"
            type="checkbox"
            checked={Boolean(draft.stockOnly)}
            onChange={(event) =>
              onDraftChange("stockOnly", event.target.checked)
            }
          />
          <Label
            htmlFor="product-stock-only"
            className="cursor-pointer text-sm"
          >
            Somente Estoque
          </Label>
        </div>
      )}
      <ProductSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        products={products}
        onSelect={onProductSelect}
      />
    </>
  );
}
