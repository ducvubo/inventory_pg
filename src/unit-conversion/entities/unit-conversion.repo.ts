import { DeleteResult, Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { UNIT_CONVERSION_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { OnModuleInit } from '@nestjs/common'
import { UnitConversionEntity } from './unit-conversion.entity'
import { getElasticsearch } from 'src/config/elasticsearch.config'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'

export class UnitConversionRepo implements OnModuleInit {
  private readonly elasticSearch = getElasticsearch().instanceConnect
  constructor(
    @InjectRepository(UnitConversionEntity)
    private readonly unitConversionRepository: Repository<UnitConversionEntity>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: UnitConversionEntity[] = await this.unitConversionRepository.find()
    const indexExist = await indexElasticsearchExists(UNIT_CONVERSION_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(UNIT_CONVERSION_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(UNIT_CONVERSION_ELASTICSEARCH_INDEX, doc.unt_cvs_id.toString(), doc)
    }
  }

  async createUnitConversion(unitConversion: UnitConversionEntity): Promise<UnitConversionEntity> {
    try {
      return this.unitConversionRepository.save(unitConversion)
    } catch (error) {
      saveLogSystem({
        action: 'createUnitConversion',
        class: 'UnitConversionRepo',
        function: 'createUnitConversion',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteUnitConversion(unt_cvs_id: string): Promise<DeleteResult> {
    try {
      await this.elasticSearch.delete({
        index: UNIT_CONVERSION_ELASTICSEARCH_INDEX,
        id: unt_cvs_id
      })
      return await this.unitConversionRepository.delete(unt_cvs_id)
    } catch (error) {
      saveLogSystem({
        action: 'deleteUnitConversion',
        class: 'UnitConversionRepo',
        function: 'deleteUnitConversion',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
    }
  }

  async updateUnitConversion(unitConversion: UnitConversionEntity): Promise<UpdateResult> {
    try {
      return this.unitConversionRepository
        .createQueryBuilder()
        .update(UnitConversionEntity)
        .set({
          unt_cvs_id: unitConversion.unt_cvs_id,
          unt_cvs_value: unitConversion.unt_cvs_value,
          updatedBy: unitConversion.updatedBy
        })
        .where({
          unt_cvs_id: unitConversion.unt_cvs_id,
          unt_cvs_res_id: unitConversion.unt_cvs_res_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateUnitConversion',
        class: 'UnitConversionRepo',
        function: 'updateUnitConversion',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
