import { UpdateResult } from 'typeorm'
import { IngredientEntity } from './entities/ingredient.entity'
import { CreateIngredientDto } from './dto/create-ingredient.dto'
import { UpdateIngredientDto } from './dto/update-ingredient.dto'
import { UpdateStatusIngredientDto } from './dto/update-status-ingredient.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { ResultPagination } from 'src/interface/resultPagination.interface'

export interface IIngredientsService {
  createIngredient(createIngredientDto: CreateIngredientDto, account: IAccount): Promise<IngredientEntity>

  findOneById(igd_id: string, account: IAccount): Promise<IngredientEntity | null>

  updateIngredient(updateIngredientDto: UpdateIngredientDto, account: IAccount): Promise<UpdateResult>

  deleteIngredient(igd_id: string, account: IAccount): Promise<UpdateResult>

  restoreIngredient(igd_id: string, account: IAccount): Promise<UpdateResult>

  updateStatusIngredient(updateStatusIngredientDto: UpdateStatusIngredientDto, account: IAccount): Promise<UpdateResult>

  findAll(
    params: {
      pageSize: number
      pageIndex: number
      igd_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<IngredientEntity>>

  findAllRecycle(
    params: {
      pageSize: number
      pageIndex: number
      igd_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<IngredientEntity>>

  getAllIngredientName(account: IAccount): Promise<IngredientEntity[]>
}
