import { Controller, Get, Post, Body, Param, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WalkInSessionsService } from './walk-in-sessions.service';
import { CreateWalkInSessionDto } from './dto/create-walk-in-session.dto';
import { WalkInSession } from './walk-in-session.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Walk-In Sessions')
@ApiBearerAuth('access-token')
@Controller('walk-in-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalkInSessionsController {
  constructor(private readonly service: WalkInSessionsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Create a new walk-in session (Login required)' })
  @ApiResponse({ status: 201, description: 'Walk-in session created successfully', type: WalkInSession })
  @ApiResponse({ status: 400, description: 'Invalid asset, outlet or quantities' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createDto: CreateWalkInSessionDto, @GetUser() user: any) {
    const filterOutletId = user.role === UserRole.EMPLOYEE ? user.outletId : undefined;
    const data = await this.service.create(createDto, user.userId, filterOutletId);
    return {
      message: 'Walk-in session created successfully',
      data,
    };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get all walk-in sessions with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of walk-in sessions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: any, @GetUser() user: any) {
    const filterOutletId = user.role === UserRole.EMPLOYEE ? user.outletId : query.outletId;
    const data = await this.service.findAll({
      ...query,
      outletId: filterOutletId ? +filterOutletId : undefined,
      customerId: query.customerId ? +query.customerId : undefined,
      assetId: query.assetId ? +query.assetId : undefined,
      employeeId: query.employeeId ? +query.employeeId : undefined,
    });
    return {
      message: 'Walk-in sessions retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get walk-in session details by ID' })
  @ApiResponse({ status: 200, description: 'Walk-in session details', type: WalkInSession })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async findOne(@Param('id') id: string, @GetUser() user: any) {
    const session = await this.service.findOne(+id);
    if (user.role === UserRole.EMPLOYEE && session.outletId !== user.outletId) {
      throw new ForbiddenException('Forbidden. You can only view walk-in sessions from your outlet.');
    }
    return {
      message: 'Walk-in session retrieved successfully',
      data: session,
    };
  }
}
