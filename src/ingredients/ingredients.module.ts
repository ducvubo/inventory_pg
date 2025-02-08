import { Module } from '@nestjs/common'
import { IngredientsService } from './ingredients.service'
import { IngredientsController } from './ingredients.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IngredientEntity } from './entities/ingredient.entity'
import { IngredientRepo } from './entities/ingredient.repo'
import { IngredientQuey } from './entities/ingredient.query'
import { UnitsModule } from 'src/units/units.module'
import { CatIngredientModule } from 'src/cat-ingredient/cat-ingredient.module'

@Module({
  imports: [TypeOrmModule.forFeature([IngredientEntity]), UnitsModule, CatIngredientModule],
  controllers: [IngredientsController],
  providers: [IngredientsService, IngredientRepo, IngredientQuey],
  exports: [IngredientsService, IngredientRepo, IngredientQuey]
})
export class IngredientsModule {}
