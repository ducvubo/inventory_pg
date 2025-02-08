import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { STOCK_OUT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { StockOutEntity } from './stock-out.entity'

@Injectable()
export class StockOutRepo implements OnModuleInit {
  constructor(
    @InjectRepository(StockOutEntity)
    private readonly stockOutRepository: Repository<StockOutEntity>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: StockOutEntity[] = await this.stockOutRepository.find()
    const indexExist = await indexElasticsearchExists(STOCK_OUT_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(STOCK_OUT_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(STOCK_OUT_ELASTICSEARCH_INDEX, doc.stko_id.toString(), doc)
    }
  }
}
