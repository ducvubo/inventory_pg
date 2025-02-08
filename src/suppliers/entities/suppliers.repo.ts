import { Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { SUPPLIER_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { OnModuleInit } from '@nestjs/common'
import { SupplierEntity } from './suppliers.entity'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateStatusSupplierDto } from '../dto/update-status-supplier.dto'
import { Injectable } from '@nestjs/common'

@Injectable()
export class SupplierRepo implements OnModuleInit {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly supplierRepository: Repository<SupplierEntity>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: SupplierEntity[] = await this.supplierRepository.find()
    const indexExist = await indexElasticsearchExists(SUPPLIER_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(SUPPLIER_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(SUPPLIER_ELASTICSEARCH_INDEX, doc.spli_id.toString(), doc)
    }
  }

  async createSupplier(supplier: SupplierEntity): Promise<SupplierEntity> {
    try {
      return await this.supplierRepository.save(supplier)
    } catch (error) {
      saveLogSystem({
        action: 'createSupplier',
        class: 'SupplierRepo',
        function: 'createSupplier',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateSupplier(supplier: SupplierEntity): Promise<UpdateResult> {
    try {
      return await this.supplierRepository
        .createQueryBuilder()
        .update(SupplierEntity)
        .set(supplier)
        .where({
          spli_id: supplier.spli_id,
          spli_res_id: supplier.spli_res_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateSupplier',
        class: 'SupplierRepo',
        function: 'updateSupplier',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteSupplier(id: string, account: IAccount): Promise<UpdateResult> {
    try {
      return await this.supplierRepository
        .createQueryBuilder()
        .update(SupplierEntity)
        .set({
          deletedAt: new Date(),
          spli_id: id,
          deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          isDeleted: 1
        })
        .where({
          spli_id: id,
          spli_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'deleteSupplier',
        class: 'SupplierRepo',
        function: 'deleteSupplier',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreSupplier(id: string, account: IAccount): Promise<UpdateResult> {
    try {
      return await this.supplierRepository
        .createQueryBuilder()
        .update(SupplierEntity)
        .set({
          isDeleted: 0,
          deletedAt: null,
          deletedBy: null,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          spli_id: id
        })
        .where({
          spli_id: id,
          spli_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'restoreSupplier',
        class: 'SupplierRepo',
        function: 'restoreSupplier',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusSupplier(
    updateStatusSupplierDto: UpdateStatusSupplierDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      return await this.supplierRepository
        .createQueryBuilder()
        .update(SupplierEntity)
        .set({
          spli_id: updateStatusSupplierDto.spli_id,
          spli_status: updateStatusSupplierDto.spli_status,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({
          spli_id: updateStatusSupplierDto.spli_id,
          spli_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusSupplier',
        class: 'SupplierRepo',
        function: 'updateStatusSupplier',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
