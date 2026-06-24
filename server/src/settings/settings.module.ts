import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformSetting } from './entities/platform-setting.entity';
import { SettingsService } from './settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformSetting])],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
