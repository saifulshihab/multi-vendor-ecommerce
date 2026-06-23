import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiPropertyOptional({
    description: 'Override success redirect URL (defaults to FRONTEND_URL).',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  successUrl?: string;

  @ApiPropertyOptional({ description: 'Override cancel redirect URL.' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  cancelUrl?: string;
}
