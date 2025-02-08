import { Injectable } from '@nestjs/common'
import { getElasticsearch } from 'src/config/elasticsearch.config'
import { STOCK_OUT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { IAccount } from 'src/guard/interface/account.interface'
import { saveLogSystem } from 'src/log/sendLog.els'
import { StockOutItemQuery } from 'src/stok-out-item/entities/stock-out-item.query'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { StockOutEntity } from './stock-out.entity'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { ResultPagination } from 'src/interface/resultPagination.interface'

@Injectable()
export class StockOutQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect

  constructor(private readonly stockOutItemQuery: StockOutItemQuery) {}

  async findOneByCode(stko_code: string, account: IAccount): Promise<StockOutEntity> {
    try {
      const indexExist = await indexElasticsearchExists(STOCK_OUT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: STOCK_OUT_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    stko_code: {
                      query: stko_code,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    stko_res_id: {
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

      return result.hits?.hits[0]?._source || null
    } catch (error) {
      saveLogSystem({
        action: 'findOneByCode',
        class: 'StockOutQuery',
        function: 'findOneByCode',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneByCodeWithUpdate(stko_code: string, account: IAccount): Promise<StockOutEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(STOCK_OUT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: STOCK_OUT_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    stko_code: {
                      query: stko_code,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    stko_res_id: {
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

      // trả về tất cả dữ liệu của stock in
      const data = result.hits?.hits && result.hits?.hits.length > 0 ? result.hits.hits.map((item) => item._source) : []
      return data
    } catch (error) {
      saveLogSystem({
        action: 'findOneByCodeWithUpdate',
        class: 'StockOutQuery',
        function: 'findOneByCodeWithUpdate',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneById(stko_id: string, account: IAccount): Promise<StockOutEntity> {
    try {
      const indexExist = await indexElasticsearchExists(STOCK_OUT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: STOCK_OUT_ELASTICSEARCH_INDEX,
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
                    stko_res_id: {
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

      const stock_out_items = await this.stockOutItemQuery.findOneByStockOutId(stko_id, account)

      const stockIn = (result.hits?.hits[0]?._source as StockOutEntity) || null
      if (stockIn) {
        stockIn.items = stock_out_items
      }
      return stockIn
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'StockOutQuery',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllPagination(
    {
      stko_code,
      pageSize,
      pageIndex,
      isDeleted
    }: { stko_code: string; pageSize: number; pageIndex: number; isDeleted: number },
    account: IAccount
  ): Promise<ResultPagination<StockOutEntity>> {
    try {
      const indexExist = await indexElasticsearchExists(STOCK_OUT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return {
          meta: {
            current: pageIndex,
            pageSize,
            totalPage: 0,
            totalItem: 0
          },
          result: []
        }
      }

      const from = (pageIndex - 1) * pageSize
      const query: any = {
        bool: {
          must: []
        }
      }

      if (stko_code?.trim() !== '') {
        query.bool.must.push({
          match: {
            stko_code: {
              query: stko_code,
              operator: 'and'
            }
          }
        })
      }

      query.bool.must.push(
        {
          match: {
            isDeleted: {
              query: isDeleted,
              operator: 'and'
            }
          }
        },
        {
          match: {
            stko_res_id: {
              query: account.account_restaurant_id,
              operator: 'and'
            }
          }
        }
      )

      const result = await this.elasticSearch.search({
        index: STOCK_OUT_ELASTICSEARCH_INDEX,
        body: {
          query,
          from,
          size: pageSize,
          sort: [{ updatedAt: { order: 'desc' } }]
        }
      })
      const hits = result.hits?.hits || []
      let totalRecords = 0
      if (typeof result.hits?.total === 'object') {
        totalRecords = result.hits.total.value
      } else if (typeof result.hits?.total === 'number') {
        totalRecords = result.hits.total
      }
      const totalPages = Math.ceil(totalRecords / pageSize)
      const results = await Promise.all(
        hits.map(async (hit: any) => {
          const items = await this.stockOutItemQuery.findOneByStockOutId(hit._source.stko_id, account)
          return {
            ...hit._source,
            items
          }
        })
      )

      return {
        meta: {
          current: pageIndex,
          pageSize,
          totalPage: totalPages,
          totalItem: totalRecords
        },
        result: results
      }
    } catch (error) {
      saveLogSystem({
        action: 'findAllPagination',
        class: 'StockOutQuery',
        function: 'findAllPagination',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
