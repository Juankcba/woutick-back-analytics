"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
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
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Woutick Analytics API')
        .setDescription('Backend de analytics para tracking de usuarios, sesiones, eventos y Meta CAPI.')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'Token' }, 'access-token')
        .addTag('tracking', 'Endpoints para recibir datos del frontend')
        .addTag('analytics', 'Endpoints de lectura para el panel Vue')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 Analytics backend running on port ${port}`);
    console.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map