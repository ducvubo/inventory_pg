import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getElasticsearch } from "src/config/elasticsearch.config";
import { TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX, TICKET_GUEST_RESTAURANT_REPLICES_ELASTICSEARCH_INDEX } from "src/constants/index.elasticsearch";
import { saveLogSystem } from "src/log/sendLog.els";
import { indexElasticsearchExists } from "src/utils/elasticsearch";
import { IAccount } from "src/guard/interface/account.interface";
import { ResultPagination } from "src/interface/resultPagination.interface";
import { ServerErrorDefault } from "src/utils/errorResponse";
import { TicketGuestRestaurantReplicesEntity } from "./tick-guest-restaurant-replices.entity";


@Injectable()
export class TicketGuestRestaurantReplicesQuery {
  private readonly elasticSearch = getElasticsearch().instanceConnect
  constructor(private readonly configService: ConfigService) { }

  async getTicketGuestRestaurantReplices(tkgr_id: string): Promise<TicketGuestRestaurantReplicesEntity[]> {
    try {
      const indexExist = await indexElasticsearchExists(TICKET_GUEST_RESTAURANT_REPLICES_ELASTICSEARCH_INDEX)

      if (!indexExist) {
        return null
      }

      const result = await this.elasticSearch.search({
        index: TICKET_GUEST_RESTAURANT_REPLICES_ELASTICSEARCH_INDEX,
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

      return result.hits.hits.map((item: any) => item._source)
    } catch (error) {
      saveLogSystem({
        type: 'error',
        action: 'getTicketGuestRestaurantReplices',
        class: 'TicketGuestRestaurantReplicesQuery',
        message: error.message,
        function: 'getTicketGuestRestaurantReplices',
        time: new Date(),
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }

}
