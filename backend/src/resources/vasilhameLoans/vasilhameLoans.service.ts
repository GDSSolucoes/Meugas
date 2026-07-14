import { Injectable } from "@nestjs/common";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import {
  vasilhameLoans,
  productStocks,
  productStockMovements,
  StockMovementTypeEnum,
} from "../../database/schemas";
import { VasilhameloanCreateDto } from "./dto/vasilhameloan.post.dto";
import { VasilhameloanUpdateDto } from "./dto/vasilhameloan.update.dto";
import { and, eq } from "drizzle-orm";

@Injectable()
export class VasilhameloansService extends BaseCrudService<
  typeof vasilhameLoans
> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, vasilhameLoans, true); // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: VasilhameloanCreateDto) {
    const db = this.getDb();
    const companyId = this.requestContext.getCompanyId();

    if (!companyId) {
      throw new Error(
        "Não foi possível encontrar a empresa no contexto da solicitação",
      );
    }

    if (!data.vasilhameId) {
      throw new Error("É necessário informar o vasilhame");
    }

    if (!data.loanQuantity || data.loanQuantity <= 0) {
      throw new Error("Quantidade de empréstimo deve ser maior que zero");
    }

    if (!data.sectorId) {
      throw new Error("É necessário informar o setor");
    }

    // Criar o registro de empréstimo
    const createdLoan = (await super.create(data)) as any;

    if (createdLoan?.id) {
      // Registrar movimentação de estoque: SAÍDA (quantidade negativa)
      // O vasilhame está sendo emprestado, portanto, sai do estoque

      // Obter saldo anterior do vasilhame neste setor
      const currentStockResult = await db
        .select({ quantity: productStocks.quantity })
        .from(productStocks)
        .where(
          and(
            eq(productStocks.productId, data.vasilhameId),
            eq(productStocks.sectorId, data.sectorId),
          ),
        );

      const previousBalance = currentStockResult[0]?.quantity ?? 0;
      const quantityToRemove = -data.loanQuantity; // Negativo porque é saída
      const newBalance = previousBalance + quantityToRemove;

      await db.insert(productStockMovements).values({
        productId: data.vasilhameId as any,
        productName: data.vasilhameName,
        sectorId: data.sectorId as any,
        sectorName: data.sectorName,
        type: StockMovementTypeEnum.Loan,
        vasilhameLoanId: createdLoan.id as any,
        quantity: quantityToRemove,
        previousBalance,
        newBalance,
        movementDate: new Date(),
        companyId: companyId as any,
        companyName: createdLoan.companyName,
      });

      // Atualizar o estoque do vasilhame
      await db
        .update(productStocks)
        .set({ quantity: newBalance })
        .where(
          and(
            eq(productStocks.productId, data.vasilhameId),
            eq(productStocks.sectorId, data.sectorId),
          ),
        );
    }

    return createdLoan;
  }

  async update(id: string, data: Partial<VasilhameloanUpdateDto>) {
    const db = this.getDb();
    const companyId = this.requestContext.getCompanyId();

    if (!companyId) {
      throw new Error("Company ID not found in request context");
    }

    // Obter o registro atual de empréstimo
    const currentLoan = await db
      .select()
      .from(vasilhameLoans)
      .where(eq(vasilhameLoans.id, id))
      .limit(1);

    if (!currentLoan || currentLoan.length === 0) {
      throw new Error("Empréstimo não encontrado");
    }

    const loan = currentLoan[0];
    const previousReturnedQuantity = loan.returnedQuantity ?? 0;
    const newReturnedQuantity =
      data.returnedQuantity ?? previousReturnedQuantity;

    // Se houve devolução (quantidade retornada aumentou), registrar movimentação
    if (newReturnedQuantity > previousReturnedQuantity) {
      const quantityReturned = newReturnedQuantity - previousReturnedQuantity;

      if (loan.sectorId) {
        // Registrar movimentação de estoque: ENTRADA (quantidade positiva)
        const currentStockResult = await db
          .select({ quantity: productStocks.quantity })
          .from(productStocks)
          .where(
            and(
              eq(productStocks.productId, loan.vasilhameId),
              eq(productStocks.sectorId, loan.sectorId),
            ),
          );

        const previousBalance = currentStockResult[0]?.quantity ?? 0;
        const newBalance = previousBalance + quantityReturned;

        await db.insert(productStockMovements).values({
          productId: loan.vasilhameId as any,
          productName: loan.vasilhameName,
          sectorId: loan.sectorId as any,
          sectorName: loan.sectorName,
          type: StockMovementTypeEnum.Loan,
          vasilhameLoanId: id as any,
          quantity: quantityReturned, // Positivo para entrada
          previousBalance,
          newBalance,
          movementDate: new Date(),
          companyId: companyId as any,
          companyName: loan.companyName,
        });

        // Atualizar o estoque do vasilhame
        await db
          .update(productStocks)
          .set({ quantity: newBalance })
          .where(
            and(
              eq(productStocks.productId, loan.vasilhameId),
              eq(productStocks.sectorId, loan.sectorId),
            ),
          );
      }
    }

    // Atualizar o registro de empréstimo
    const updatedLoan = await super.update(id, data);
    return updatedLoan;
  }
}
