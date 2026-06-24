import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSetting } from './entities/platform-setting.entity';

const SINGLETON_ID = 1;

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(PlatformSetting)
    private readonly settingsRepo: Repository<PlatformSetting>,
    private readonly config: ConfigService,
  ) {}

  /** Loads the singleton settings row, lazily creating it from config defaults. */
  async get(): Promise<PlatformSetting> {
    let setting = await this.settingsRepo.findOne({
      where: { id: SINGLETON_ID },
    });
    if (!setting) {
      setting = this.settingsRepo.create({
        id: SINGLETON_ID,
        commissionPercent:
          this.config.get<number>('stripe.platformFeePercent') ?? 10,
      });
      setting = await this.settingsRepo.save(setting);
    }
    return setting;
  }

  async getCommissionPercent(): Promise<number> {
    return (await this.get()).commissionPercent;
  }

  async setCommissionPercent(percent: number): Promise<PlatformSetting> {
    const setting = await this.get();
    setting.commissionPercent = percent;
    return this.settingsRepo.save(setting);
  }
}
