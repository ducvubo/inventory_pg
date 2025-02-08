import { Module } from '@nestjs/common'
import { StokOutItemService } from './stok-out-item.service'
import { StokOutItemController } from './stok-out-item.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StockOutItemEntity } from './entities/stock-out-item.entity'
import { StockOutItemRepo } from './entities/stock-out-item.repo'
import { StockOutItemQuery } from './entities/stock-out-item.query'

@Module({
  imports: [TypeOrmModule.forFeature([StockOutItemEntity])],
  controllers: [StokOutItemController],
  providers: [StokOutItemService, StockOutItemQuery, StockOutItemRepo],
  exports: [StokOutItemService, StockOutItemRepo, StockOutItemQuery]
})
export class StokOutItemModule {}
