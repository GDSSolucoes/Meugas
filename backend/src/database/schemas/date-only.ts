import { customType } from "drizzle-orm/pg-core";

export function parseDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    );
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** PostgreSQL date without UTC conversion when exposed as a JavaScript Date. */
export const dateOnly = customType<{
  data: Date;
  driverData: string;
}>({
  dataType: () => "date",
  fromDriver: (value) => {
    return parseDateOnly(value);
  },
  toDriver: (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },
});
