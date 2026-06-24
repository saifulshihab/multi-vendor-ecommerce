import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { OrderStatus, ProductStatus, Role } from '../../common/enums';

export class ListUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search over name + email' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;
}

export class ApproveStoreDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isApproved = true;
}

export class UpdateOrderStatusDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class UpdateProductStatusDto {
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  status: ProductStatus;
}

export class UpdateCommissionDto {
  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(100)
  percent: number;
}
