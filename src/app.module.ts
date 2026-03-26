import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CqrsModule } from '@nestjs/cqrs'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './resources/users/users.module'
import { DatabaseModule } from './database/database.module'
import { CompaniesModule } from './resources/companies/companies.module'
import { PeopleModule } from './resources/people/people.module'
import { ProductsModule } from './resources/products/products.module'
import { VehiclesModule } from './resources/vehicles/vehicles.module'
import { CqrsAppModule } from './cqrs/cqrs.module'
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    CompaniesModule,
    PeopleModule,
    ProductsModule,
    VehiclesModule,
    CqrsAppModule
  ],
  providers: [HttpErrorInterceptor]
})
export class AppModule {}
