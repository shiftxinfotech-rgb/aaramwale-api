import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { CategoryWiseReportDto } from './dto/category-wise-report.dto';
import { AssetWiseReportDto } from './dto/asset-wise-report.dto';
import { OutletWiseReportDto } from './dto/outlet-wise-report.dto';
import { TopCustomersReportDto } from './dto/top-customers-report.dto';
import { MostUsedAssetsReportDto } from './dto/most-used-assets-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('category-wise')
  @ApiOperation({ summary: 'Get category-wise passes and revenue metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category-wise reports', type: [CategoryWiseReportDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getCategoryWise(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getCategoryWise(query.fromDate, query.toDate);
    return {
      message: 'Category-wise reports retrieved successfully',
      data,
    };
  }

  @Get('asset-wise')
  @ApiOperation({ summary: 'Get asset-wise passes and revenue metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Asset-wise reports', type: [AssetWiseReportDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAssetWise(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getAssetWise(query.fromDate, query.toDate);
    return {
      message: 'Asset-wise reports retrieved successfully',
      data,
    };
  }

  @Get('outlet-wise')
  @ApiOperation({ summary: 'Get outlet-wise passes and revenue metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Outlet-wise reports', type: [OutletWiseReportDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOutletWise(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getOutletWise(query.fromDate, query.toDate);
    return {
      message: 'Outlet-wise reports retrieved successfully',
      data,
    };
  }

  @Get('top-customers')
  @ApiOperation({ summary: 'Get top spending customers (Admin only)' })
  @ApiResponse({ status: 200, description: 'Top customers reports', type: [TopCustomersReportDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getTopCustomers(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getTopCustomers(query.fromDate, query.toDate);
    return {
      message: 'Top customers reports retrieved successfully',
      data,
    };
  }

  @Get('most-used-assets')
  @ApiOperation({ summary: 'Get most ordered/rented assets (Admin only)' })
  @ApiResponse({ status: 200, description: 'Most used assets reports', type: [MostUsedAssetsReportDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getMostUsedAssets(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getMostUsedAssets(query.fromDate, query.toDate);
    return {
      message: 'Most used assets reports retrieved successfully',
      data,
    };
  }

  @Get('employee-wise')
  @ApiOperation({ summary: 'Get employee sales and revenue metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Employee-wise revenue reports' })
  async getEmployeeWise(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getEmployeeWise(query.fromDate, query.toDate);
    return {
      message: 'Employee-wise reports retrieved successfully',
      data,
    };
  }

  @Get('consumption-stats')
  @ApiOperation({ summary: 'Get total paid and free consumption stats (Admin only)' })
  @ApiResponse({ status: 200, description: 'Consumption statistics' })
  async getConsumptionStats(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getConsumptionStats(query.fromDate, query.toDate);
    return {
      message: 'Consumption statistics retrieved successfully',
      data,
    };
  }

  @Get('employee-redemptions')
  @ApiOperation({ summary: 'Get sessions redeemed by employee (Admin only)' })
  @ApiResponse({ status: 200, description: 'Employee redemptions reports' })
  async getEmployeeRedemptions(@Query() query: ReportQueryDto) {
    const data = await this.reportsService.getEmployeeRedemptions(query.fromDate, query.toDate);
    return {
      message: 'Employee redemptions reports retrieved successfully',
      data,
    };
  }

  @Get('customer-usage/:customerId')
  @ApiOperation({ summary: 'Get customer consumption and check-in history (Admin only)' })
  @ApiResponse({ status: 200, description: 'Customer check-in logs' })
  async getCustomerUsageHistory(@Param('customerId') customerId: string) {
    const data = await this.reportsService.getCustomerUsageHistory(+customerId);
    return {
      message: 'Customer usage history retrieved successfully',
      data,
    };
  }
}
