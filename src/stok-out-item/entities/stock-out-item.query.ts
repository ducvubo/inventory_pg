import { Injectable } from '@nestjs/common'
import { getElasticsearch } from 'src/config/elasticsearch.config'
import { STOCK_OUT_ITEM_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { StockOutItemEntity } from './stock-out-item.entity'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { IAccount } from 'src/guard/interface/account.interface'

@Injectable()
export class StockOutItemQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect

  async findOneByStockOutId(stko_id: string, account: IAccount): Promise<StockOutItemEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(STOCK_OUT_ITEM_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: STOCK_OUT_ITEM_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    stko_id: {
                      query: stko_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    stko_item_res_id: {
                      query: account.account_restaurant_id,
                      operator: 'and'
                    }
                  }
                }
              ]
            },
          },
          from: 0,
          size: 10000,
        }
      })

      return result.hits?.hits.map((item) => item._source) || []
    } catch (error) {
      saveLogSystem({
        action: 'findOneByStockOutId',
        class: 'StockOutItemQuery',
        function: 'findOneByStockOutId',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })

      throw new ServerErrorDefault(error)
    }
  }
}
