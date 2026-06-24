import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { sales, saleItems } from "./src/database/schemas";
import { eq, sql } from "drizzle-orm";

dotenv.config();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found in environment variables");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("Starting data migration from sales.items to saleItems...");

  try {
    // Step 1: Get all sales that have items
    const allSales = await db.select().from(sales);
    console.log(`Found ${allSales.length} sales to process`);

    let totalItemsMigrated = 0;

    for (const sale of allSales) {
      if (sale.items && Array.isArray(sale.items)) {
        for (const item of sale.items) {
          await db.insert(saleItems).values({
            saleId: sale.id,
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            category: item.category,
            vasilhameId: item.vasilhameId,
            vasilhameName: item.vasilhameName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
            quantityToPickup: item.quantityToPickup,
            vasilhameLoanQuantity: item.vasilhameLoanQuantity,
            companyId: sale.companyId,
            companyName: sale.companyName,
          });
          totalItemsMigrated++;
        }
      }
    }

    // Step 2: Verify migration count
    const saleItemsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(saleItems);

    console.log(`Data migration completed!`);
    console.log(`Total items migrated: ${totalItemsMigrated}`);
    console.log(`Total items in saleItems: ${saleItemsCount[0].count}`);

    if (totalItemsMigrated === saleItemsCount[0].count) {
      console.log("✅ Migration count matches!");
    } else {
      console.warn("⚠️ Warning: Migration count does NOT match!");
    }
  } catch (error) {
    console.error("Error during data migration:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
