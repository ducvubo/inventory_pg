import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { STOCK_IN_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { StockInEntity } from './stock-in.entity'

@Injectable()
export class StockInRepo implements OnModuleInit {
  constructor(
    @InjectRepository(StockInEntity)
    private readonly stockInRepository: Repository<StockInEntity>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: StockInEntity[] = await this.stockInRepository.find()
    const indexExist = await indexElasticsearchExists(STOCK_IN_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(STOCK_IN_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(STOCK_IN_ELASTICSEARCH_INDEX, doc.stki_id.toString(), doc)
    }
  }
}
