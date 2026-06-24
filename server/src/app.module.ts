import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import configuration from './config/configuration';
import { dataSourceOptions } from './config/data-source';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { StripeModule } from './stripe/stripe.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { SellerModule } from './seller/seller.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { CheckoutModule } from './checkout/checkout.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SettingsModule } from './settings/settings.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        entities: dataSourceOptions.entities,
        migrations: dataSourceOptions.migrations,
        synchronize: false,
        logging: dataSourceOptions.logging,
        autoLoadEntities: true,
      }),
    }),
    MailModule,
    StripeModule,
    CloudinaryModule,
    AuthModule,
    UsersModule,
    StoresModule,
    ProductsModule,
    CategoriesModule,
    SellerModule,
    CartModule,
    OrdersModule,
    CheckoutModule,
    ReviewsModule,
    SettingsModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
