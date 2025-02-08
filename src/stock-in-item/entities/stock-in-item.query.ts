import { Injectable } from '@nestjs/common'
import { getElasticsearch } from 'src/config/elasticsearch.config'
import { IAccount } from 'src/guard/interface/account.interface'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { StockInItemEntity } from './stock-in-item.entity'
import { STOCK_IN_ITEM_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'

@Injectable()
export class StockInItemQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect

  async findOneByStockInId(stki_id: string, account: IAccount): Promise<StockInItemEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(STOCK_IN_ITEM_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: STOCK_IN_ITEM_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    stki_id: {
                      query: stki_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    stki_item_res_id: {
                      query: account.account_restaurant_id,
                      operator: 'and'
                    }
                  }
                }
              ]
            }
          }
        }
      })

      return result.hits?.hits.map((item) => item._source) || []
    } catch (error) {
      saveLogSystem({
        action: 'findOneByStockInId',
        class: 'StockInItemQuery',
        function: 'findOneByStockInId',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })

      throw new ServerErrorDefault(error)
    }
  }
}
