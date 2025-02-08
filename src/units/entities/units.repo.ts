import { Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { UNIT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { UnitEntity } from './units.entity'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateStatusUnitDto } from '../dto/update-status-unit.dto'

@Injectable()
export class UnitRepo implements OnModuleInit {
  constructor(
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: UnitEntity[] = await this.unitRepository.find()
    const indexExist = await indexElasticsearchExists(UNIT_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(UNIT_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(UNIT_ELASTICSEARCH_INDEX, doc.unt_id.toString(), doc)
    }
  }

  async createUnit(unit: UnitEntity): Promise<UnitEntity> {
    try {
      return this.unitRepository.save(unit)
    } catch (error) {
      saveLogSystem({
        action: 'createUnit',
        class: 'UnitRepo',
        function: 'createUnit',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateUnit(unit: UnitEntity): Promise<UpdateResult> {
    try {
      return await this.unitRepository
        .createQueryBuilder()
        .update(UnitEntity)
        .set({
          unt_name: unit.unt_name,
          unt_description: unit.unt_description,
          unt_symbol: unit.unt_symbol,
          updatedBy: unit.updatedBy,
          unt_id: unit.unt_id
        })
        .where({
          unt_id: unit.unt_id,
          unt_res_id: unit.unt_res_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateUnit',
        class: 'UnitRepo',
        function: 'updateUnit',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteUnit(unt_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      return await this.unitRepository
        .createQueryBuilder()
        .update(UnitEntity)
        .set({
          isDeleted: 1,
          unt_id: unt_id,
          deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: new Date()
        })
        .where({
          unt_id: unt_id,
          unt_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'deleteUnit',
        class: 'UnitRepo',
        function: 'deleteUnit',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreUnit(unt_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      return await this.unitRepository
        .createQueryBuilder()
        .update(UnitEntity)
        .set({
          isDeleted: 0,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: null,
          deletedBy: null,
          unt_id: unt_id
        })
        .where({
          unt_id: unt_id,
          unt_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'restoreUnit',
        class: 'UnitRepo',
        function: 'restoreUnit',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusUnit(updateStatusUnitDto: UpdateStatusUnitDto, account: IAccount): Promise<UpdateResult> {
    try {
      return await this.unitRepository
        .createQueryBuilder()
        .update(UnitEntity)
        .set({
          unt_status: updateStatusUnitDto.unt_status,
          unt_id: updateStatusUnitDto.unt_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({
          unt_id: updateStatusUnitDto.unt_id,
          unt_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusUnit',
        class: 'UnitRepo',
        function: 'updateStatusUnit',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
