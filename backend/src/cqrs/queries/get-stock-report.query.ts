export class GetStockReportQuery {
  constructor(
    public readonly sectorId: string,
    public readonly reportDate: string,
    public readonly companyId: string,
  ) {}
}
