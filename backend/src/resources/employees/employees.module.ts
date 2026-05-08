import { Module } from '@nestjs/common'
import { EmployeEsesService } from './employees.service'
import { EmployeEsesController } from './employees.controller'

@Module({
  providers: [EmployeEsesService],
  controllers: [EmployeEsesController],
})
export class EmployeEsesModule {}
