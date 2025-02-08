import { Injectable } from '@nestjs/common'
import { CatIngredientRepo } from './entities/cat-ingredient.repo'
import { CatIngredientQuery } from './entities/cat-ingredient.query'
import { CreateCatIngredientDto } from './dto/create-cat-ingredient.dto'
import { CatIngredientEntity } from './entities/cat-ingredient.entity'
import { IAccount } from 'src/guard/interface/account.interface'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { UpdateCatIngredientDto } from './dto/update-cat-ingredient.dto'
import { UpdateResult } from 'typeorm'
import { UpdateStatusCatIngredientDto } from './dto/update-status-cat-ingredient.dto'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { ICatIngredientService } from './cat-ingredient.interface'

@Injectable()
export class CatIngredientService implements ICatIngredientService {
  constructor(
    private readonly catIngredientRepo: CatIngredientRepo,
    private readonly catIngredientQuery: CatIngredientQuery
  ) {}

  async createCatIngredient(
    createCatIngredientDto: CreateCatIngredientDto,
    account: IAccount
  ): Promise<CatIngredientEntity> {
    try {
      return this.catIngredientRepo.createCatIngredient({
        cat_igd_name: createCatIngredientDto.cat_igd_name,
        cat_igd_description: createCatIngredientDto.cat_igd_description,
        cat_igd_res_id: account.account_restaurant_id,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'createCatIngredient',
        class: 'CatIngredientService',
        function: 'createCatIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneById(cat_igd_id: string, account: IAccount): Promise<CatIngredientEntity | null> {
    try {
      return this.catIngredientQuery.findOneById(cat_igd_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'CatIngredientService',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateCatIngredient(updateCatIngredientDto: UpdateCatIngredientDto, account: IAccount): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.catIngredientQuery.findOneById(updateCatIngredientDto.cat_igd_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Danh mục nguyên liệu không tồn tại')
      }
      return this.catIngredientRepo.updateCatIngredient({
        cat_igd_name: updateCatIngredientDto.cat_igd_name,
        cat_igd_description: updateCatIngredientDto.cat_igd_description,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        cat_igd_res_id: account.account_restaurant_id,
        cat_igd_id: updateCatIngredientDto.cat_igd_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'updateCatIngredient',
        class: 'CatIngredientService',
        function: 'updateCatIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteCatIngredient(cat_igd_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.catIngredientQuery.findOneById(cat_igd_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Danh mục nguyên liệu không tồn tại')
      }
      return this.catIngredientRepo.deleteCatIngredient(cat_igd_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'deleteCatIngredient',
        class: 'CatIngredientService',
        function: 'deleteCatIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreCatIngredient(cat_igd_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.catIngredientQuery.findOneById(cat_igd_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Danh mục nguyên liệu không tồn tại')
      }
      return this.catIngredientRepo.restoreCatIngredient(cat_igd_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'restoreCatIngredient',
        class: 'CatIngredientService',
        function: 'restoreCatIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusCatIngredient(
    updateStatusCatIngredientDto: UpdateStatusCatIngredientDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.catIngredientQuery.findOneById(
        updateStatusCatIngredientDto.cat_igd_id,
        account
      )
      if (!catIngredientExist) {
        throw new BadRequestError('Danh mục nguyên liệu không tồn tại')
      }
      return this.catIngredientRepo.updateStatusCatIngredient(updateStatusCatIngredientDto, account)
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusCatIngredient',
        class: 'CatIngredientService',
        function: 'updateStatusCatIngredient',
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
      cat_igd_name
    }: {
      pageSize: number
      pageIndex: number
      cat_igd_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<CatIngredientEntity>> {
    try {
      if (!cat_igd_name && typeof cat_igd_name !== 'string') {
        throw new BadRequestError('Danh mục nguyên liệu không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataCatIngredient = await this.catIngredientQuery.findAllPagination(
        { pageSize, pageIndex, cat_igd_name, isDeleted: 0 },
        account
      )

      return dataCatIngredient
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'CatIngredientService',
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
      cat_igd_name
    }: {
      pageSize: number
      pageIndex: number
      cat_igd_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<CatIngredientEntity>> {
    try {
      if (!cat_igd_name && typeof cat_igd_name !== 'string') {
        throw new BadRequestError('Danh mục nguyên liệu không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataCatIngredient = await this.catIngredientQuery.findAllPagination(
        { pageSize, pageIndex, cat_igd_name, isDeleted: 1 },
        account
      )

      return dataCatIngredient
    } catch (error) {
      saveLogSystem({
        action: 'findAllRecycle',
        class: 'CatIngredientService',
        function: 'findAllRecycle',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllCatName(account: IAccount): Promise<CatIngredientEntity[]> {
    try {
      return this.catIngredientQuery.findAllCatName(account)
    } catch (error) {
      saveLogSystem({
        action: 'findAllCatName',
        class: 'CatIngredientService',
        function: 'findAllCatName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
