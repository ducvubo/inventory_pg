import { getElasticsearch } from 'src/config/elasticsearch.config'
import { UnitConversionEntity } from './unit-conversion.entity'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { UNIT_CONVERSION_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'

export class UnitConversionQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect

  // đơn vị đo 1 đã chuyển sang đơn vị đo 2 chưa
  async findUnitConversionFrom({
    unt_cvs_res_id,
    unt_cvs_unt_id_from,
    unt_cvs_unt_id_to
  }: {
    unt_cvs_unt_id_from: string
    unt_cvs_unt_id_to: string
    unt_cvs_res_id: string
  }): Promise<UnitConversionEntity> {
    try {
      const result = await this.elasticSearch.search({
        index: UNIT_CONVERSION_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    unt_cvs_unt_id_from: {
                      query: unt_cvs_unt_id_from,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    unt_cvs_unt_id_to: {
                      query: unt_cvs_unt_id_to,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    unt_cvs_res_id: {
                      query: unt_cvs_res_id,
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
        action: 'findUnitConversionFrom',
        class: 'UnitConversionQuery',
        function: 'findUnitConversionFrom',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })

      throw new ServerErrorDefault(error)
    }
  }

  //đơn vị đo 2 đã chuyển sang đơn vị đo 1 chưa
  async findUnitConversionTo({
    unt_cvs_res_id,
    unt_cvs_unt_id_from,
    unt_cvs_unt_id_to
  }: {
    unt_cvs_unt_id_from: string
    unt_cvs_unt_id_to: string
    unt_cvs_res_id: string
  }): Promise<UnitConversionEntity> {
    try {
      const result = await this.elasticSearch.search({
        index: UNIT_CONVERSION_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    unt_cvs_unt_id_from: {
                      query: unt_cvs_unt_id_to,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    unt_cvs_unt_id_to: {
                      query: unt_cvs_unt_id_from,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    unt_cvs_res_id: {
                      query: unt_cvs_res_id,
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
        action: 'findUnitConversionTo',
        class: 'UnitConversionQuery',
        function: 'findUnitConversionTo',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })

      throw new ServerErrorDefault(error)
    }
  }

  async getListUnitConversionByUnitId({ unt_id, unt_cvs_res_id }: { unt_id: string; unt_cvs_res_id: string }): Promise<{
    from: UnitConversionEntity[]
    to: UnitConversionEntity[]
  }> {
    try {
      const resultFrom = await this.elasticSearch.search({
        index: UNIT_CONVERSION_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    unt_cvs_unt_id_from: {
                      query: unt_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    unt_cvs_res_id: {
                      query: unt_cvs_res_id,
                      operator: 'and'
                    }
                  }
                }
              ]
            }
          }
        }
      })

      const resultTo = await this.elasticSearch.search({
        index: UNIT_CONVERSION_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    unt_cvs_unt_id_to: {
                      query: unt_id,
                      operator: 'and'
                    }
                  }
                },
                {
                  match: {
                    unt_cvs_res_id: {
                      query: unt_cvs_res_id,
                      operator: 'and'
                    }
                  }
                }
              ]
            }
          }
        }
      })

      return {
        from: resultFrom.hits?.hits.map((item: any) => item._source) || [],
        to: resultTo.hits?.hits.map((item: any) => item._source) || []
      }
    } catch (error) {
      saveLogSystem({
        action: 'getListUnitConversionByUnitId',
        class: 'UnitConversionQuery',
        function: 'getListUnitConversionByUnitId',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })

      throw new ServerErrorDefault(error)
    }
  }
}
