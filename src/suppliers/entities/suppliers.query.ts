import { getElasticsearch } from 'src/config/elasticsearch.config'
import { SUPPLIER_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { IAccount } from 'src/guard/interface/account.interface'
import { saveLogSystem } from 'src/log/sendLog.els'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { SupplierEntity } from './suppliers.entity'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { Injectable } from '@nestjs/common'

@Injectable()
export class SupplierQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect

  async findOneById(spli_id: string, account: IAccount): Promise<SupplierEntity | null> {
    try {
      const indexExist = await indexElasticsearchExists(SUPPLIER_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: SUPPLIER_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    spli_id: {
                      query: spli_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    spli_res_id: {
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
        action: 'findOne',
        class: 'SupplierQuery',
        function: 'findOne',
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
      spli_name,
      pageSize,
      pageIndex,
      isDeleted
    }: { spli_name: string; pageSize: number; pageIndex: number; isDeleted: number },
    account: IAccount
  ): Promise<ResultPagination<SupplierEntity>> {
    try {
      const indexExist = await indexElasticsearchExists(SUPPLIER_ELASTICSEARCH_INDEX)

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

      if (spli_name?.trim() !== '') {
        query.bool.must.push({
          match: {
            spli_name: {
              query: spli_name,
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
            spli_res_id: {
              query: account.account_restaurant_id,
              operator: 'and'
            }
          }
        }
      )

      const result = await this.elasticSearch.search({
        index: SUPPLIER_ELASTICSEARCH_INDEX,
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
      const results = hits.map((hit) => hit._source)

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
        class: 'SupplierQuery',
        function: 'findAllPagination',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllSupplierName(account: IAccount): Promise<SupplierEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(SUPPLIER_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }

      const result = await this.elasticSearch.search({
        index: SUPPLIER_ELASTICSEARCH_INDEX,
        body: {
          _source: ['spli_id', 'spli_name'],
          size: 1000,
          sort: [{ updatedAt: { order: 'desc' } }],
          from: 0,
          query: {
            bool: {
              must: [
                {
                  match: {
                    isDeleted: {
                      query: 0,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    spli_res_id: {
                      query: account.account_restaurant_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    spli_status: {
                      query: 'enable',
                      operator: 'and'
                    }
                  }
                }
              ]
            }
          }
        }
      })

      return result.hits?.hits.map((hit) => hit._source) || []
    } catch (error) {
      saveLogSystem({
        action: 'findAllSupplierName',
        class: 'SupplierQuery',
        function: 'findAllSupplierName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
