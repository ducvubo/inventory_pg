import { Module } from '@nestjs/common'
import { StockInService } from './stock-in.service'
import { StockInController } from './stock-in.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StockInEntity } from './entities/stock-in.entity'
import { StockInRepo } from './entities/stock-in.repo'
import { StockInQuery } from './entities/stock-in.query'
import { SuppliersModule } from 'src/suppliers/suppliers.module'
import { IngredientsModule } from 'src/ingredients/ingredients.module'
import { StockInItemModule } from 'src/stock-in-item/stock-in-item.module'

@Module({
  imports: [TypeOrmModule.forFeature([StockInEntity]), SuppliersModule, IngredientsModule, StockInItemModule],
  controllers: [StockInController],
  providers: [StockInService, StockInRepo, StockInQuery]
})
export class StockInModule {}
