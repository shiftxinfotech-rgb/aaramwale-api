import { Controller, Post, Body, HttpCode, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiExcludeEndpoint()
  async register(
    @Body() registerDto: RegisterDto,
    @Query('secret') secret?: string
  ) {
    const expectedSecret = process.env.ADMIN_SECRET || 'aaramwale_secret';
    if (secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid or missing secret key for registration');
    }

    const data = await this.authService.register(registerDto);
    return {
      message: 'User registered successfully',
      data,
    };
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login to get JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const data = await this.authService.login(loginDto);
    return {
      message: 'Login successful',
      data,
    };
  }
}
