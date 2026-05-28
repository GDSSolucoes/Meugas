import { Module } from "@nestjs/common";
import { AccountsReceivablesService } from "./accountsReceivables.service";
import { AccountsReceivablesController } from "./accountsReceivables.controller";

@Module({
  providers: [AccountsReceivablesService],
  controllers: [AccountsReceivablesController],
})
export class AccountsReceivablesModule {}
