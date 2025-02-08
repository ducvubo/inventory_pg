import { UpdateResult } from 'typeorm'
import { CatIngredientEntity } from './entities/cat-ingredient.entity'
import { CreateCatIngredientDto } from './dto/create-cat-ingredient.dto'
import { UpdateCatIngredientDto } from './dto/update-cat-ingredient.dto'
import { UpdateStatusCatIngredientDto } from './dto/update-status-cat-ingredient.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { ResultPagination } from 'src/interface/resultPagination.interface'

export interface ICatIngredientService {
  createCatIngredient(createCatIngredientDto: CreateCatIngredientDto, account: IAccount): Promise<CatIngredientEntity>

  findOneById(cat_igd_id: string, account: IAccount): Promise<CatIngredientEntity | null>

  updateCatIngredient(updateCatIngredientDto: UpdateCatIngredientDto, account: IAccount): Promise<UpdateResult>

  deleteCatIngredient(cat_igd_id: string, account: IAccount): Promise<UpdateResult>

  restoreCatIngredient(cat_igd_id: string, account: IAccount): Promise<UpdateResult>

  updateStatusCatIngredient(
    updateStatusCatIngredientDto: UpdateStatusCatIngredientDto,
    account: IAccount
  ): Promise<UpdateResult>

  findAll(
    params: {
      pageSize: number
      pageIndex: number
      cat_igd_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<CatIngredientEntity>>

  findAllRecycle(
    params: {
      pageSize: number
      pageIndex: number
      cat_igd_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<CatIngredientEntity>>

  findAllCatName(account: IAccount): Promise<CatIngredientEntity[]>
}
