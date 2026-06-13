import {
  Controller,
  Post,
  Body,
  HttpCode,
  Query,
  UnauthorizedException,
  Get,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { GetUser } from "./decorators/get-user.decorator";
import { UserProfileResponseDto } from "./dto/user-profile-response.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiExcludeEndpoint()
  async register(
    @Body() registerDto: RegisterDto,
    @Query("secret") secret?: string,
  ) {
    const expectedSecret = process.env.ADMIN_SECRET || "aaramwale_secret";
    if (secret !== expectedSecret) {
      throw new UnauthorizedException(
        "Invalid or missing secret key for registration",
      );
    }

    const data = await this.authService.register(registerDto);
    return {
      message: "User registered successfully",
      data,
    };
  }

  @Post("login")
  @HttpCode(200)
  @ApiOperation({
    summary: "Login and obtain JWT token",
    description: `Authenticate with email and password. Returns an \`accessToken\` JWT to be used as a Bearer token in all subsequent requests.\n\n**Default Super Admin:**\n- Email: \`admin@aaramwala.com\`\n- Password: \`Admin@123\``,
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "Login successful — returns accessToken and user info",
    schema: {
      example: {
        success: true,
        message: "Login successful",
        data: {
          accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          user: {
            id: 1,
            name: "Super Admin",
            email: "admin@aaramwala.com",
            role: "SUPER_ADMIN",
            outletId: null,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid credentials or account disabled",
  })
  async login(@Body() loginDto: LoginDto) {
    const data = await this.authService.login(loginDto);
    return {
      message: "Login successful",
      data,
    };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Get current user profile",
    description:
      "Returns the authenticated user's profile including role, outlet (if EMPLOYEE), and permissions list.",
  })
  @ApiResponse({
    status: 200,
    description: "Profile retrieved successfully",
    type: UserProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  async getProfile(@GetUser() user: any) {
    const data = await this.authService.getProfile(user.userId);
    return {
      message: "Profile retrieved successfully",
      data,
    };
  }
}
