import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SellerService } from './seller.service';
import {
  DashboardQueryDto,
  UpdateOrderStatusDto,
} from './dto/seller-queries.dto';
import { QueryProductDto } from '../products/dto/query-product.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';

@ApiTags('seller')
@ApiBearerAuth()
@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Aggregated sales stats for the seller' })
  dashboard(
    @CurrentUser('id') userId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.sellerService.getDashboard(userId, query.range);
  }

  @Get('products')
  @ApiOperation({ summary: 'Own products (includes drafts/inactive)' })
  products(
    @CurrentUser('id') userId: string,
    @Query() query: QueryProductDto,
  ) {
    return this.sellerService.getProducts(userId, query);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Incoming orders for the seller’s store' })
  orders(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.sellerService.getOrders(userId, query.page, query.limit);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update the status of an order' })
  updateOrderStatus(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.sellerService.updateOrderStatus(userId, id, dto.status);
  }
}
