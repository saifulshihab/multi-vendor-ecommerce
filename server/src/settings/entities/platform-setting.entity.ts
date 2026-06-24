import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Single-row table (id is always 1) holding platform-wide configuration that an
 * admin can change at runtime, such as the commission percentage.
 */
@Entity('platform_settings')
export class PlatformSetting {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ type: 'int', default: 10 })
  commissionPercent: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
