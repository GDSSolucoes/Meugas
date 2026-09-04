import { customType } from "drizzle-orm/pg-core";

/** Parses legacy date-only inputs without interpreting them in local time. */
export function parseDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("Invalid date-only value");
    }

    return new Date(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    );
  }

  const datePart = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    throw new Error("Date-only value must use YYYY-MM-DD format");
  }

  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** PostgreSQL date represented as YYYY-MM-DD, never as a JavaScript Date. */
export const dateOnly = customType<{
  data: Date;
  driverData: string | Date;
}>({
  dataType: () => "date",
  fromDriver: (value) => value as unknown as Date,
  toDriver: (value) =>
    value instanceof Date
      ? value.toISOString().slice(0, 10)
      : parseDateOnly(value).toISOString().slice(0, 10),
});
