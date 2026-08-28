import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProductSearchDialog({
  open,
  onOpenChange,
  products = [],
  onSelect,
  title = "Pesquisar Produto",
}) {
  const [term, setTerm] = useState("");

  useEffect(() => {
    if (open) setTerm("");
  }, [open]);

  const filteredProducts = products.filter((product) => {
    const normalizedTerm = term.trim().toLowerCase();
    if (!normalizedTerm) return true;
    return [product.code, product.name, product.category]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedTerm));
  });

  const selectProduct = (product) => {
    onSelect(product);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              autoFocus
              className="h-9 pl-9"
              placeholder="Digite o código, nome ou categoria..."
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            />
          </div>
          <div className="max-h-80 overflow-auto border rounded">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0">
                <TableRow>
                  <TableHead className="text-xs">Código</TableHead>
                  <TableHead className="text-xs">Nome</TableHead>
                  <TableHead className="text-xs">Categoria</TableHead>
                  <TableHead className="text-xs text-right">Preço</TableHead>
                  <TableHead className="text-xs text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer hover:bg-blue-50"
                    onDoubleClick={() => selectProduct(product)}
                  >
                    <TableCell className="text-xs font-mono">
                      {product.code || product.id?.slice(-6)}
                    </TableCell>
                    <TableCell className="text-xs">{product.name}</TableCell>
                    <TableCell className="text-xs">
                      {product.category || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      R$ {Number(product.unitPrice || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => selectProduct(product)}
                      >
                        Selecionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
