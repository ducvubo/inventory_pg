import { Injectable } from '@nestjs/common'
import { IngredientRepo } from './entities/ingredient.repo'
import { IngredientQuey } from './entities/ingredient.query'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { IngredientEntity } from './entities/ingredient.entity'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateStatusIngredientDto } from './dto/update-status-ingredient.dto'
import { UpdateResult } from 'typeorm'
import { CreateIngredientDto } from './dto/create-ingredient.dto'
import { UpdateIngredientDto } from './dto/update-ingredient.dto'
import { IIngredientsService } from './ingredients.interface'

@Injectable()
export class IngredientsService implements IIngredientsService {
  constructor(
    private readonly ingredientRepo: IngredientRepo,
    private readonly ingredientQuery: IngredientQuey
  ) {}

  async createIngredient(createIngredientDto: CreateIngredientDto, account: IAccount): Promise<IngredientEntity> {
    try {
      return this.ingredientRepo.createIngredient({
        igd_name: createIngredientDto.igd_name,
        igd_description: createIngredientDto.igd_description,
        cat_igd_id: createIngredientDto.cat_igd_id,
        igd_image: createIngredientDto.igd_image,
        igd_res_id: account.account_restaurant_id,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        unt_id: createIngredientDto.unt_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'createIngredient',
        class: 'IngredientService',
        function: 'createIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneById(igd_id: string, account: IAccount): Promise<IngredientEntity | null> {
    try {
      return this.ingredientQuery.findOneById(igd_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'IngredientService',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateIngredient(updateIngredientDto: UpdateIngredientDto, account: IAccount): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.ingredientQuery.findOneById(updateIngredientDto.igd_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Nguyên liệu không tồn tại')
      }
      return this.ingredientRepo.updateIngredient({
        igd_name: updateIngredientDto.igd_name,
        igd_description: updateIngredientDto.igd_description,
        igd_image: updateIngredientDto.igd_image,
        cat_igd_id: updateIngredientDto.cat_igd_id,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        igd_res_id: account.account_restaurant_id,
        igd_id: updateIngredientDto.igd_id,
        unt_id: updateIngredientDto.unt_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'updateIngredient',
        class: 'IngredientService',
        function: 'updateIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteIngredient(igd_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.ingredientQuery.findOneById(igd_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Nguyên liệu không tồn tại')
      }
      return this.ingredientRepo.deleteIngredient(igd_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'deleteIngredient',
        class: 'IngredientService',
        function: 'deleteIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreIngredient(igd_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.ingredientQuery.findOneById(igd_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Nguyên liệu không tồn tại')
      }
      return this.ingredientRepo.restoreIngredient(igd_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'restoreIngredient',
        class: 'IngredientService',
        function: 'restoreIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusIngredient(
    updateStatusIngredientDto: UpdateStatusIngredientDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.ingredientQuery.findOneById(updateStatusIngredientDto.igd_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Nguyên liệu không tồn tại')
      }
      return this.ingredientRepo.updateStatusIngredient(updateStatusIngredientDto, account)
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusIngredient',
        class: 'IngredientService',
        function: 'updateStatusIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAll(
    {
      pageSize,
      pageIndex,
      igd_name
    }: {
      pageSize: number
      pageIndex: number
      igd_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<IngredientEntity>> {
    try {
      if (!igd_name && typeof igd_name !== 'string') {
        throw new BadRequestError('Nguyên liệu không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataIngredient = await this.ingredientQuery.findAllPagination(
        { pageSize, pageIndex, igd_name, isDeleted: 0 },
        account
      )

      return dataIngredient
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'IngredientService',
        function: 'findAll',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllRecycle(
    {
      pageSize,
      pageIndex,
      igd_name
    }: {
      pageSize: number
      pageIndex: number
      igd_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<IngredientEntity>> {
    try {
      if (!igd_name && typeof igd_name !== 'string') {
        throw new BadRequestError('Nguyên liệu không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataIngredient = await this.ingredientQuery.findAllPagination(
        { pageSize, pageIndex, igd_name, isDeleted: 1 },
        account
      )

      return dataIngredient
    } catch (error) {
      saveLogSystem({
        action: 'findAllRecycle',
        class: 'IngredientService',
        function: 'findAllRecycle',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  getAllIngredientName(account: IAccount): Promise<IngredientEntity[]> {
    try {
      return this.ingredientQuery.getAllIngredientName(account)
    } catch (error) {
      saveLogSystem({
        action: 'getAllIngredientName',
        class: 'IngredientService',
        function: 'getAllIngredientName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
