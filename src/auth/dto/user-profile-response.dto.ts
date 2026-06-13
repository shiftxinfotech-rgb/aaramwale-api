import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "../../users/user.entity";

export class UserProfileOutletDto {
  @ApiProperty({ example: 4, description: "Outlet ID" })
  id: number;

  @ApiProperty({ example: "Ahmedabad Branch", description: "Outlet Name" })
  name: string;
}

export class UserProfileResponseDto {
  @ApiProperty({ example: 7, description: "User ID" })
  id: number;

  @ApiProperty({ example: "Rahul Patel", description: "User Name" })
  name: string;

  @ApiProperty({ example: "rahul@aaramwala.com", description: "User Email" })
  email: string;

  @ApiPropertyOptional({
    example: "9876543210",
    description: "User Mobile Number",
    nullable: true,
  })
  mobile: string | null;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.EMPLOYEE,
    description: "User Role",
  })
  role: UserRole;

  @ApiPropertyOptional({
    type: UserProfileOutletDto,
    description: "Assigned Outlet Details",
    nullable: true,
  })
  outlet: UserProfileOutletDto | null;

  @ApiProperty({
    type: [String],
    example: [
      "customer.view",
      "customer.create",
      "pass.create",
      "pass.redeem",
      "walkin.create",
    ],
    description: "Assigned User Permissions",
  })
  permissions: string[];

  @ApiProperty({ example: true, description: "User Active Status" })
  isActive: boolean;
}
