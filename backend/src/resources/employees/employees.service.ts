import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import {
  EmployeePositionEnum,
  employees,
  sectors,
} from "../../database/schemas";
import { EmployeEsCreateDto } from "./dto/employees.post.dto";
import { EmployeEsUpdateDto } from "./dto/employees.update.dto";

@Injectable()
export class EmployeEsesService extends BaseCrudService<typeof employees> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, employees, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: EmployeEsCreateDto) {
    const sectorId = await this.resolveSectorId(
      data.position,
      data.sectorId,
    );
    const employeeToCreate: EmployeEsCreateDto = { ...data, sectorId };
    return super.create(employeeToCreate);
  }

  async update(id: string, data: Partial<EmployeEsUpdateDto>) {
    const [existingEmployee] = await this.getDb()
      .select({
        position: employees.position,
        sectorId: employees.sectorId,
      })
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!existingEmployee) {
      throw new NotFoundException("Funcionário não encontrado.");
    }

    const position = data.position ?? existingEmployee.position;
    const sectorId = await this.resolveSectorId(
      position,
      data.sectorId ?? existingEmployee.sectorId,
    );
    return super.update(id, { ...data, sectorId });
  }

  private async resolveSectorId(
    position: EmployeePositionEnum,
    sectorId?: string | null,
  ) {
    if (position !== EmployeePositionEnum.ENTREGADOR) {
      return null;
    }

    if (!sectorId) {
      throw new BadRequestException(
        "Entregadores devem estar vinculados a um setor.",
      );
    }

    const companyId = this.requestContext.getCompanyId();
    const [sector] = await this.getDb()
      .select({ id: sectors.id })
      .from(sectors)
      .where(
        and(
          eq(sectors.id, sectorId),
          ...(companyId ? [eq(sectors.companyId, companyId)] : []),
        ),
      )
      .limit(1);

    if (!sector) {
      throw new BadRequestException("Selecione um setor válido da empresa.");
    }

    return sector.id;
  }
}
