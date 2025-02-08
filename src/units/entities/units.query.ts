import { getElasticsearch } from 'src/config/elasticsearch.config'
import { UNIT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { saveLogSystem } from 'src/log/sendLog.els'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { UnitEntity } from './units.entity'
import { IAccount } from 'src/guard/interface/account.interface'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { Injectable } from '@nestjs/common'

@Injectable()
export class UnitQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect

  async findOneById(unt_id: string, account: IAccount): Promise<UnitEntity | null> {
    try {
      const indexExist = await indexElasticsearchExists(UNIT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: UNIT_ELASTICSEARCH_INDEX,
        body: {
          _source: ['unt_id', 'unt_name', 'unt_description', 'unt_symbol'],
          query: {
            bool: {
              must: [
                {
                  match: {
                    unt_id: {
                      query: unt_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    unt_res_id: {
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
        action: 'findOneById',
        class: 'UnitQuery',
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
      unt_name,
      pageSize,
      pageIndex,
      isDeleted
    }: { unt_name: string; pageSize: number; pageIndex: number; isDeleted: number },
    account: IAccount
  ): Promise<ResultPagination<UnitEntity>> {
    try {
      const indexExist = await indexElasticsearchExists(UNIT_ELASTICSEARCH_INDEX)

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

      if (unt_name?.trim() !== '') {
        query.bool.must.push({
          match: {
            unt_name: {
              query: unt_name,
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
            unt_res_id: {
              query: account.account_restaurant_id,
              operator: 'and'
            }
          }
        }
      )

      const result = await this.elasticSearch.search({
        index: UNIT_ELASTICSEARCH_INDEX,
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
        class: 'UnitQuery',
        function: 'findAllPagination',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllUnitName(account: IAccount): Promise<UnitEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(UNIT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }

      const result = await this.elasticSearch.search({
        index: UNIT_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    unt_res_id: {
                      query: account.account_restaurant_id,
                      operator: 'and'
                    }
                  }
                },
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
                    unt_status: {
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
        action: 'findAllUnitName',
        class: 'UnitQuery',
        function: 'findAllUnitName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
