import { Module } from '@nestjs/common'
import { CatIngredientService } from './cat-ingredient.service'
import { CatIngredientController } from './cat-ingredient.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CatIngredientEntity } from './entities/cat-ingredient.entity'
import { CatIngredientQuery } from './entities/cat-ingredient.query'
import { CatIngredientRepo } from './entities/cat-ingredient.repo'

@Module({
  imports: [TypeOrmModule.forFeature([CatIngredientEntity])],
  controllers: [CatIngredientController],
  providers: [CatIngredientService, CatIngredientQuery, CatIngredientRepo],
  exports: [CatIngredientService, CatIngredientQuery, CatIngredientRepo]
})
export class CatIngredientModule {}
