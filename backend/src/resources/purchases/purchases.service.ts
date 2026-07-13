import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { purchases, purchaseItems, productStocks, productStockMovements, StockMovementTypeEnum } from '../../database/schemas'
import { PurchasEsCreateDto } from './dto/purchases.post.dto'
import { PurchasEsUpdateDto } from './dto/purchases.update.dto'
import { eq, sql } from 'drizzle-orm'

@Injectable()
export class PurchasEsesService extends BaseCrudService<typeof purchases> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, purchases, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: PurchasEsCreateDto) {
    const db = this.getDb()
    const companyId = this.requestContext.getCompanyId()
    
    if (!companyId) {
      throw new Error("Não foi possível encontrar a empresa no contexto da solicitação")
    }

    if (!data.items || data.items.length === 0) {
      throw new Error("É necessário informar os itens da compra")
    }

    if (data.items.filter((item) => item.productId).length > 0) {
      throw new Error("Todos os produtos adquiridos devem estar cadastrados previamente")
    }

    if(!data.sectorId){
      throw new Error("Obrigatório informar o setor")
    }

    const savedPurchase = await super.create(data) as any

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
      )
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
      await db.insert(productStockMovements).values(
        data.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          sectorId: data.sectorId,
          sectorName: data.sectorName,
          type: StockMovementTypeEnum.Purchase,
          purchaseId: savedPurchase.id,
          quantity: item.quantity,
          previousBalance: sql`SELECT quantity FROM productStocks WHERE product_id = ${item.productId} AND sector_id = ${data.sectorId}`,
          newBalance: sql`SELECT COALESCE(quantity, 0) + ${item.quantity} from productStocks WHERE product_id = ${item.productId} AND sector_id = ${data.sectorId}`,
          movementDate: new Date(),
          companyId,
          companyName: savedPurchase.companyName,
        })),
      )
    }

    return savedPurchase
  }

  async update(id: string, data: Partial<PurchasEsUpdateDto>) {
    const db = this.getDb()
    const companyId = this.requestContext.getCompanyId()

    if (!companyId) {
      throw new Error("Company ID not found in request context")
    }

    if (!data.items || data.items.length === 0) {
      throw new Error("É necessário informar os itens da compra")
    }

    if (data.items.filter((item) => item.productId).length > 0) {
      throw new Error("Todos os produtos adquiridos devem estar cadastrados previamente")
    }

    if(!data.sectorId){
      throw new Error("Obrigatório informar o setor")
    }

    var currentPurchase = await db.select().from(purchases).where(eq(purchases.id, id))
    // Só pode atualizar compras existentes e que tenham sido realizadas a menos de 60dias
    if (!currentPurchase || currentPurchase.length === 0 || (
      currentPurchase[0].createdAt! < new Date(new Date().getTime() - 60 * 24 * 60 * 60 * 1000)
    )){
      throw new Error("Compra não encontrada ou fora do prazo para atualização")
    }


    // First delete existing purchaseItems for this purchase
    await db.delete(purchaseItems).where(eq(purchaseItems.purchaseId, id))

    const updatedPurchase = await super.update(id, data) as any

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
      )

      // TODO: Recalcular estoque - para manutenção chamar a stored procedure rebuild_stock_movement_history
      await db.execute(sql`CALL rebuild_all_stock_movement_history()`)
    }

    return updatedPurchase
  }
}
