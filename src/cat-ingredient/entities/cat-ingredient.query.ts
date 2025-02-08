import { getElasticsearch } from 'src/config/elasticsearch.config'
import { IAccount } from 'src/guard/interface/account.interface'
import { indexElasticsearchExists } from 'src/utils/elasticsearch'
import { CatIngredientEntity } from './cat-ingredient.entity'
import { CAT_INGREDIENT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { Injectable } from '@nestjs/common'

@Injectable()
export class CatIngredientQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect

  async findOneById(cat_igd_id: string, account: IAccount): Promise<CatIngredientEntity | null> {
    try {
      const indexExist = await indexElasticsearchExists(CAT_INGREDIENT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }
      const result = await this.elasticSearch.search({
        index: CAT_INGREDIENT_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    cat_igd_id: {
                      query: cat_igd_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    cat_igd_res_id: {
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
        class: 'CatIngredientQuery',
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
      cat_igd_name,
      pageSize,
      pageIndex,
      isDeleted
    }: { cat_igd_name: string; pageSize: number; pageIndex: number; isDeleted: number },
    account: IAccount
  ): Promise<ResultPagination<CatIngredientEntity>> {
    try {
      const indexExist = await indexElasticsearchExists(CAT_INGREDIENT_ELASTICSEARCH_INDEX)

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

      if (cat_igd_name?.trim() !== '') {
        query.bool.must.push({
          match: {
            cat_igd_name: {
              query: cat_igd_name,
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
            cat_igd_res_id: {
              query: account.account_restaurant_id,
              operator: 'and'
            }
          }
        }
      )

      const result = await this.elasticSearch.search({
        index: CAT_INGREDIENT_ELASTICSEARCH_INDEX,
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
        class: 'CatIngredientQuery',
        function: 'findAllPagination',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllCatName(account: IAccount): Promise<CatIngredientEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(CAT_INGREDIENT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return []
      }

      const result = await this.elasticSearch.search({
        index: CAT_INGREDIENT_ELASTICSEARCH_INDEX,
        body: {
          _source: ['cat_igd_id', 'cat_igd_name'],
          query: {
            bool: {
              must: [
                {
                  match: {
                    cat_igd_res_id: {
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
                //status
                {
                  match: {
                    cat_igd_status: {
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
        action: 'findAllCatName',
        class: 'CatIngredientQuery',
        function: 'findAllCatName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
