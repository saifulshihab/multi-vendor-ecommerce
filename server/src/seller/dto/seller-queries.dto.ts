import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../../common/enums';

export enum DashboardRange {
  D7 = '7d',
  D30 = '30d',
  D90 = '90d',
}

export class DashboardQueryDto {
  @ApiPropertyOptional({ enum: DashboardRange, default: DashboardRange.D7 })
  @IsOptional()
  @IsEnum(DashboardRange)
  range: DashboardRange = DashboardRange.D7;
}

export class UpdateOrderStatusDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
