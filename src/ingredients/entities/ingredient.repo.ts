import { Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { INGREDIENT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { OnModuleInit } from '@nestjs/common'
import { IngredientEntity } from './ingredient.entity'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateStatusIngredientDto } from '../dto/update-status-ingredient.dto'
import { Injectable } from '@nestjs/common'

@Injectable()
export class IngredientRepo implements OnModuleInit {
  constructor(
    @InjectRepository(IngredientEntity)
    private readonly ingredientRepository: Repository<IngredientEntity>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: IngredientEntity[] = await this.ingredientRepository.find()
    const indexExist = await indexElasticsearchExists(INGREDIENT_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(INGREDIENT_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(INGREDIENT_ELASTICSEARCH_INDEX, doc.igd_id.toString(), doc)
    }
  }

  async createIngredient(ingredient: IngredientEntity): Promise<IngredientEntity> {
    try {
      return this.ingredientRepository.save(ingredient)
    } catch (error) {
      saveLogSystem({
        action: 'createIngredient',
        class: 'IngredientRepo',
        function: 'createIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateIngredient(ingredient: IngredientEntity): Promise<UpdateResult> {
    try {
      return await this.ingredientRepository
        .createQueryBuilder()
        .update(IngredientEntity)
        .set({
          igd_name: ingredient.igd_name,
          igd_description: ingredient.igd_description,
          igd_image: ingredient.igd_image,
          cat_igd_id: ingredient.cat_igd_id,
          updatedBy: ingredient.updatedBy,
          igd_id: ingredient.igd_id,
          unt_id: ingredient.unt_id
        })
        .where({
          igd_id: ingredient.igd_id,
          igd_res_id: ingredient.igd_res_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateIngredient',
        class: 'IngredientRepo',
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
      return await this.ingredientRepository
        .createQueryBuilder()
        .update(IngredientEntity)
        .set({
          isDeleted: 1,
          igd_id: igd_id,
          deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: new Date()
        })
        .where({
          igd_id: igd_id,
          igd_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'deleteIngredient',
        class: 'IngredientRepo',
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
      return await this.ingredientRepository
        .createQueryBuilder()
        .update(IngredientEntity)
        .set({
          isDeleted: 0,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: null,
          deletedBy: null,
          igd_id: igd_id
        })
        .where({
          igd_id: igd_id,
          igd_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'restoreIngredient',
        class: 'IngredientRepo',
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
      return await this.ingredientRepository
        .createQueryBuilder()
        .update(IngredientEntity)
        .set({
          igd_status: updateStatusIngredientDto.igd_status,
          igd_id: updateStatusIngredientDto.igd_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({
          igd_id: updateStatusIngredientDto.igd_id,
          igd_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusIngredient',
        class: 'IngredientRepo',
        function: 'updateStatusIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
