import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { STOCK_IN_ITEM_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { StockInItemEntity } from './stock-in-item.entity'

@Injectable()
export class StockInItemRepo implements OnModuleInit {
  constructor(
    @InjectRepository(StockInItemEntity)
    private readonly stockInItemRepository: Repository<StockInItemEntity>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: StockInItemEntity[] = await this.stockInItemRepository.find()
    const indexExist = await indexElasticsearchExists(STOCK_IN_ITEM_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(STOCK_IN_ITEM_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(STOCK_IN_ITEM_ELASTICSEARCH_INDEX, doc.stki_item_id.toString(), doc)
    }
  }
}
