import { Module } from '@nestjs/common'
import { IngredientsService } from './ingredients.service'
import { IngredientsController } from './ingredients.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IngredientEntity } from './entities/ingredient.entity'
import { IngredientRepo } from './entities/ingredient.repo'
import { IngredientQuey } from './entities/ingredient.query'
import { UnitsModule } from 'src/units/units.module'
import { CatIngredientModule } from 'src/cat-ingredient/cat-ingredient.module'
import { StockOutItemEntity } from 'src/stok-out-item/entities/stock-out-item.entity'
import { StockInItemEntity } from 'src/stock-in-item/entities/stock-in-item.entity'
import { StockInEntity } from 'src/stock-in/entities/stock-in.entity'
import { StockOutEntity } from 'src/stok-out/entities/stock-out.entity'
import { CatIngredientEntity } from 'src/cat-ingredient/entities/cat-ingredient.entity'

@Module({
  imports: [TypeOrmModule.forFeature([StockInItemEntity,
    StockOutItemEntity,
    IngredientEntity,
    StockInEntity,
    StockOutEntity,
    CatIngredientEntity,]), UnitsModule, CatIngredientModule],
  controllers: [IngredientsController],
  providers: [IngredientsService, IngredientRepo, IngredientQuey],
  exports: [IngredientsService, IngredientRepo, IngredientQuey]
})
export class IngredientsModule { }
