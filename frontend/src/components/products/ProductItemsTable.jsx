import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProductItemsTable({
  items = [],
  columns,
  onRemove,
  emptyMessage = "Nenhum produto adicionado",
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={column.headerClassName || "text-xs font-semibold"}
              >
                {column.header}
              </TableHead>
            ))}
            {onRemove && (
              <TableHead className="text-xs text-right">Ações</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.id || `${item.productId}-${index}`}>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={column.cellClassName || "text-sm"}
                >
                  {column.render
                    ? column.render(item, index)
                    : item[column.key]}
                </TableCell>
              ))}
              {onRemove && (
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(index)}
                    className="text-red-500 hover:text-red-700"
                    title="Remover produto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length + (onRemove ? 1 : 0)}
                className="py-8 text-center text-sm text-slate-500"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
