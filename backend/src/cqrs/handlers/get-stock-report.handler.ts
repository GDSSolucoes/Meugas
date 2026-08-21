import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetStockReportQuery } from "../queries/get-stock-report.query";
import { RequestContextService } from "../../database/request-context.service";
import {
  products,
  sectors,
  productStocks,
  productStockMovements,
  vasilhameLoans,
  productPickups,
  StockMovementTypeEnum,
} from "../../database/schemas";
import { eq, and, inArray, gte, lte, lt, isNotNull, sql } from "drizzle-orm";

@QueryHandler(GetStockReportQuery)
export class GetStockReportHandler implements IQueryHandler<GetStockReportQuery> {
  constructor(private readonly requestContext: RequestContextService) {}

  async execute(query: GetStockReportQuery): Promise<any[]> {
    const db = this.requestContext.getDb();
    if (!db) throw new Error("DB not available");

    const { sectorId, reportDate, companyId } = query;

    // Parse date correctly: assume yyyy-MM-dd is local date, create local datetime
    // Manually parse to avoid timezone shifts from new Date() on date-only string
    const [year, month, day] = reportDate.split("-").map(Number);
    const reportStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const reportEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Decodificar o filtro para saber se é setor normal ou master
    const [filterType, filterId] = sectorId.split(":");
    let relevantSectorIds: string[] = [];

    if (filterType === "sector") {
      relevantSectorIds = [filterId];
    } else if (filterType === "master") {
      const allSectors = await db
        .select()
        .from(sectors)
        .where(
          and(
            eq(sectors.companyId, companyId),
            eq(sectors.active, true),
            eq(sectors.masterSectorId, filterId),
          ),
        );
      relevantSectorIds = allSectors.map((s) => s.id);
    }
    if (relevantSectorIds.length === 0) {
      return [];
    }

    // Buscar todos os produtos
    const allProducts = await db
      .select()
      .from(products)
      .where(and(eq(products.companyId, companyId), eq(products.active, true)));

    // ProductStocks stores only sectors that own their stock.
    const relevantStocks = await db
      .select()
      .from(productStocks)
      .where(
        and(
          eq(productStocks.companyId, companyId),
          inArray(productStocks.sectorId, relevantSectorIds),
        ),
      );

    // Buscar movimentações relevantes (anteriores à data do relatório) para cálculo do saldo inicial
    // Movements before report filtered by ownerSectorId
    const movementsBeforeReport = await db
      .select()
      .from(productStockMovements)
      .where(
        and(
          eq(productStockMovements.companyId, companyId),
          inArray(productStockMovements.ownerSectorId, relevantSectorIds),
          lt(productStockMovements.movementDate, reportStart),
        ),
      );

    // Buscar movimentações DURANTE o dia do relatório
    // Movements during the report day filtered by ownerSectorId
    const movementsInReport = await db
      .select()
      .from(productStockMovements)
      .where(
        and(
          eq(productStockMovements.companyId, companyId),
          inArray(productStockMovements.ownerSectorId, relevantSectorIds),
          gte(productStockMovements.movementDate, reportStart),
          lte(productStockMovements.movementDate, reportEnd),
        ),
      );

    // Buscar empréstimos de vasilhame (loanDate no dia) para qtdeEmprestimos
    // Loans: derive owner sector from loan.sectorId and filter by relevant owner sectors
    const loansInDay = await db
      .select()
      .from(vasilhameLoans)
      .leftJoin(sectors, eq(sectors.id, vasilhameLoans.sectorId))
      .where(
        and(
          eq(vasilhameLoans.companyId, companyId),
          inArray(
            sql`CASE WHEN ${sectors.isOwnStock} THEN ${sectors.id} ELSE ${sectors.masterSectorId} END`,
            relevantSectorIds,
          ),
          gte(vasilhameLoans.loanDate, reportStart),
          lte(vasilhameLoans.loanDate, reportEnd),
        ),
      );

    // Buscar devoluções de vasilhame (returnDate no dia) para qtdeDevolucoes
    const returnsInDay = await db
      .select()
      .from(vasilhameLoans)
      .leftJoin(sectors, eq(sectors.id, vasilhameLoans.sectorId))
      .where(
        and(
          eq(vasilhameLoans.companyId, companyId),
          inArray(
            sql`CASE WHEN ${sectors.isOwnStock} THEN ${sectors.id} ELSE ${sectors.masterSectorId} END`,
            relevantSectorIds,
          ),
          isNotNull(vasilhameLoans.returnDate),
          gte(vasilhameLoans.returnDate, reportStart),
          lte(vasilhameLoans.returnDate, reportEnd),
        ),
      );

    // Buscar retiradas de produtos (productPickups) - solicitadas no dia (saleDate) para qtdeARetirar
    const pickupsRegisteredDay = await db
      .select()
      .from(productPickups)
      .leftJoin(sectors, eq(sectors.id, productPickups.sectorId))
      .where(
        and(
          eq(productPickups.companyId, companyId),
          inArray(
            sql`CASE WHEN ${sectors.isOwnStock} THEN ${sectors.id} ELSE ${sectors.masterSectorId} END`,
            relevantSectorIds,
          ),
          gte(productPickups.saleDate, reportStart),
          lte(productPickups.saleDate, reportEnd),
        ),
      );

    // Buscar retiradas efetivadas (collectedDate no dia) para qtdeRetirada
    const pickupsCollectedDay = await db
      .select()
      .from(productPickups)
      .leftJoin(sectors, eq(sectors.id, productPickups.sectorId))
      .where(
        and(
          eq(productPickups.companyId, companyId),
          inArray(
            sql`CASE WHEN ${sectors.isOwnStock} THEN ${sectors.id} ELSE ${sectors.masterSectorId} END`,
            relevantSectorIds,
          ),
          isNotNull(productPickups.collectedDate),
          gte(productPickups.collectedDate, reportStart),
          lte(productPickups.collectedDate, reportEnd),
        ),
      );

    // Agrupar tudo por produto
    const calculatedData = allProducts
      .map((product) => {
        const productId = product.id;

        // 1. Calcular ESTOQUE INICIAL (antes do dia do relatório)
        const stockRecords = relevantStocks.filter(
          (s) => s.productId === productId,
        );
        let initialStock = stockRecords.reduce(
          (sum, s) => sum + Number(s.quantity || 0),
          0,
        );

        // Ajustar com movimentações anteriores ao dia
        const movementsBefore = movementsBeforeReport.filter(
          (m) => m.productId === productId,
        );
        movementsBefore.forEach((m) => {
          initialStock += Number(m.quantity || 0);
        });

        // 2. Calcular movimentações DURANTE o dia usando productStockMovements
        const movementsDay = movementsInReport.filter(
          (m) => m.productId === productId,
        );

        let qtdeComprada = 0;
        let qtdeVendida = 0;
        let qtdeTransferidaEntrada = 0;
        let qtdeTransferidaSaida = 0;

        movementsDay.forEach((m) => {
          const qty = Number(m.quantity || 0);
          switch (m.type) {
            case StockMovementTypeEnum.Purchase:
              qtdeComprada += qty;
              break;
            case StockMovementTypeEnum.Sale:
              qtdeVendida += Math.abs(qty);
              break;
            case StockMovementTypeEnum.Transfer:
              if (qty > 0) qtdeTransferidaEntrada += qty;
              else qtdeTransferidaSaida += Math.abs(qty);
              break;
          }
        });

        // 3. Empréstimos de vasilhame no dia
        const qtdeEmprestimos = loansInDay
          .filter(
            (row) =>
              row.vasilhameLoans &&
              row.vasilhameLoans.vasilhameId === productId,
          )
          .reduce(
            (sum, row) => sum + Number(row.vasilhameLoans?.loanQuantity || 0),
            0,
          );

        // 4. Devoluções de vasilhame no dia
        const qtdeDevolucoes = returnsInDay
          .filter(
            (row) =>
              row.vasilhameLoans &&
              row.vasilhameLoans.vasilhameId === productId,
          )
          .reduce(
            (sum, row) =>
              sum + Number(row.vasilhameLoans?.returnedQuantity || 0),
            0,
          );

        // 5. Quantidade a Retirar (productPickups criados no dia)
        const qtdeARetirar = pickupsRegisteredDay
          .filter(
            (row) =>
              row.productPickups && row.productPickups.productId === productId,
          )
          .reduce(
            (sum, row) => sum + Number(row.productPickups?.pickupQuantity || 0),
            0,
          );

        // 6. Quantidade Retirada (productPickups coletados no dia)
        const qtdeRetirada = pickupsCollectedDay
          .filter(
            (row) =>
              row.productPickups && row.productPickups.productId === productId,
          )
          .reduce(
            (sum, row) =>
              sum + Number(row.productPickups?.collectedQuantity || 0),
            0,
          );

        // 7. Calcular saldo final
        const saldoFinal =
          initialStock +
          qtdeComprada -
          qtdeVendida +
          qtdeTransferidaEntrada -
          qtdeTransferidaSaida -
          qtdeEmprestimos +
          qtdeDevolucoes;

        // Apenas retornar se tiver saldo inicial ou alguma movimentação
        if (
          initialStock !== 0 ||
          qtdeComprada !== 0 ||
          qtdeVendida !== 0 ||
          qtdeTransferidaEntrada !== 0 ||
          qtdeTransferidaSaida !== 0 ||
          qtdeEmprestimos !== 0 ||
          qtdeDevolucoes !== 0 ||
          qtdeARetirar !== 0 ||
          qtdeRetirada !== 0
        ) {
          return {
            productId,
            productName: product.name,
            estoqueInicial: initialStock,
            qtdeComprada,
            qtdeVendida,
            qtdeTransferidaEntrada,
            qtdeTransferidaSaida,
            qtdeEmprestimos,
            qtdeDevolucoes,
            qtdeARetirar,
            qtdeRetirada,
            saldoFinal,
          };
        }
        return null;
      })
      .filter(Boolean);

    return calculatedData;
  }
}
