import React, { useEffect, useMemo, useRef } from "react";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PersonSelector({
  options = [],
  selectedPerson = null,
  open = false,
  value = "",
  title = "Selecionar Cliente",
  inputPlaceholder = "Buscar por Nome",
  searchPlaceholder = "Digite o nome...",
  emptyMessage = "Nenhum cliente encontrado",
  isLoading = false,
  showType = false,
  registrationType = "cliente",
  registrationLabel = "Cadastrar",
  onOpenChange,
  onValueChange,
  onSelect,
  onClear,
}) {
  const processedPersonId = useRef(null);

  const filteredOptions = useMemo(() => {
    const normalizedValue = value.trim().toLowerCase();
    if (!normalizedValue) return options;

    return options.filter((person) =>
      [
        person.name,
        person.personNumber,
        person.address?.street,
        person.address?.number,
        person.address?.neighborhood,
        person.phone?.[0],
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalizedValue)),
    );
  }, [options, value]);

  const getPersonType = (person) =>
    person.type === "cliente" ? "Cliente" : "Pto. Venda";

  useEffect(() => {
    const personId = new URLSearchParams(window.location.search).get(
      "personId",
    );
    if (!personId || processedPersonId.current === personId) return;

    const person = options.find((option) => option.id === personId);
    if (!person) return;

    processedPersonId.current = personId;
    onSelect?.(person);
    onOpenChange?.(false);

    const params = new URLSearchParams(window.location.search);
    params.delete("personId");
    const nextSearch = params.toString();
    window.history.replaceState(
      {},
      document.title,
      `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`,
    );
  }, [onOpenChange, onSelect, options]);

  const handleRegister = () => {
    const params = new URLSearchParams({
      module: "gerencial",
      type: registrationType,
      return: "personSelector",
      returnPath: window.location.pathname,
    });
    window.location.href = `${createPageUrl("CustomerRegistration")}?${params.toString()}`;
  };

  return (
    <>
      {!selectedPerson ? (
        <div className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(event) => onValueChange?.(event.target.value)}
            placeholder={inputPlaceholder}
            className="h-8 w-full text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onOpenChange?.(true)}
            title={title}
            aria-label={title}
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-8 shrink-0 gap-1 text-xs text-blue-900"
            onClick={handleRegister}
            title={registrationLabel}
          >
            <Plus className="w-3.5 h-3.5" />
            {registrationLabel}
          </Button>
        </div>
      ) : (
        <div
          className="flex items-center justify-between p-3 rounded-lg"
          style={{
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
          }}
        >
          <div>
            <p className="font-semibold text-sm text-green-700">
              {selectedPerson.name}
            </p>
            <p className="text-xs text-gray-600">
              {selectedPerson.address?.street || "Endereço não informado"}
              {selectedPerson.address?.number
                ? `, ${selectedPerson.address.number}`
                : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="text-red-500"
            title="Limpar seleção"
            aria-label="Limpar seleção"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-900">
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                autoFocus
                value={value}
                onChange={(event) => onValueChange?.(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 pl-9"
              />
            </div>
            <div className="max-h-80 overflow-auto border rounded">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="text-xs">Código</TableHead>
                    <TableHead className="text-xs">Nome</TableHead>
                    {showType && (
                      <TableHead className="text-xs">Tipo</TableHead>
                    )}
                    <TableHead className="text-xs">Telefone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={showType ? 4 : 3}
                        className="py-8 text-center text-sm text-slate-500"
                      >
                        Pesquisando...
                      </TableCell>
                    </TableRow>
                  ) : filteredOptions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={showType ? 4 : 3}
                        className="py-8 text-center text-sm text-slate-500"
                      >
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOptions.map((person) => (
                      <TableRow
                        key={person.id}
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => {
                          onSelect?.(person);
                          onOpenChange?.(false);
                        }}
                      >
                        <TableCell className="text-xs font-mono">
                          {person.personNumber || person.id?.slice(-6) || "-"}
                        </TableCell>
                        <TableCell className="text-xs">{person.name}</TableCell>
                        {showType && (
                          <TableCell className="text-xs">
                            {getPersonType(person)}
                          </TableCell>
                        )}
                        <TableCell className="text-xs">
                          {person.phone?.[0] || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-slate-500">
              Clique em uma pessoa para selecionar
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="gap-1 text-blue-900"
              onClick={handleRegister}
            >
              <Plus className="w-4 h-4" />
              {registrationLabel}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange?.(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
