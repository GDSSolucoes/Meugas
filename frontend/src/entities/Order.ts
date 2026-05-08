import { BaseEntity } from './BaseEntity';

export enum OrdersStatusEnum {
  PENDENTE = 'pendente',
  EM_ATENDIMENTO = 'em_atendimento',
  FINALIZADO = 'finalizado',
  CANCELADO = 'cancelado',
}

export interface OrderPersonAddress {
  street?: string;
  number?: string;
  neighborhood?: string;
  referencePoint?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

export interface OrderItemsItem {
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  total?: number;
}

export class Order extends BaseEntity {
  orderNumber!: string;
  personId!: string;
  personName?: string;
  personAddress?: OrderPersonAddress;
  employeeId?: string;
  employeeName?: string;
  paymentTypeId?: string;
  paymentTypeName?: string;
  cashAccountId?: string;
  cashAccountName?: string;
  status?: OrdersStatusEnum;
  items?: OrderItemsItem[];
  totalAmount?: number;
  deliveryDate?: Date;
  notes?: string;
  attendedAt?: Date;
  finalizedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  canal: string;
  urgente: boolean;
  convenio: boolean;
  static baseUrl: string = "/orders";

  constructor(data?: Partial<Order>) {
    super(data);
    if (data) {
      // Convert date strings to Date objects
      if (data.deliveryDate && typeof data.deliveryDate === 'string') {
        this.deliveryDate = new Date(data.deliveryDate);
      }
      if (data.attendedAt && typeof data.attendedAt === 'string') {
        this.attendedAt = new Date(data.attendedAt);
      }
      if (data.finalizedAt && typeof data.finalizedAt === 'string') {
        this.finalizedAt = new Date(data.finalizedAt);
      }
      if (data.cancelledAt && typeof data.cancelledAt === 'string') {
        this.cancelledAt = new Date(data.cancelledAt);
      }
      if (data.createdAt && typeof data.createdAt === 'string') {
        this.createdAt = new Date(data.createdAt);
      }
      if (data.updatedAt && typeof data.updatedAt === 'string') {
        this.updatedAt = new Date(data.updatedAt);
      }
    }
  }

  /**
   * Get full order identifier
   */
  get fullOrderIdentifier(): string {
    return `#${this.orderNumber} - ${this.personName}`;
  }

  /**
   * Check if order is pending
   */
  get isPending(): boolean {
    return this.status === OrdersStatusEnum.PENDENTE;
  }

  /**
   * Get formatted total amount
   */
  get formattedTotal(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.totalAmount || 0);
  }

  /**
   * Filter orders by company with optional status filter
   */
  static async filterByCompany(
    filters: { companyId?: string; status?: OrdersStatusEnum; [key: string]: any } = {}
  ): Promise<Order[]> {
    if (!filters.companyId) {
      throw new Error('companyId é obrigatório para filtrar pedidos');
    }
    return super._filter.call(this, this.baseUrl, filters) as Promise<Order[]>;
  }

  static async filter(filters: Partial<Order> = {}, pagination = {}) : Promise<Order[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<Order[]>;
  }

  static async findById(id: string): Promise<Order | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<Order | null>;
  }

  static async create(data: Partial<Order>): Promise<Order> {
    return super._create.call(this, this.baseUrl, data) as Promise<Order>;
  }

  /**
   * Create order with validation
   */
  static async createWithValidation(data: Partial<Order>): Promise<Order> {
    if (!data.companyId) {
      throw new Error('companyId é obrigatório para criar pedido');
    }
    if (!data.orderNumber) {
      throw new Error('orderNumber é obrigatório');
    }
    if (!data.personId) {
      throw new Error('personId é obrigatório');
    }
    return super._create.call(this, this.baseUrl, data) as Promise<Order>;
  }

  /**
   * Update order status
   */
  static async updateStatus(id: string, newStatus: OrdersStatusEnum): Promise<Order> {
    const updates: Partial<Order> = { status: newStatus };

    if (newStatus === OrdersStatusEnum.EM_ATENDIMENTO) {
      updates.attendedAt = new Date();
    } else if (newStatus === OrdersStatusEnum.FINALIZADO) {
      updates.finalizedAt = new Date();
    } else if (newStatus === OrdersStatusEnum.CANCELADO) {
      updates.cancelledAt = new Date();
    }

    return super._update.call(this, this.baseUrl, id, updates) as Promise<Order>;
  }

  static async update(id: string, data: Partial<Order>): Promise<Order> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<Order>;
  }

  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Cancel order with reason
   */
  static async cancel(id: string, reason: string): Promise<Order> {
    return this.updateStatus(id, OrdersStatusEnum.CANCELADO).then(order => {
      order.cancellationReason = reason;
      return order;
    });
  }
}

