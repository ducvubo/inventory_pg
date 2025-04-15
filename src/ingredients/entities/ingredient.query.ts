import { getElasticsearch } from 'src/config/elasticsearch.config'
import { INGREDIENT_ELASTICSEARCH_INDEX, STOCK_IN_ITEM_ELASTICSEARCH_INDEX, STOCK_OUT_ITEM_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { saveLogSystem } from 'src/log/sendLog.els'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { IngredientEntity } from './ingredient.entity'
import { IAccount } from 'src/guard/interface/account.interface'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { UnitQuery } from 'src/units/entities/units.query'
import { CatIngredientQuery } from 'src/cat-ingredient/entities/cat-ingredient.query'
import { Injectable } from '@nestjs/common'

@Injectable()
export class IngredientQuey {
  private readonly elasticSearch = getElasticsearch().instanceConnect
  constructor(
    private readonly unitQuery: UnitQuery,
    private readonly catIngredientQuery: CatIngredientQuery
  ) { }

  async findOneById(igd_id: string, account: IAccount): Promise<IngredientEntity | null> {
    try {
      const indexExist = await indexElasticsearchExists(INGREDIENT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: INGREDIENT_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    igd_id: {
                      query: igd_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    igd_res_id: {
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
        class: 'IngredientQuery',
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
      igd_name,
      pageSize,
      pageIndex,
      isDeleted
    }: { igd_name: string; pageSize: number; pageIndex: number; isDeleted: number },
    account: IAccount
  ): Promise<ResultPagination<IngredientEntity>> {
    try {
      const indexExist = await indexElasticsearchExists(INGREDIENT_ELASTICSEARCH_INDEX)

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

      if (igd_name?.trim() !== '') {
        query.bool.must.push({
          match: {
            igd_name: {
              query: igd_name,
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
            igd_res_id: {
              query: account.account_restaurant_id,
              operator: 'and'
            }
          }
        }
      )

      const result = await this.elasticSearch.search({
        index: INGREDIENT_ELASTICSEARCH_INDEX,
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

      const resultsWithDetails = await Promise.all(
        results.map(async (result: any) => {
          const unt_id = await this.unitQuery.findOneById(result.unt_id, account)
          const cat_igd_id = await this.catIngredientQuery.findOneById(result.cat_igd_id, account)

          let totalStockInQuantity = 0
          let totalStockOutQuantity = 0

          const indexStockInExist = await indexElasticsearchExists(STOCK_IN_ITEM_ELASTICSEARCH_INDEX)

          if (indexStockInExist) {
            const stockInQuery = {
              bool: {
                must: [
                  {
                    match: {
                      igd_id: result.igd_id,
                    },
                  },
                  {
                    match: {
                      stki_item_res_id: account.account_restaurant_id,
                    },
                  },
                  {
                    match: {
                      isDeleted: 0,
                    },
                  },
                ],
              },
            };

            const stockInResult = await this.elasticSearch.search({
              index: STOCK_IN_ITEM_ELASTICSEARCH_INDEX,
              body: {
                query: stockInQuery,
                size: 1000,
              },
            }) as any;

            totalStockInQuantity = stockInResult.hits.hits.reduce(
              (sum, hit) => sum + hit._source.stki_item_quantity,
              0
            );
          }


          const indexStockOutExist = await indexElasticsearchExists(STOCK_OUT_ITEM_ELASTICSEARCH_INDEX)

          if (indexStockOutExist) {
            const stockOutQuery = {
              bool: {
                must: [
                  {
                    match: {
                      igd_id: result.igd_id,
                    },
                  },
                  {
                    match: {
                      stko_item_res_id: account.account_restaurant_id,
                    },
                  },
                  {
                    match: {
                      isDeleted: 0,
                    },
                  },
                ],
              },
            };

            const stockOutResult = await this.elasticSearch.search({
              index: STOCK_OUT_ITEM_ELASTICSEARCH_INDEX,
              body: {
                query: stockOutQuery,
                size: 1000,
              },
            }) as any;

            totalStockOutQuantity = stockOutResult.hits.hits.reduce(
              (sum, hit) => sum + hit._source.stko_item_quantity,
              0
            );
          }


          return {
            ...result,
            unt_id,
            cat_igd_id,
            totalStockInQuantity,
            totalStockOutQuantity
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
        result: resultsWithDetails
      }
    } catch (error) {
      saveLogSystem({
        action: 'findAllPagination',
        class: 'IngredientQuery',
        function: 'findAllPagination',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getAllIngredientName(account: IAccount): Promise<IngredientEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(INGREDIENT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }

      const result = await this.elasticSearch.search({
        index: INGREDIENT_ELASTICSEARCH_INDEX,
        body: {
          _source: ['igd_id', 'igd_name', 'unt_id'],
          query: {
            bool: {
              must: [
                {
                  match: {
                    igd_res_id: {
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
                    igd_status: {
                      query: 'enable',
                      operator: 'and'
                    }
                  }
                }
              ]
            }
          },
          from: 0,
          size: 10000,
        }
      })

      //tìm unit
      const results = result.hits?.hits.map((hit) => hit._source) || []
      const resultsWithDetails = await Promise.all(
        results.map(async (result: any) => {
          const unt_id = await this.unitQuery.findOneById(result.unt_id, account)
          return {
            ...result,
            unt_id
          }
        })
      )

      return resultsWithDetails
    } catch (error) {
      saveLogSystem({
        action: 'getAllIngredientName',
        class: 'IngredientQuery',
        function: 'getAllIngredientName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
