import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums';

export class SignupDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ngP@ss', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    enum: [Role.BUYER, Role.SELLER],
    default: Role.BUYER,
    description: 'Account type chosen at signup (admin cannot self-register).',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role.BUYER | Role.SELLER;
}
