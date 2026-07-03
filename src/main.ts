import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  // Set global prefix for all routes
  app.setGlobalPrefix("api");

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

  // Global Interceptor and Filter
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─────────────────────────────────────────────────────────────────────────────
  //  Swagger API Documentation
  // ─────────────────────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle("AaramWale API")
    .setVersion("1.3")
    .setDescription(
      `## AaramWale — Multi-outlet Asset Rental & Pass Management

### 🔐 Authentication
All protected endpoints require a **Bearer JWT token**.
1. Call \`POST /api/auth/login\` with valid credentials.
2. Copy the \`accessToken\` from the response.
3. Click **Authorize** (🔒) at the top and paste: \`Bearer <token>\`.

---

### 👥 Role Hierarchy

\`\`\`
SUPER_ADMIN (Platform Owner)
    └── creates ──▶ ADMIN (Business Owner)
                        └── creates ──▶ EMPLOYEE (Outlet Operator)
\`\`\`

---

### 🎭 Role Permissions

| Action | SUPER_ADMIN | ADMIN | EMPLOYEE |
|--------|:-----------:|:-----:|:--------:|
| Manage Admins (CRUD) | ✅ | ❌ | ❌ |
| Manage Outlets | ❌ | ✅ | ❌ |
| Manage Employees | ❌ | ✅ | ❌ |
| Manage Categories | ❌ | ✅ | ❌ |
| Manage Assets | ❌ | ✅ | ❌ |
| Manage Customers | ❌ | ✅ | ✅ |
| Generate Passes | ❌ | ✅ | ✅ |
| Redeem Passes | ❌ | ✅ | ✅ |
| Walk-In Sessions | ❌ | ✅ | ✅ |
| View Reports | ❌ | ✅ | ❌ |
| View Dashboard | ❌ | ✅ | ✅ |

---

### 🏪 Outlet Isolation
- **EMPLOYEE** can only access data belonging to their **assigned outlet**.
- **ADMIN** can access data across **all outlets**.
- **SUPER_ADMIN** has no \`outletId\` (platform-level only).

---

### 📋 Default Super Admin Credentials (Dev)
\`\`\`
Email:    admin@aaramwala.com
Password: Admin@123
Role:     SUPER_ADMIN
\`\`\`
`,
    )
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        in: "header",
        description: "Paste your JWT token obtained from POST /api/auth/login",
      },
      "access-token",
    )
    .addTag("Authentication", "Login and profile — no role restriction")
    .addTag("Admins", "Admin user management — SUPER_ADMIN only")
    .addTag(
      "Employees",
      "Employee management — ADMIN only (SUPER_ADMIN read-only)",
    )
    .addTag("Outlets", "Outlet management — ADMIN only")
    .addTag(
      "Categories",
      "Category management — ADMIN only (EMPLOYEE read-only)",
    )
    .addTag("Assets", "Asset management — ADMIN only (EMPLOYEE read-only)")
    .addTag("Customers", "Customer management — ADMIN and EMPLOYEE")
    .addTag("Passes", "Pass generation, redemption — ADMIN and EMPLOYEE")
    .addTag(
      "Walk-In Sessions",
      "Walk-in session management — ADMIN and EMPLOYEE",
    )
    .addTag("Reports", "Analytics and reporting — ADMIN only")
    .addTag("Dashboard", "Dashboard overview — ADMIN and EMPLOYEE")
    .addTag("Search", "Global search — ADMIN and EMPLOYEE")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
    customSiteTitle: "AaramWale API Docs",
    customfavIcon: "https://nestjs.com/img/logo_text.svg",
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
}
bootstrap();
