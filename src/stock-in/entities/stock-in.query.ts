import { Injectable } from '@nestjs/common'
import { getElasticsearch } from 'src/config/elasticsearch.config'
import { StockInEntity } from './stock-in.entity'
import { IAccount } from 'src/guard/interface/account.interface'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { STOCK_IN_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { StockInItemQuery } from 'src/stock-in-item/entities/stock-in-item.query'

@Injectable()
export class StockInQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect

  constructor(private readonly stockInInItemQuery: StockInItemQuery) { }

  async findOneByCode(stki_code: string, account: IAccount): Promise<StockInEntity> {
    try {
      const indexExist = await indexElasticsearchExists(STOCK_IN_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: STOCK_IN_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    stki_code: {
                      query: stki_code,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    stki_res_id: {
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
        class: 'StockInQuery',
        function: 'findOneByCode',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneByCodeWithUpdate(stki_code: string, account: IAccount): Promise<StockInEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(STOCK_IN_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: STOCK_IN_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    stki_code: {
                      query: stki_code,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    stki_res_id: {
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
        class: 'StockInQuery',
        function: 'findOneByCodeWithUpdate',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneById(stki_id: string, account: IAccount): Promise<StockInEntity> {
    try {
      const indexExist = await indexElasticsearchExists(STOCK_IN_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: STOCK_IN_ELASTICSEARCH_INDEX,
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
                    stki_res_id: {
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

      const stock_in_items = await this.stockInInItemQuery.findOneByStockInId(stki_id, account)

      const stockIn = (result.hits?.hits[0]?._source as StockInEntity) || null
      if (stockIn) {
        stockIn.items = stock_in_items
      }
      return stockIn
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'StockInQuery',
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
      stki_code,
      pageSize,
      pageIndex,
      isDeleted
    }: { stki_code: string; pageSize: number; pageIndex: number; isDeleted: number },
    account: IAccount
  ): Promise<ResultPagination<StockInEntity>> {
    try {
      const indexExist = await indexElasticsearchExists(STOCK_IN_ELASTICSEARCH_INDEX)

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

      if (stki_code?.trim() !== '') {
        query.bool.must.push({
          match: {
            stki_code: {
              query: stki_code,
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
            stki_res_id: {
              query: account.account_restaurant_id,
              operator: 'and'
            }
          }
        }
      )

      const result = await this.elasticSearch.search({
        index: STOCK_IN_ELASTICSEARCH_INDEX,
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
          const items = await this.stockInInItemQuery.findOneByStockInId(hit._source.stki_id, account)
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
        class: 'StockInQuery',
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
