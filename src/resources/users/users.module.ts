import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { CompaniesModule } from '../companies/companies.module'

@Module({
  imports: [JwtModule.register({}), CompaniesModule],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController]
})
export class UsersModule {}
