import { Module } from '@nestjs/common'
import { VasilhameloansService } from './vasilhameLoans.service'
import { VasilhameloansController } from './vasilhameLoans.controller'

@Module({
  providers: [VasilhameloansService],
  controllers: [VasilhameloansController],
})
export class VasilhameloansModule {}
