import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { ReportsService } from "./reports.service";
import { ReportQueryDto } from "./dto/report-query.dto";
import { CategoryWiseReportDto } from "./dto/category-wise-report.dto";
import { AssetWiseReportDto } from "./dto/asset-wise-report.dto";
import { OutletWiseReportDto } from "./dto/outlet-wise-report.dto";
import { TopCustomersReportDto } from "./dto/top-customers-report.dto";
import { MostUsedAssetsReportDto } from "./dto/most-used-assets-report.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../users/user.entity";

@ApiTags("Reports")
@ApiBearerAuth("access-token")
@Controller("reports")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("category-wise")
  @ApiOperation({
    summary: "Category-wise pass and revenue metrics",
    description:
      "**Role:** ADMIN / SUPER_ADMIN\n\nBreaks down passes and revenue by category. Optionally filter by date range using \`fromDate\` and \`toDate\` (YYYY-MM-DD).",
  })
  @ApiResponse({
    status: 200,
    description: "Category-wise report data",
    type: [CategoryWiseReportDto],
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden — ADMIN role required" })
  async getCategoryWise(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getCategoryWise(
      query.fromDate,
      query.toDate,
    );
    return {
      message: "Category-wise reports retrieved successfully",
      data,
    };
  }

  @Get("asset-wise")
  @ApiOperation({
    summary: "Asset-wise pass and revenue metrics",
    description:
      "**Role:** ADMIN / SUPER_ADMIN\n\nBreaks down passes and revenue per asset.",
  })
  @ApiResponse({
    status: 200,
    description: "Asset-wise report data",
    type: [AssetWiseReportDto],
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async getAssetWise(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getAssetWise(
      query.fromDate,
      query.toDate,
    );
    return {
      message: "Asset-wise reports retrieved successfully",
      data,
    };
  }

  @Get("outlet-wise")
  @ApiOperation({
    summary: "Outlet-wise pass and revenue metrics",
    description:
      "**Role:** ADMIN / SUPER_ADMIN\n\nBreaks down performance by outlet.",
  })
  @ApiResponse({
    status: 200,
    description: "Outlet-wise report data",
    type: [OutletWiseReportDto],
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async getOutletWise(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getOutletWise(
      query.fromDate,
      query.toDate,
    );
    return {
      message: "Outlet-wise reports retrieved successfully",
      data,
    };
  }

  @Get("top-customers")
  @ApiOperation({
    summary: "Top customers by spend",
    description:
      "**Role:** ADMIN / SUPER_ADMIN\n\nReturns the highest-spending customers sorted by total revenue.",
  })
  @ApiResponse({
    status: 200,
    description: "Top customers report",
    type: [TopCustomersReportDto],
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async getTopCustomers(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getTopCustomers(
      query.fromDate,
      query.toDate,
    );
    return {
      message: "Top customers reports retrieved successfully",
      data,
    };
  }

  @Get("most-used-assets")
  @ApiOperation({
    summary: "Most used assets by redemption count",
    description:
      "**Role:** ADMIN / SUPER_ADMIN\n\nReturns the most frequently redeemed assets.",
  })
  @ApiResponse({
    status: 200,
    description: "Most used assets report",
    type: [MostUsedAssetsReportDto],
  })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async getMostUsedAssets(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getMostUsedAssets(
      query.fromDate,
      query.toDate,
    );
    return {
      message: "Most used assets reports retrieved successfully",
      data,
    };
  }

  @Get("employee-wise")
  @ApiOperation({
    summary: "Employee-wise sales and revenue metrics",
    description:
      "**Role:** ADMIN / SUPER_ADMIN\n\nShows how many passes each employee generated and total revenue.",
  })
  @ApiResponse({ status: 200, description: "Employee-wise revenue report" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async getEmployeeWise(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getEmployeeWise(
      query.fromDate,
      query.toDate,
    );
    return {
      message: "Employee-wise reports retrieved successfully",
      data,
    };
  }

  @Get("consumption-stats")
  @ApiOperation({
    summary: "Total paid and free consumption statistics",
    description:
      "**Role:** ADMIN / SUPER_ADMIN\n\nAggregate stats for paid vs. complimentary session consumption.",
  })
  @ApiResponse({ status: 200, description: "Consumption statistics" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async getConsumptionStats(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getConsumptionStats(
      query.fromDate,
      query.toDate,
    );
    return {
      message: "Consumption statistics retrieved successfully",
      data,
    };
  }

  @Get("employee-redemptions")
  @ApiOperation({
    summary: "Sessions redeemed per employee",
    description:
      "**Role:** ADMIN / SUPER_ADMIN\n\nLists how many sessions each employee has redeemed.",
  })
  @ApiResponse({ status: 200, description: "Employee redemptions report" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  async getEmployeeRedemptions(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getEmployeeRedemptions(
      query.fromDate,
      query.toDate,
    );
    return {
      message: "Employee redemptions reports retrieved successfully",
      data,
    };
  }

  @Get("customer-usage/:customerId")
  @ApiOperation({
    summary: "Customer consumption and check-in history",
    description:
      "**Role:** ADMIN / SUPER_ADMIN\n\nDetailed usage log for a specific customer.",
  })
  @ApiParam({
    name: "customerId",
    type: Number,
    example: 11,
    description: "Customer ID",
  })
  @ApiResponse({ status: 200, description: "Customer usage history" })
  @ApiResponse({ status: 401, description: "Missing or invalid Bearer token" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Customer not found" })
  async getCustomerUsageHistory(@Param("customerId") customerId: string) {
    const data = await this.reportsService.getCustomerUsageHistory(+customerId);
    return {
      message: "Customer usage history retrieved successfully",
      data,
    };
  }
}
