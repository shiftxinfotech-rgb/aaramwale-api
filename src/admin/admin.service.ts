import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "../users/user.entity";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /** Remove sensitive/internal fields before returning */
  private sanitize(user: User): Record<string, any> {
    const obj = { ...user } as any;
    delete obj.password;
    delete obj.hashPassword;
    return obj;
  }

  async create(createAdminDto: CreateAdminDto): Promise<Record<string, any>> {
    const { email, password, name, mobile, isActive } = createAdminDto;
    // NOTE: 'role' and 'outletId' from the DTO are intentionally ignored.
    // role is always forced to ADMIN; outletId is always null for admins.

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    // The User entity's @BeforeInsert hook will hash the password automatically.
    const admin = this.userRepository.create({
      name,
      email,
      password,
      ...(mobile ? { mobile } : {}),
      isActive: isActive !== undefined ? isActive : true,
      role: UserRole.ADMIN,
      outletId: null,
    });

    const savedAdmin = await this.userRepository.save(admin);
    return this.sanitize(savedAdmin);
  }

  async findAll(): Promise<Record<string, any>[]> {
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
      order: { createdAt: "DESC" },
    });
    return admins.map((a) => this.sanitize(a));
  }

  async findOne(id: number): Promise<Record<string, any>> {
    const admin = await this.userRepository.findOne({
      where: { id, role: UserRole.ADMIN },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return this.sanitize(admin);
  }

  async update(
    id: number,
    updateAdminDto: UpdateAdminDto,
  ): Promise<Record<string, any>> {
    const admin = await this.userRepository.findOne({
      where: { id, role: UserRole.ADMIN },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    // Merge updates — the @BeforeUpdate hook will re-hash password if changed
    Object.assign(admin, {
      ...updateAdminDto,
      role: UserRole.ADMIN, // enforce role
      outletId: null, // enforce no outlet
    });

    const saved = await this.userRepository.save(admin);
    return this.sanitize(saved);
  }

  async remove(id: number): Promise<void> {
    const admin = await this.userRepository.findOne({
      where: { id, role: UserRole.ADMIN },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    await this.userRepository.remove(admin);
  }
}
