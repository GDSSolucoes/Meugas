import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatSaleDate(value: string | null | undefined) {
  const datePart = (value || "").slice(0, 10);
  if (!datePart) {
    return "";
  }

  return format(new Date(datePart.replace(/-/g, "/")), "dd/MM/yyyy", {
    locale: ptBR,
  });
}
