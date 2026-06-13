import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { SearchService } from "./search.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { UserRole } from "../users/user.entity";

@ApiTags("Search")
@ApiBearerAuth("access-token")
@Controller("search")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary:
      "Global search across customers, passes, assets, and walk-in sessions",
  })
  @ApiQuery({
    name: "q",
    required: true,
    description: "Search term (name, mobile, pass number, asset name)",
  })
  @ApiResponse({ status: 200, description: "Categorized search results" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async search(@Query("q") q: string, @GetUser() user: any) {
    const filterOutletId =
      user.role === UserRole.EMPLOYEE ? user.outletId : undefined;
    const data = await this.searchService.globalSearch(q, filterOutletId);
    return {
      message: "Search results",
      data,
    };
  }
}
