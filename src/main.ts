import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for mobile app and admin panel
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('AaramWale API')
    .setDescription('Multi-outlet massage chair rental & token management system')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and registration')
    .addTag('Admin', 'Admin management')
    .addTag('Employees', 'Employee management')
    .addTag('Outlets', 'Outlet management')
    .addTag('Chairs', 'Chair management')
    .addTag('Tokens', 'Token generation and management')
    .addTag('Customers', 'Customer management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
