import { Injectable, NotFoundException } from "@nestjs/common";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import {
  sales,
  saleItems,
  productStocks,
  vasilhameLoans,
  productPickups,
  accountsReceivables,
  cashAccounts,
  cashMovements,
  financialGroups,
  VasilhameLoanStatusEnum,
  ProductPickupStatusEnum,
  FinancialGroupTypeEnum,
  AccountsReceivableStatusEnum,
  CashMovementTypeEnum,
  orders,
  OrdersStatusEnum,
  ImmediatePaymentTypesType,
  PaymentTypesTypeEnum,
  paymentTypes,
  productStockMovements,
  StockMovementTypeEnum,
} from "../../database/schemas";
import { SalesCreateDto } from "./dto/sales.post.dto";
import { SalesUpdateDto } from "./dto/sales.update.dto";
import { eq, and, desc, sql } from "drizzle-orm";

@Injectable()
export class SalesService extends BaseCrudService<typeof sales> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, sales, true); // hasCompanyId = true
  }

  async completeCreate(
    data: SalesCreateDto,
    userId: string,
    userName: string,
    companyId: string,
    companyName: string,
  ) {
    const db = this.requestContext.getDb();
    if (!db) throw new Error("DB not available");

    // Validar se o total de pagamentos corresponde ao valor total da venda
    const totalPayment = data.paymentMethods
      ? data.paymentMethods.reduce((sum, pm) => sum + Number(pm.amount), 0)
      : 0;

    if (Math.abs(totalPayment - data.totalAmount) > 0.01) {
      throw new Error(
        "O total de pagamentos não corresponde ao valor total da venda",
      );
    }

    // Valida se os paymentTypes existem e se os pagamentos imediatos possuem cashAccountId válido
    const existingPaymentTypes = await db
      .select()
      .from(paymentTypes)
      .where(
        and(
          ...data.paymentMethods.map((pm) =>
            eq(paymentTypes.id, pm.paymentTypeId),
          ),
        ),
      );

    // Verifica se todos os paymentTypes fornecidos existem
    for (const pm of data.paymentMethods) {
      const foundType = existingPaymentTypes.find(
        (pt) => pt.id === pm.paymentTypeId,
      );
      if (!foundType) {
        throw new Error(
          `Tipo de pagamento não encontrado: ${pm.paymentTypeId}`,
        );
      }
      if (ImmediatePaymentTypesType.includes(foundType.type)) {
        if (!pm.cashAccountId) {
          throw new Error(
            `Pagamento do tipo ${foundType.type} requer uma conta de caixa (cashAccountId)`,
          );
        }
        const ca = await db
          .select()
          .from(cashAccounts)
          .where(eq(cashAccounts.id, pm.cashAccountId))
          .limit(1);
        if (!ca.length) {
          throw new Error(
            `Conta de caixa não encontrada para o pagamento: ${pm.paymentTypeName}`,
          );
        }
      }
    }

    // Valida se as cashAccounts existem
    for (const payment of data.paymentMethods) {
      const paymentType = existingPaymentTypes.find(
        (pt) => pt.id === payment.paymentTypeId,
      );
      if (
        ImmediatePaymentTypesType.includes(
          paymentType?.type as PaymentTypesTypeEnum,
        )
      ) {
        const ca = await db
          .select()
          .from(cashAccounts)
          .where(eq(cashAccounts.id, payment.cashAccountId))
          .limit(1);
        if (!ca.length) {
          throw new Error(
            `Conta de caixa não encontrada para o pagamento: ${payment.paymentTypeName}`,
          );
        }
      } else {
        // Garantir que a soma das parcelas corresponda ao valor total do pagamento
        const installmentsTotal = payment.installmentsDetails
          ? payment.installmentsDetails.reduce(
              (sum, inst) => sum + Number(inst.amount),
              0,
            )
          : 0;

        if (Math.abs(installmentsTotal - payment.amount) > 0.01) {
          throw new Error(
            `O total das parcelas (${installmentsTotal}) não corresponde ao valor do pagamento (${payment.amount}) para o tipo de pagamento ${payment.paymentTypeName}`,
          );
        }
      }
    }

    // 1. Gerar numero da venda
    const allSales = await db
      .select()
      .from(sales)
      .where(eq(sales.companyId, companyId))
      .orderBy(desc(sales.createdAt));
    const maxSaleNumber = allSales.reduce((max, sale) => {
      const currentNum = parseInt(sale.saleNumber, 10);
      return !isNaN(currentNum) && currentNum > max ? currentNum : max;
    }, 0);

    const newSaleNumber = String(maxSaleNumber + 1);

    // 2. Criar a venda
    const [savedSale] = await db
      .insert(sales)
      .values({
        ...data,
        saleNumber: newSaleNumber,
        companyId,
        companyName,
        createdByName: userName,
      })
      .returning();

    if (data.orderId) {
      await db.update(orders).set({
        status: OrdersStatusEnum.FINALIZADO,
        finalizedAt: new Date(),
      });
    }

    // Insert into saleItems table
    if (data.items && data.items.length > 0) {
      await db.insert(saleItems).values(
        data.items.map((item) => ({
          saleId: savedSale.id,
          ...item,
          companyId,
          companyName,
        })),
      );
    }

    // 3. Processar ESTOQUE
    for (const item of data.items) {
      try {
        await db
          .insert(productStocks)
          .values({
            productId: item.productId,
            productName: item.productName,
            sectorId: data.sectorId,
            sectorName: data.sectorName,
            quantity: -item.quantity,
            initialDate: new Date(),
            companyId,
            companyName,
            createdByName: userName,
          })
          .onConflictDoUpdate({
            target: [productStocks.productId, productStocks.sectorId],
            set: {
              quantity: sql`${productStocks.quantity} - ${item.quantity}`,
            },
          });
        await db.insert(productStockMovements).values({
          type: StockMovementTypeEnum.Sale,
          productId: item.productId,
          productName: item.productName,
          sectorId: data.sectorId,
          sectorName: data.sectorName,
          saleId: savedSale.id,
          quantity: -item.quantity,
          previousBalance: sql`SELECT COALESCE(quantity, 0) FROM productStocks WHERE product_id = ${item.productId} AND sector_id = ${data.sectorId}`,
          newBalance: sql`SELECT COALESCE(quantity, 0) - ${item.quantity} from productStocks WHERE product_id = ${item.productId} AND sector_id = ${data.sectorId}`,
          movementDate: new Date(),
          companyId,
          companyName: savedSale.companyName,
        });
      } catch (error: any) {
        throw new Error(
          `Erro ao processar estoque do produto ${item.productName} (${item.productId}) no setor ${data.sectorName}: ${
            error?.message || "erro de banco de dados"
          }`,
        );
      }
    }

    const vasilhameLoansToInsert = data.items.filter(
      (i) => i.vasilhameLoanQuantity > 0 && i.vasilhameId,
    );
    if (vasilhameLoansToInsert.length > 0) {
      await db.insert(vasilhameLoans).values([
        ...vasilhameLoansToInsert.map((item) => ({
          saleId: savedSale.id,
          personId: data.personId,
          personName: data.personName,
          vasilhameId: item.vasilhameId,
          vasilhameName: item.vasilhameName,
          sectorId: data.sectorId,
          sectorName: data.sectorName,
          loanQuantity: item.vasilhameLoanQuantity,
          returnedQuantity: 0,
          loanDate: new Date(data.saleDate),
          status: VasilhameLoanStatusEnum.PENDENTE,
          companyId,
          companyName,
          createdByName: userName,
        })),
      ]);
    }

    const lateTakes = data.items.filter((i) => i.quantityToPickup > 0);
    if (lateTakes.length > 0) {
      await db.insert(productPickups).values([
        ...lateTakes.map((item) => ({
          saleId: savedSale.id,
          personId: data.personId,
          personName: data.personName,
          productId: item.productId,
          productName: item.productName,
          pickupQuantity: item.quantityToPickup,
          saleDate: new Date(data.saleDate),
          companyId,
          companyName,
          createdByName: userName,
          status: ProductPickupStatusEnum.PENDENTE,
        })),
      ]);
    }

    // 5. Processar FINANCEIRO
    let [revenueGroup] = await db
      .insert(financialGroups)
      .values({
        name: "Receitas de Vendas",
        type: FinancialGroupTypeEnum.RECEITA,
        active: true,
        companyId,
        companyName,
        createdByName: userName,
      })
      .onConflictDoNothing()
      .returning();

    const salePaymentMethods = data.paymentMethods;

    for (const payment of salePaymentMethods) {
      const paymentType = existingPaymentTypes.find(
        (pt) => pt.id === payment.paymentTypeId,
      );
      const isImmediate = ImmediatePaymentTypesType.includes(
        paymentType?.type as PaymentTypesTypeEnum,
      );

      // Pagamentos imediatos afetam o caixa na hora, então já lançamos o movimento financeiro e atualizamos o saldo da conta
      if (isImmediate && payment.cashAccountId) {
        await db
          .update(cashAccounts)
          .set({
            balance: sql`${cashAccounts.balance} + ${payment.amount}`,
          })
          .where(eq(cashAccounts.id, payment.cashAccountId));

        // Criar movimento financeiro (COM saleId)
        await db.insert(cashMovements).values({
          cashAccountId: payment.cashAccountId,
          cashAccountName: sql`(SELECT name FROM "cashAccounts" WHERE id = ${payment.cashAccountId})`,
          type: CashMovementTypeEnum.RECEITA,
          description: `Recebimento Venda #${newSaleNumber}`,
          amount: payment.amount,
          movementDate: new Date(data.saleDate),
          personId: data.personId,
          personName: data.personName,
          groupId: revenueGroup?.id,
          groupName: revenueGroup?.name,
          saleId: savedSale.id, // Vinculo forte!
          companyId,
          companyName,
          createdByName: userName,
          sectorId: data.sectorId,
          sectorName: data.sectorName,
          active: true,
        });
      } else {
        // Contas a Receber
        const targetPersonId =
          payment.paymentTypeName === "convenio"
            ? data.conveniadaId
            : data.personId;
        const targetPersonName =
          payment.paymentTypeName === "convenio"
            ? data.conveniadaName
            : data.personName;

        await db.insert(accountsReceivables).values([
          ...payment.installmentsDetails.map((inst) => ({
            saleId: savedSale.id,
            personId: targetPersonId,
            personName: targetPersonName,
            installmentNumber: inst.number,
            dueDate: new Date(inst.dueDate),
            amount: inst.amount,
            status: AccountsReceivableStatusEnum.PENDENTE,
            paymentTypeId: payment.paymentTypeId, // NEW: save the payment type id
            companyId,
            companyName,
            createdByName: userName,
            description: `Pagamento a prazo para a venda #${newSaleNumber} - Tipo de pagamento: ${payment.paymentTypeName}`,
            active: true,
          })),
        ]);
      }
    }

    return savedSale;
  }

  // Lógica COMPLETA de atualização de venda
  async completeUpdate(
    id: string,
    data: SalesUpdateDto,
    userId: string,
    userName: string,
    companyId: string,
    companyName: string,
  ) {
    const db = this.requestContext.getDb();
    if (!db) throw new Error("DB not available");

    // 1. Encontrar venda antiga
    const oldSales = await db
      .select()
      .from(sales)
      .where(eq(sales.id, id))
      .limit(1);
    if (oldSales.length === 0)
      throw new NotFoundException("Venda não encontrada");
    const oldSale = oldSales[0];

    // Não pode atualizar vendas com data superior a 60 dias
    if (
      oldSale.saleDate! <
      new Date(new Date().getTime() - 60 * 24 * 60 * 60 * 1000)
    ) {
      throw new Error("Venda não encontrada ou fora do prazo para atualização");
    }

    // 2. REVERTER TODOS OS LANÇAMENTOS ANTIGOS
    // a. Reverter estoque
    for (const item of oldSale.items || []) {
      const stocks = await db
        .select()
        .from(productStocks)
        .where(
          and(
            eq(productStocks.productId, item.productId!),
            eq(productStocks.sectorId, oldSale.sectorId!),
            eq(productStocks.companyId, companyId),
          ),
        );
      if (stocks.length > 0) {
        const newQty = (stocks[0].quantity || 0) + item.quantity!;
        await db
          .update(productStocks)
          .set({ quantity: newQty })
          .where(eq(productStocks.id, stocks[0].id));
      }
    }

    // b. Excluir/reverter financeiros usando saleId!
    const movements = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.saleId, id));
    for (const mov of movements) {
      const ca = await db
        .select()
        .from(cashAccounts)
        .where(eq(cashAccounts.id, mov.cashAccountId))
        .limit(1);
      if (ca.length > 0) {
        const newBal = (ca[0].balance || 0) - Number(mov.amount);
        await db
          .update(cashAccounts)
          .set({ balance: newBal })
          .where(eq(cashAccounts.id, ca[0].id));
      }
      await db.delete(cashMovements).where(eq(cashMovements.id, mov.id));
    }

    // c. Excluir contas a receber, vasilhames, pickups, saleItems
    await db
      .delete(accountsReceivables)
      .where(eq(accountsReceivables.saleId, id));
    await db.delete(vasilhameLoans).where(eq(vasilhameLoans.saleId, id));
    await db.delete(productPickups).where(eq(productPickups.saleId, id));
    await db.delete(saleItems).where(eq(saleItems.saleId, id));

    // 3. ATUALIZAR VENDA
    const [updatedSale] = await db
      .update(sales)
      .set({
        ...data,
      })
      .where(eq(sales.id, id))
      .returning();

    // Insert new saleItems
    if (data.items && data.items.length > 0) {
      await db.insert(saleItems).values(
        data.items.map((item) => ({
          saleId: updatedSale.id,
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
          companyId,
          companyName,
        })),
      );
    }

    // 4. REPROCESSAR TUDO com os novos dados
    // (mesma lógica do create, reutilizando o id da venda existente)
    for (const item of data.items || []) {
      const stocks = await db
        .select()
        .from(productStocks)
        .where(
          and(
            eq(productStocks.productId, item.productId),
            eq(productStocks.sectorId, data.sectorId!),
            eq(productStocks.companyId, companyId),
          ),
        );
      if (stocks.length > 0) {
        const newQty = (stocks[0].quantity || 0) - item.quantity;
        await db
          .update(productStocks)
          .set({ quantity: newQty })
          .where(eq(productStocks.id, stocks[0].id));
      } else {
        await db.insert(productStocks).values({
          productId: item.productId!,
          productName: item.productName,
          sectorId: data.sectorId!,
          sectorName: data.sectorName,
          quantity: -item.quantity!,
          initialDate: new Date(),
          companyId,
          companyName,
          createdByName: userName,
        });
      }
    }

    for (const item of data.items || []) {
      if (item.vasilhameLoanQuantity > 0 && item.vasilhameId) {
        await db.insert(vasilhameLoans).values({
          saleId: oldSale.id,
          personId: data.personId!,
          personName: data.personName!,
          vasilhameId: item.vasilhameId,
          vasilhameName: item.vasilhameName,
          sectorId: data.sectorId,
          sectorName: data.sectorName,
          loanQuantity: item.vasilhameLoanQuantity,
          returnedQuantity: 0,
          loanDate: new Date(data.saleDate!),
          status: VasilhameLoanStatusEnum.PENDENTE,
          companyId,
          companyName,
          createdByName: userName,
        });
      }
      if (item.quantityToPickup > 0) {
        await db.insert(productPickups).values({
          saleId: oldSale.id,
          personId: data.personId!,
          personName: data.personName!,
          productId: item.productId!,
          productName: item.productName,
          pickupQuantity: item.quantityToPickup,
          saleDate: new Date(data.saleDate!),
          companyId,
          companyName,
          createdByName: userName,
          status: ProductPickupStatusEnum.PENDENTE,
        });
      }
    }

    let [revenueGroup] = await db
      .select()
      .from(financialGroups)
      .where(
        and(
          eq(financialGroups.name, "Receitas de Vendas"),
          eq(financialGroups.type, FinancialGroupTypeEnum.RECEITA),
          eq(financialGroups.companyId, companyId),
        ),
      );
    if (!revenueGroup) {
      [revenueGroup] = await db
        .insert(financialGroups)
        .values({
          name: "Receitas de Vendas",
          type: FinancialGroupTypeEnum.RECEITA,
          active: true,
          companyId,
          companyName,
          createdByName: userName,
        })
        .returning();
    }

    const paymentTypes = data.paymentMethods;
    if (!paymentTypes) return updatedSale;

    for (const payment of paymentTypes) {
      const isImmediate = ["dinheiro", "pix", "cartao_debito"].includes(
        payment.paymentTypeName!,
      );
      if (isImmediate && payment.cashAccountId) {
        const cashAccount = await db
          .select()
          .from(cashAccounts)
          .where(eq(cashAccounts.id, payment.cashAccountId))
          .limit(1);
        if (cashAccount.length > 0) {
          const newBalance =
            (cashAccount[0].balance || 0) + Number(payment.amount);
          await db
            .update(cashAccounts)
            .set({ balance: newBalance })
            .where(eq(cashAccounts.id, cashAccount[0].id));

          await db.insert(cashMovements).values({
            cashAccountId: payment.cashAccountId,
            cashAccountName: cashAccount[0].name,
            type: CashMovementTypeEnum.RECEITA,
            description: `Recebimento Venda #${data.saleNumber}`,
            amount: payment.amount,
            movementDate: new Date(data.saleDate!),
            personId: data.personId,
            personName: data.personName,
            groupId: revenueGroup.id,
            groupName: revenueGroup.name,
            saleId: id,
            companyId,
            companyName,
            createdByName: userName,
            sectorId: data.sectorId,
            sectorName: data.sectorName,
          });
        }
      } else {
        if (payment.installmentsDetails) {
          for (const inst of payment.installmentsDetails) {
            const targetPersonId =
              payment.paymentTypeName === "convenio"
                ? data.conveniadaId
                : data.personId;
            const targetPersonName =
              payment.paymentTypeName === "convenio"
                ? data.conveniadaName
                : data.personName;
            await db.insert(accountsReceivables).values({
              saleId: id,
              personId: targetPersonId!,
              personName: targetPersonName,
              installmentNumber: inst.number,
              dueDate: new Date(inst.dueDate),
              amount: inst.amount,
              status: AccountsReceivableStatusEnum.PENDENTE,
              paymentTypeId: payment.paymentTypeId, // NEW: save payment type id here too
              companyId,
              companyName,
              createdByName: userName,
            });
          }
        }
      }
    }

    await db.execute(sql`CALL rebuild_all_stock_movement_history()`);

    return updatedSale;
  }
}
