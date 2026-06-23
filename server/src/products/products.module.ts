import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Store } from '../stores/entities/store.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { StoreOwnerGuard } from '../common/guards/store-owner.guard';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Store]), StoresModule],
  controllers: [ProductsController],
  providers: [ProductsService, StoreOwnerGuard],
  exports: [ProductsService],
})
export class ProductsModule {}
