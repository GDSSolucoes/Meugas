import { api, apiEnabled } from '@/api/apiClient';

export interface FilterOptions {
  [key: string]: any;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export class BaseEntity {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data?: Partial<BaseEntity>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  /**
   * Filter entities with optional query parameters
   * @param filters - Object with filter criteria
   * @param pagination - Pagination options
   * @returns Promise<Entity[]>
   */
  static async filter<T extends BaseEntity>(
    this: new (data?: T) => T,
    filters: FilterOptions = {},
    pagination?: PaginationOptions
  ): Promise<T[]> {
    if (!apiEnabled) {
      throw new Error('API não configurada');
    }
    

    try {
      const params = new URLSearchParams();

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      // Add pagination
      if (pagination) {
        if (pagination.page) params.append('page', String(pagination.page));
        if (pagination.limit) params.append('limit', String(pagination.limit));
        if (pagination.sort) params.append('sort', pagination.sort);
        if (pagination.order) params.append('order', pagination.order);
      }

      const endpoint = `/${this.name.toLowerCase()}s`;
      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      const response = await api.get(url);
      return response.data.map((item: any) => new this(item));
    } catch (error) {
      console.error(`Erro ao filtrar ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Create a new entity
   * @param data - Entity data to create
   * @returns Promise<Entity>
   */
  static async create<T extends BaseEntity>(
    this: new (data?: T) => T,
    data: Partial<T>
  ): Promise<T> {
    if (!apiEnabled) {
      throw new Error('API não configurada');
    }

    try {
      const endpoint = `/${this.name.toLowerCase()}s`;
      const response = await api.post(endpoint, data);
      return new this(response.data);
    } catch (error) {
      console.error(`Erro ao criar ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing entity
   * @param id - Entity ID
   * @param data - Updated entity data
   * @returns Promise<Entity>
   */
  static async update<T extends BaseEntity>(
    this: new (data?: T) => T,
    id: string,
    data: Partial<T>
  ): Promise<T> {
    if (!apiEnabled) {
      throw new Error('API não configurada');
    }

    try {
      const endpoint = `/${this.name.toLowerCase()}s/${id}`;
      const response = await api.put(endpoint, data);
      return new this(response.data);
    } catch (error) {
      console.error(`Erro ao atualizar ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Delete an entity
   * @param id - Entity ID
   * @returns Promise<void>
   */
  static async delete<T extends BaseEntity>(
    this: new (data?: T) => T,
    id: string
  ): Promise<void> {
    if (!apiEnabled) {
      throw new Error('API não configurada');
    }

    try {
      const endpoint = `/${this.name.toLowerCase()}s/${id}`;
      await api.delete(endpoint);
    } catch (error) {
      console.error(`Erro ao deletar ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Find entity by ID
   * @param id - Entity ID
   * @returns Promise<Entity | null>
   */
  static async findById<T extends BaseEntity>(
    this: new (data?: T) => T,
    id: string
  ): Promise<T | null> {
    if (!apiEnabled) {
      throw new Error('API não configurada');
    }

    try {
      const endpoint = `/${this.name.toLowerCase()}s/${id}`;
      const response = await api.get(endpoint);
      return new this(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error(`Erro ao buscar ${this.name} por ID:`, error);
      throw error;
    }
  }
}