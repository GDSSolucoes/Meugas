import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDateOnly(
  value: string | Date | null | undefined,
  pattern = "dd/MM/yyyy",
) {
  const datePart =
    value instanceof Date
      ? [
          value.getFullYear(),
          String(value.getMonth() + 1).padStart(2, "0"),
          String(value.getDate()).padStart(2, "0"),
        ].join("-")
      : (value || "").slice(0, 10);
  if (!datePart) {
    return "";
  }
  return format(parseISO(datePart), pattern, { locale: ptBR });
}

export const formatSaleDate = formatDateOnly;
