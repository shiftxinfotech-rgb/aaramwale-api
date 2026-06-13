import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";
import { DashboardResponseDto } from "./dto/dashboard-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { UserRole } from "../users/user.entity";

@ApiTags("Dashboard")
@ApiBearerAuth("access-token")
@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "Get dashboard summary (revenue, sales, walk-ins, redemptions)",
  })
  @ApiQuery({
    name: "outletId",
    required: false,
    type: Number,
    description: "Filter by outlet (ADMIN/SUPER_ADMIN only)",
  })
  @ApiResponse({
    status: 200,
    description: "Dashboard data",
    type: DashboardResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getDashboard(
    @Query("outletId") outletId?: string,
    @GetUser() user?: any,
  ) {
    const filterOutletId =
      user.role === UserRole.EMPLOYEE
        ? user.outletId
        : outletId
          ? +outletId
          : undefined;
    const data = await this.dashboardService.getDashboard(filterOutletId);
    return {
      message: "Dashboard data retrieved successfully",
      data,
    };
  }
}
