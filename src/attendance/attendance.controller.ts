import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { AttendanceService } from "./attendance.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { User } from "../users/user.entity";
import { AttendanceResponseDto } from "./dto/attendance-response.dto";
import { AttendanceStatusResponseDto } from "./dto/attendance-status-response.dto";

@ApiTags("Attendance")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post("clock-in")
  @ApiOperation({ summary: "Clock in for work" })
  @ApiResponse({
    status: 201,
    description: "Clocked in successfully",
    type: AttendanceResponseDto,
  })
  @ApiResponse({ status: 400, description: "Already clocked in" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        outletId: {
          type: "number",
          example: 1,
          description: "Optional: defaults to user assigned outlet",
        },
      },
    },
  })
  async clockIn(@Req() req, @Body("outletId") outletId?: number) {
    const user = req.user as User;
    // Service expects number, but outletId is optional.
    // We'll pass it as is, and service handles fallback.
    const data = await this.attendanceService.clockIn(user, outletId || 0);
    return {
      message: "Clocked in successfully",
      data,
    };
  }

  @Post("clock-out")
  @ApiOperation({ summary: "Clock out from work" })
  @ApiResponse({
    status: 200,
    description: "Clocked out successfully",
    type: AttendanceResponseDto,
  })
  @ApiResponse({ status: 400, description: "Not clocked in" })
  async clockOut(@Req() req) {
    const user = req.user as User;
    const data = await this.attendanceService.clockOut(user);
    return {
      message: "Clocked out successfully",
      data,
    };
  }

  @Get("status")
  @ApiOperation({ summary: "Get current attendance status" })
  @ApiResponse({
    status: 200,
    description: "Status retrieved successfully",
    type: AttendanceStatusResponseDto,
  })
  async getStatus(@Req() req) {
    const user = req.user as User;
    const data = await this.attendanceService.getStatus(user.id);
    return {
      message: "Status retrieved successfully",
      data,
    };
  }

  @Get("history")
  @ApiOperation({ summary: "Get attendance history" })
  @ApiResponse({
    status: 200,
    description: "History retrieved successfully",
    type: [AttendanceResponseDto],
  })
  async getHistory(@Req() req, @Query("days") days?: number) {
    const user = req.user as User;
    const data = await this.attendanceService.getHistory(
      user.id,
      days ? Number(days) : 7,
    );
    return {
      message: "History retrieved successfully",
      data,
    };
  }
}
