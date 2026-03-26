import 'dotenv/config'
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { RlsInterceptor } from './database/rls/rls.interceptor'
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true })
  app.setGlobalPrefix('api')
  const swaggerConfig = new DocumentBuilder()
    .setTitle('GDS Meu Gás API')
    .setDescription('ERP + PDV - API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  
  SwaggerModule.setup('api/docs', app, document)
  app.useGlobalInterceptors(app.get(HttpErrorInterceptor), app.get(RlsInterceptor))
  const port = process.env.PORT ? Number(process.env.PORT) : 4000
  await app.listen(port)
}

bootstrap()
