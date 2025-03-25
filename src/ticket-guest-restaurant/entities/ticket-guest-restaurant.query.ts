import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getElasticsearch } from "src/config/elasticsearch.config";
import { TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX } from "src/constants/index.elasticsearch";
import { saveLogSystem } from "src/log/sendLog.els";
import { indexElasticsearchExists } from "src/utils/elasticsearch";
import { TicketGuestRestaurantEntity } from "./ticket-guest-restaurant.entity";
import { IAccount } from "src/guard/interface/account.interface";
import { ResultPagination } from "src/interface/resultPagination.interface";
import { ServerErrorDefault } from "src/utils/errorResponse";


@Injectable()
export class TicketGuestRestaurantQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect
  constructor(private readonly configService: ConfigService) { }

  async getTicketGuestRestaurantPagination(
    {
      id_user_guest, pageIndex, pageSize, q, tkgr_priority, tkgr_status, tkgr_type, tkgr_user_id
    }: {
      pageSize: number,
      pageIndex: number,
      q: string,
      tkgr_status: string,
      tkgr_priority: string,
      tkgr_type: string,
      id_user_guest: string
      tkgr_user_id: string
    }
  ):
    Promise<{
      meta: {
        pageIndex: number,
        pageSize: number,
        totalPage: number,
        totalItem: number
      },
      result: TicketGuestRestaurantEntity[]
    }> {
    try {
      const indexExist = await indexElasticsearchExists(TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return {
          meta: {
            pageIndex,
            pageSize,
            totalPage: 0,
            totalItem: 0
          },
          result: []
        }
      }

      const must: any[] = [];
      const should: any[] = [];

      if (id_user_guest) {
        should.push({ term: { "id_user_guest.keyword": id_user_guest } });
      }

      if (tkgr_user_id && tkgr_user_id !== "0") {
        should.push({ term: { tkgr_user_id: tkgr_user_id } });
      }

      if (tkgr_priority) {
        must.push({ match: { tkgr_priority } });
      }
      if (tkgr_status) {
        must.push({ match: { tkgr_status } });
      }
      if (tkgr_type) {
        must.push({ match: { tkgr_type } });
      }
      if (q) {
        must.push({ match: { q } });
      }

      const query: any = {
        bool: {
          must, // Điều kiện AND
        }
      };

      // Chỉ thêm `should` nếu có ít nhất một điều kiện OR
      if (should.length > 0) {
        query.bool.should = should;
        query.bool.minimum_should_match = 1; // OR giữa các điều kiện này
      }

      const result = await this.elasticSearch.search({
        index: TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX,
        body: {
          query,
          from: (pageIndex - 1) * pageSize,
          size: pageSize,
          sort: [
            {
              updatedAt: { order: 'desc' } // Sắp xếp giảm dần (mới nhất trước)
            }
          ],
        }
      }) as any

      return {
        meta: {
          pageIndex: pageIndex,
          pageSize,
          totalPage: Math.ceil(result.hits?.total.value / pageSize),
          totalItem: result.hits?.total.value
        },
        result: result.hits?.hits.map((item: any) => item._source)
      }
    } catch (error) {
      saveLogSystem({
        action: 'get',
        class: 'TicketGuestRestaurantQuery',
        function: 'getTicketGuestRestaurantPagination',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
    }
  }

  async getTicketRestaurant({
    pageSize, pageIndex, q, tkgr_priority, tkgr_status, tkgr_type
  }: {
    pageSize: number,
    pageIndex: number,
    q: string,
    tkgr_priority: string,
    tkgr_status: string,
    tkgr_type: string,
  }, account: IAccount): Promise<ResultPagination<TicketGuestRestaurantEntity>> {
    try {
      const indexExist = await indexElasticsearchExists(TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX)

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
      // account.account_restaurant_id
      const must: any = [
        {
          bool: {
            should: [
              { match: { tkgr_res_id: account.account_restaurant_id } }
            ]
          }
        }
      ]
      if (tkgr_priority) {
        must.push({ match: { tkgr_priority } })
      }
      if (tkgr_status) {
        must.push({ match: { tkgr_status } })
      }
      if (tkgr_type) {
        must.push({ match: { tkgr_type } })
      }
      if (q) {
        must.push({ match: { q } })
      }

      const result = await this.elasticSearch.search({
        index: TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX,
        body: {
          query: {
            bool: {
              must
            }
          },
          from: (pageIndex - 1) * pageSize,
          size: pageSize,
          sort: [
            {
              updatedAt: { order: 'desc' }
            }
          ],
        }
      }) as any

      return {
        meta: {
          current: pageIndex,
          pageSize,
          totalPage: Math.ceil(result.hits.total.value / pageSize),
          totalItem: result.hits.total.value
        },
        result: result.hits.hits.map((item: any) => item._source)
      }
    } catch (error) {
      saveLogSystem({
        action: 'getTicketRestaurant',
        class: 'TicketGuestRestaurantQuery',
        function: 'getTicketRestaurant',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findTicketGuestRestaurantById(tkgr_id: string): Promise<TicketGuestRestaurantEntity> {
    try {
      const indexExist = await indexElasticsearchExists(TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }

      const result = await this.elasticSearch.search({
        index: TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX,
        body: {
          from: 0,
          size: 10000,
          query: {
            match: {
              tkgr_id
            }
          }
        }
      }) as any

      if (result.hits.total.value === 0) {
        return null
      }

      return result.hits.hits[0]._source
    } catch (error) {
      saveLogSystem({
        action: 'findTicketGuestRestaurantById',
        class: 'TicketGuestRestaurantQuery',
        function: 'findTicketGuestRestaurantById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}