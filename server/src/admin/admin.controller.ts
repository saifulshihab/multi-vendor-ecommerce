import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  ApproveStoreDto,
  ListUsersDto,
  UpdateCommissionDto,
  UpdateOrderStatusDto,
  UpdateProductStatusDto,
  UpdateUserDto,
} from './dto/admin-queries.dto';
import { QueryProductDto } from '../products/dto/query-product.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- Users ---

  @Get('users')
  @ApiOperation({ summary: 'List users (search + role filter)' })
  listUsers(@Query() query: ListUsersDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Change a user’s role or ban status' })
  updateUser(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(adminId, id, dto);
  }

  // --- Stores / seller approval ---

  @Get('stores')
  @ApiOperation({ summary: 'List all stores' })
  listStores(@Query() query: PaginationQueryDto) {
    return this.adminService.listStores(query);
  }

  @Patch('stores/:id/approve')
  @ApiOperation({ summary: 'Approve or unapprove a seller’s store' })
  approveStore(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveStoreDto,
  ) {
    return this.adminService.approveStore(id, dto.isApproved);
  }

  // --- Products ---

  @Get('products')
  @ApiOperation({ summary: 'All products (includes drafts/inactive)' })
  listProducts(@Query() query: QueryProductDto) {
    return this.adminService.listProducts(query);
  }

  @Patch('products/:id/status')
  @ApiOperation({ summary: 'Hide/show a product by changing its status' })
  setProductStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductStatusDto,
  ) {
    return this.adminService.setProductStatus(id, dto.status);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Remove a product' })
  removeProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.removeProduct(id);
  }

  // --- Orders ---

  @Get('orders')
  @ApiOperation({ summary: 'All orders across the platform' })
  listOrders(@Query() query: PaginationQueryDto) {
    return this.adminService.listOrders(query);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update any order’s status' })
  updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(id, dto.status);
  }

  // --- Analytics + settings ---

  @Get('analytics')
  @ApiOperation({ summary: 'Platform-wide sales report (GMV, commission)' })
  analytics() {
    return this.adminService.getAnalytics();
  }

  @Get('settings/commission')
  @ApiOperation({ summary: 'Current platform commission percent' })
  getCommission() {
    return this.adminService.getCommission();
  }

  @Patch('settings/commission')
  @ApiOperation({ summary: 'Set the platform commission percent' })
  setCommission(@Body() dto: UpdateCommissionDto) {
    return this.adminService.setCommission(dto.percent);
  }
}
