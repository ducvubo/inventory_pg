import { Module } from '@nestjs/common'
import { StockOutService } from './stock-out.service'
import { StockOutController } from './stock-out.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StockOutEntity } from './entities/stock-out.entity'
import { StockOutRepo } from './entities/stock-out.repo'
import { StockOutQuery } from './entities/stock-out.query'
import { SuppliersModule } from 'src/suppliers/suppliers.module'
import { IngredientsModule } from 'src/ingredients/ingredients.module'
import { StokOutItemModule } from 'src/stok-out-item/stok-out-item.module'

@Module({
  imports: [TypeOrmModule.forFeature([StockOutEntity]), SuppliersModule, IngredientsModule, StokOutItemModule],
  controllers: [StockOutController],
  providers: [StockOutService, StockOutRepo, StockOutQuery]
})
export class StockOutModule {}
