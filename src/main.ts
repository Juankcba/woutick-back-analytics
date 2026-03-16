import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend and Vue panel
  app.enableCors({
    origin: [
      'https://woutick.com',
      'https://www.woutick.com',
      'https://panel.woutick.com',
      'http://localhost:3000',
      'http://localhost:5173',
    ],
    methods: 'GET,POST',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger / OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Woutick Analytics API')
    .setDescription('Backend de analytics para tracking de usuarios, sesiones, eventos y Meta CAPI.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'Token' },
      'access-token',
    )
    .addTag('tracking', 'Endpoints para recibir datos del frontend')
    .addTag('analytics', 'Endpoints de lectura para el panel Vue')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Analytics backend running on port ${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap();
