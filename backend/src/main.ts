import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SanitizePipe } from "./common/pipes/sanitize-body.pipe";
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { RlsInterceptor } from "./database/rls/rls.interceptor";
import { HttpErrorInterceptor } from "./interceptors/http-error.interceptor";

if (process.env.NODE_ENV === "development") {
  console.log("Running in development mode - increasing stack trace limit");
  Error.stackTraceLimit = 1000;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      skipMissingProperties: true,
      skipNullProperties: true,
      skipUndefinedProperties: true,
    }),
  );
  const swaggerConfig = new DocumentBuilder()
    .setTitle("GDS Meu Gás API")
    .setDescription("ERP + PDV - API")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup("api/docs", app, document);

  app.useGlobalInterceptors(
    app.get(HttpErrorInterceptor),
    app.get(RlsInterceptor),
  );
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
}

bootstrap();
