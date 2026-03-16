import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Analytics backend running on port ${port}`);
}

bootstrap();
