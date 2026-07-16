import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { patchNestJsSwagger, ZodValidationPipe } from "nestjs-zod";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import type { Env } from "./config/env.schema";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService) as unknown as ConfigService<Env, true>;

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: configService.get("CORS_ORIGIN", { infer: true }),
    credentials: true,
  });
  app.setGlobalPrefix("api/v1", { exclude: ["health"] });
  app.useGlobalPipes(new ZodValidationPipe());

  patchNestJsSwagger();
  const swaggerConfig = new DocumentBuilder()
    .setTitle("X-Pure WDMS API")
    .setDescription("Water Delivery Management System API")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const port = configService.get("API_PORT", { infer: true });
  await app.listen(port);
  console.log(`API listening on http://localhost:${port} (docs at /api/docs)`);
}

void bootstrap();
