import { Injectable } from "@nestjs/common";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import {
  purchases,
  purchaseItems,
  productStocks,
  productStockMovements,
  StockMovementTypeEnum,
  contasAPagar,
  cashMovements,
  cashAccounts,
  paymentTypes,
  ContasAPagarStatusEnum,
  CashMovementTypeEnum,
} from "../../database/schemas";
import { PurchasEsCreateDto } from "./dto/purchases.post.dto";
import { PurchasEsUpdateDto } from "./dto/purchases.update.dto";
import { eq, sql, desc, and } from "drizzle-orm";

@Injectable()
export class PurchasEsesService extends BaseCrudService<typeof purchases> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, purchases, true); // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: PurchasEsCreateDto) {
    const db = this.getDb();
    const companyId = this.requestContext.getCompanyId();

    if (!companyId) {
      throw new Error(
        "Não foi possível encontrar a empresa no contexto da solicitação",
      );
    }

    if (!data.items || data.items.length === 0) {
      throw new Error("É necessário informar os itens da compra");
    }

    if (data.items.filter((item) => !item.productId).length > 0) {
      throw new Error(
        "Todos os produtos adquiridos devem estar cadastrados previamente",
      );
    }

    if (!data.sectorId) {
      throw new Error("Obrigatório informar o setor");
    }

    // VALIDAÇÕES DE PAGAMENTO (ANTES de gravar qualquer informação)
    if (!data.paymentTypeId) {
      throw new Error("É necessário informar o tipo de pagamento");
    }

    const paymentTypeData = await db
      .select()
      .from(paymentTypes)
      .where(eq(paymentTypes.id, data.paymentTypeId))
      .limit(1);

    if (paymentTypeData.length === 0) {
      throw new Error("Tipo de pagamento não encontrado");
    }

    const isAPrazo = !["dinheiro", "pix", "cartao_debito"].includes(
      paymentTypeData[0].type,
    );

    if (isAPrazo) {
      // Validações para pagamento a prazo
      if (!data.installmentsDetails || data.installmentsDetails.length === 0) {
        throw new Error(
          "Para pagamentos a prazo é necessário informar as parcelas",
        );
      }
      if (!data.installments || data.installments === 0) {
        throw new Error(
          "Para pagamentos a prazo é necessário informar o número de parcelas",
        );
      }
    } else {
      // Validações para pagamento à vista
      if (!data.cashAccountId) {
        throw new Error(
          "Para compras à vista é obrigatório informar a conta de movimento",
        );
      }

      // Validar se a conta existe e pertence à empresa
      const cashAccountData = await db
        .select()
        .from(cashAccounts)
        .where(
          and(
            eq(cashAccounts.id, data.cashAccountId as any),
            eq(cashAccounts.companyId, companyId as any),
          ),
        )
        .limit(1);

      if (cashAccountData.length === 0) {
        throw new Error(
          "Conta de movimento não encontrada ou não pertence à sua empresa",
        );
      }

      // // Validar saldo disponível
      // const accountBalance = cashAccountData[0].balance ?? 0;
      // if (accountBalance < data.totalAmount) {
      //   throw new Error(
      //     `Saldo insuficiente. Saldo disponível: ${accountBalance}, Valor da compra: ${data.totalAmount}`,
      //   );
      // }
    }

    // VALIDAÇÕES CONCLUÍDAS - Agora pode gravar

    // Gerar invoiceNumber automaticamente se não informado
    if (!data.invoiceNumber || data.invoiceNumber.trim() === "") {
      const lastPurchase = await db
        .select({ invoiceNumber: purchases.invoiceNumber })
        .from(purchases)
        .orderBy(desc(purchases.createdAt))
        .limit(1);

      let nextNumber = 1;
      if (lastPurchase.length > 0) {
        const lastNum = parseInt(lastPurchase[0].invoiceNumber!, 10);
        nextNumber = !isNaN(lastNum) ? lastNum + 1 : 1;
      }
      data.invoiceNumber = String(nextNumber);
    }

    const savedPurchase = (await super.create(data)) as any;

    if (savedPurchase?.id) {
      // Inserir itens na purchaseItems
      await db.insert(purchaseItems).values(
        data.items.map((item) => ({
          purchaseId: savedPurchase.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          companyId,
          companyName: savedPurchase.companyName,
        })),
      );
      await db
        .insert(productStocks)
        .values(
          data.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            sectorId: data.sectorId,
            sectorName: data.sectorName,
            quantity: item.quantity,
            initialDate: new Date(),
            companyId,
            companyName: savedPurchase.companyName,
          })),
        )
        .onConflictDoUpdate({
          target: [productStocks.productId, productStocks.sectorId],
          set: {
            quantity: sql`${productStocks.quantity} + excluded.quantity`,
          },
        });

      // Inserir movimentações de estoque com saldos calculados
      for (const item of data.items) {
        // Obter saldo anterior do produto neste setor
        const currentStockResult = await db
          .select({ quantity: productStocks.quantity })
          .from(productStocks)
          .where(
            and(
              eq(productStocks.productId, item.productId),
              eq(productStocks.sectorId, data.sectorId),
            ),
          );

        const previousBalance = currentStockResult[0]?.quantity ?? 0;
        const newBalance = previousBalance + item.quantity;

        await db.insert(productStockMovements).values({
          productId: item.productId,
          productName: item.productName,
          sectorId: data.sectorId,
          sectorName: data.sectorName,
          type: StockMovementTypeEnum.Purchase,
          purchaseId: savedPurchase.id,
          quantity: item.quantity,
          previousBalance,
          newBalance,
          movementDate: new Date(),
          companyId,
          companyName: savedPurchase.companyName,
        });
      }

      // Processar pagamentos (já validado acima)
      if (
        isAPrazo &&
        data.installmentsDetails &&
        data.installmentsDetails.length > 0
      ) {
        // Registrar cada parcela em Contas a Pagar
        for (const installment of data.installmentsDetails) {
          await db.insert(contasAPagar).values({
            supplierId: savedPurchase.supplierId as any,
            supplierName: savedPurchase.supplierName,
            description: `Compra ${savedPurchase.invoiceNumber} - Parcela ${installment.number}/${data.installments}`,
            dueDate: new Date(installment.dueDate!),
            amount: installment.amount,
            status: ContasAPagarStatusEnum.ABERTO,
            paymentTypeId: data.paymentTypeId as any,
            paymentTypeName: data.paymentTypeName,
            installmentNumber: installment.number,
            purchaseId: savedPurchase.id as any,
            nfeNumber: data.nfeNumber || "",
            companyId: companyId as any,
            companyName: savedPurchase.companyName,
          } as any);
        }
      } else if (!isAPrazo) {
        // Pagamento à vista: criar CashMovement e atualizar saldo da conta
        // Criar CashMovement
        await db.insert(cashMovements).values({
          cashAccountId: data.cashAccountId! as any,
          cashAccountName: data.cashAccountName,
          type: CashMovementTypeEnum.DESPESA,
          amount: data.totalAmount,
          description: `Compra ${savedPurchase.invoiceNumber} - ${savedPurchase.supplierName}`,
          movementDate: new Date(),
          purchaseId: savedPurchase.id as any,
          companyId: companyId as any,
          companyName: savedPurchase.companyName,
        } as any);

        // Atualizar saldo da conta
        await db
          .update(cashAccounts)
          .set({
            balance: sql`${cashAccounts.balance} - ${data.totalAmount}`,
          })
          .where(eq(cashAccounts.id, data.cashAccountId! as any));
      }
    }

    return savedPurchase;
  }

  async update(id: string, data: Partial<PurchasEsUpdateDto>) {
    const db = this.getDb();
    const companyId = this.requestContext.getCompanyId();

    if (!companyId) {
      throw new Error("Company ID not found in request context");
    }

    if (!data.items || data.items.length === 0) {
      throw new Error("É necessário informar os itens da compra");
    }

    if (data.items.filter((item) => !item.productId).length > 0) {
      throw new Error(
        "Todos os produtos adquiridos devem estar cadastrados previamente",
      );
    }

    if (!data.sectorId) {
      throw new Error("Obrigatório informar o setor");
    }

    var currentPurchase = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, id));
    // Só pode atualizar compras existentes e que tenham sido realizadas a menos de 60dias
    if (
      !currentPurchase ||
      currentPurchase.length === 0 ||
      currentPurchase[0].createdAt! <
        new Date(new Date().getTime() - 60 * 24 * 60 * 60 * 1000)
    ) {
      throw new Error(
        "Compra não encontrada ou fora do prazo para atualização",
      );
    }

    // First delete existing purchaseItems for this purchase
    await db.delete(purchaseItems).where(eq(purchaseItems.purchaseId, id));

    const updatedPurchase = (await super.update(id, data)) as any;

    // Re-insert purchaseItems
    if (data.items && data.items.length > 0) {
      await db.insert(purchaseItems).values(
        data.items.map((item) => ({
          purchaseId: id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          companyId,
          companyName: updatedPurchase.companyName,
        })),
      );

      // TODO: Recalcular estoque - para manutenção chamar a stored procedure rebuild_stock_movement_history
      await db.execute(sql`CALL rebuild_all_stock_movement_history()`);
    }

    return updatedPurchase;
  }
}
