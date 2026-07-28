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
import {
  eq,
  and,
  inArray,
  gte,
  lte,
  lt,
  isNotNull,
  sql,
  desc,
} from "drizzle-orm";
import { startOfDay, endOfDay, isBefore, parseISO } from "date-fns";

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
    const reportStart = new Date(year, month-1, day, 0, 0, 0, 0);
    const reportEnd = new Date(year, month-1, day, 23, 59, 59, 999);

    

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
      .where(
        and(eq(products.companyId, companyId), eq(products.active, true)),
      );

    // Buscar estoques iniciais (productStocks) relevantes
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
    const movementsBeforeReport = await db
      .select()
      .from(productStockMovements)
      .where(
        and(
          eq(productStockMovements.companyId, companyId),
          inArray(productStockMovements.sectorId, relevantSectorIds),
          lt(productStockMovements.movementDate, reportStart),
        ),
      );

    // Buscar movimentações DURANTE o dia do relatório
    const movementsInReport = await db
      .select()
      .from(productStockMovements)
      .where(
        and(
          eq(productStockMovements.companyId, companyId),
          inArray(productStockMovements.sectorId, relevantSectorIds),
          gte(productStockMovements.movementDate, reportStart),
          lte(productStockMovements.movementDate, reportEnd),
        ),
      );

    // Buscar empréstimos de vasilhame (loanDate no dia) para qtdeEmprestimos
    const loansInDay = await db
      .select()
      .from(vasilhameLoans)
      .where(
        and(
          eq(vasilhameLoans.companyId, companyId),
          inArray(vasilhameLoans.sectorId, relevantSectorIds),
          gte(vasilhameLoans.loanDate, reportStart),
          lte(vasilhameLoans.loanDate, reportEnd),
        ),
      );

    // Buscar devoluções de vasilhame (returnDate no dia) para qtdeDevolucoes
    const returnsInDay = await db
      .select()
      .from(vasilhameLoans)
      .where(
        and(
          eq(vasilhameLoans.companyId, companyId),
          inArray(vasilhameLoans.sectorId, relevantSectorIds),
          isNotNull(vasilhameLoans.returnDate),
          gte(vasilhameLoans.returnDate, reportStart),
          lte(vasilhameLoans.returnDate, reportEnd),
        ),
      );

    // Buscar retiradas de produtos (productPickups) - solicitadas no dia (saleDate) para qtdeARetirar
    const pickupsRegisteredDay = await db
      .select()
      .from(productPickups)
      .where(
        and(
          eq(productPickups.companyId, companyId),
          inArray(productPickups.sectorId, relevantSectorIds),
          gte(productPickups.saleDate, reportStart),
          lte(productPickups.saleDate, reportEnd),
        ),
      );

    // Buscar retiradas efetivadas (collectedDate no dia) para qtdeRetirada
    const pickupsCollectedDay = await db
      .select()
      .from(productPickups)
      .where(
        and(
          eq(productPickups.companyId, companyId),
          inArray(productPickups.sectorId, relevantSectorIds),
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
          .filter((l) => l.vasilhameId === productId)
          .reduce((sum, l) => sum + Number(l.loanQuantity || 0), 0);

        // 4. Devoluções de vasilhame no dia
        const qtdeDevolucoes = returnsInDay
          .filter((l) => l.vasilhameId === productId)
          .reduce((sum, l) => sum + Number(l.returnedQuantity || 0), 0);

        // 5. Quantidade a Retirar (productPickups criados no dia)
        const qtdeARetirar = pickupsRegisteredDay
          .filter((p) => p.productId === productId)
          .reduce((sum, p) => sum + Number(p.pickupQuantity || 0), 0);

        // 6. Quantidade Retirada (productPickups coletados no dia)
        const qtdeRetirada = pickupsCollectedDay
          .filter((p) => p.productId === productId)
          .reduce((sum, p) => sum + Number(p.collectedQuantity || 0), 0);

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
