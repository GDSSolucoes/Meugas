import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './resources/users/users.module'
import { DatabaseModule } from './database/database.module'
import { CompaniesModule } from './resources/companies/companies.module'
import { PeopleModule } from './resources/people/people.module'
import { ProductsModule } from './resources/products/products.module'
import { HttpErrorInterceptor } from './common/http-error.interceptor'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    CompaniesModule,
    PeopleModule,
    ProductsModule
  ],
  providers: [HttpErrorInterceptor]
})
export class AppModule {}
