import { Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { CAT_INGREDIENT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { CatIngredientEntity } from './cat-ingredient.entity'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateStatusCatIngredientDto } from '../dto/update-status-cat-ingredient.dto'

@Injectable()
export class CatIngredientRepo implements OnModuleInit {
  constructor(
    @InjectRepository(CatIngredientEntity)
    private readonly catIngredientRepository: Repository<CatIngredientEntity>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: CatIngredientEntity[] = await this.catIngredientRepository.find()
    const indexExist = await indexElasticsearchExists(CAT_INGREDIENT_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(CAT_INGREDIENT_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(CAT_INGREDIENT_ELASTICSEARCH_INDEX, doc.cat_igd_id.toString(), doc)
    }
  }

  async createCatIngredient(catIngredient: CatIngredientEntity): Promise<CatIngredientEntity> {
    try {
      return this.catIngredientRepository.save(catIngredient)
    } catch (error) {
      saveLogSystem({
        action: 'createCatIngredient',
        class: 'CatIngredientRepo',
        function: 'createCatIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateCatIngredient(catIngredient: CatIngredientEntity): Promise<UpdateResult> {
    try {
      return await this.catIngredientRepository
        .createQueryBuilder()
        .update(CatIngredientEntity)
        .set({
          cat_igd_name: catIngredient.cat_igd_name,
          cat_igd_description: catIngredient.cat_igd_description,
          updatedBy: catIngredient.updatedBy,
          cat_igd_id: catIngredient.cat_igd_id
        })
        .where({
          cat_igd_id: catIngredient.cat_igd_id,
          cat_igd_res_id: catIngredient.cat_igd_res_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateCatIngredient',
        class: 'CatIngredientRepo',
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
      return await this.catIngredientRepository
        .createQueryBuilder()
        .update(CatIngredientEntity)
        .set({
          isDeleted: 1,
          cat_igd_id: cat_igd_id,
          deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: new Date()
        })
        .where({
          cat_igd_id: cat_igd_id,
          cat_igd_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'deleteCatIngredient',
        class: 'CatIngredientRepo',
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
      return await this.catIngredientRepository
        .createQueryBuilder()
        .update(CatIngredientEntity)
        .set({
          isDeleted: 0,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: null,
          deletedBy: null,
          cat_igd_id: cat_igd_id
        })
        .where({
          cat_igd_id: cat_igd_id,
          cat_igd_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'restoreCatIngredient',
        class: 'CatIngredientRepo',
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
      return await this.catIngredientRepository
        .createQueryBuilder()
        .update(CatIngredientEntity)
        .set({
          cat_igd_status: updateStatusCatIngredientDto.cat_igd_status,
          cat_igd_id: updateStatusCatIngredientDto.cat_igd_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({
          cat_igd_id: updateStatusCatIngredientDto.cat_igd_id,
          cat_igd_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusCatIngredient',
        class: 'CatIngredientRepo',
        function: 'updateStatusCatIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
