import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable CORS for mobile app and admin panel
  app.enableCors({
    origin: ['https://admin.aaramwala.com', 'http://admin.aaramwala.com', 'http://localhost:3000', 'http://localhost:3001'],
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

  // Global Interceptor and Filter
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('AaramWale API')
    .setDescription('Multi-outlet asset rental and pass management API')
    .setVersion('1.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste employee or admin JWT access token here',
      },
      'access-token',
    )
    .addTag('Authentication', 'User authentication and registration')
    .addTag('Admin', 'Admin management')
    .addTag('Employees', 'Employee management')
    .addTag('Outlets', 'Outlet management')
    .addTag('Categories', 'Category management')
    .addTag('Assets', 'Asset management')
    .addTag('Passes', 'Customer pass generation and management')
    .addTag('Reports', 'Admin reporting and analytics')
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
