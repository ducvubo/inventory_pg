import { Module } from '@nestjs/common'
import { StockInItemService } from './stock-in-item.service'
import { StockInItemController } from './stock-in-item.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StockInItemEntity } from './entities/stock-in-item.entity'
import { StockInItemRepo } from './entities/stock-in-item.repo'
import { StockInItemQuery } from './entities/stock-in-item.query'

@Module({
  imports: [TypeOrmModule.forFeature([StockInItemEntity])],
  controllers: [StockInItemController],
  providers: [StockInItemService, StockInItemRepo, StockInItemQuery],
  exports: [StockInItemService, StockInItemRepo, StockInItemQuery]
})
export class StockInItemModule {}
