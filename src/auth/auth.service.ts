import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User, UserRole } from "../users/user.entity";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, role, outletId, mobile } = registerDto;

    if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN) {
      if (outletId !== undefined && outletId !== null) {
        throw new BadRequestException(
          "outletId must be NULL for SUPER_ADMIN and ADMIN roles",
        );
      }
    } else if (role === UserRole.EMPLOYEE) {
      if (outletId === undefined || outletId === null) {
        throw new BadRequestException("outletId is required for EMPLOYEE role");
      }
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    // Create user
    const user = this.userRepository.create({
      email,
      password,
      name,
      role,
      outletId: role === UserRole.EMPLOYEE ? outletId : null,
      mobile,
    });

    await this.userRepository.save(user);

    // Return user without password
    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user with password
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException("User account is disabled");
    }

    // Verify password
    let isPasswordValid = false;
    if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = password === user.password;
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      outletId: user.outletId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        outletId: user.outletId || null,
      },
    };
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or inactive");
    }
    return user;
  }

  async getProfile(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["outlet"],
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const permissions = ROLE_PERMISSIONS[user.role] || [];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile || null,
      role: user.role,
      outlet: user.outlet
        ? {
            id: user.outlet.id,
            name: user.outlet.name,
          }
        : null,
      permissions,
      isActive: user.isActive,
    };
  }
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["admin.create", "admin.view", "admin.update", "admin.delete"],
  ADMIN: [
    "customer.view",
    "customer.create",
    "customer.update",
    "customer.delete",
    "pass.create",
    "pass.view",
    "pass.update",
    "pass.delete",
    "pass.redeem",
    "walkin.create",
    "walkin.view",
    "report.view",
    "outlet.create",
    "outlet.view",
    "outlet.update",
    "outlet.delete",
    "asset.create",
    "asset.view",
    "asset.update",
    "asset.delete",
    "employee.create",
    "employee.view",
    "employee.update",
    "employee.delete",
  ],
  EMPLOYEE: [
    "customer.view",
    "customer.create",
    "pass.create",
    "pass.redeem",
    "walkin.create",
  ],
};
