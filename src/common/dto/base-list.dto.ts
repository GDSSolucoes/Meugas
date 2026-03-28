export class BaseListDto<T> {
    
    // Common get fields can be added here
    data!: T
    total!: number
    page!: number
    limit!: number
    totalPages!: number
}