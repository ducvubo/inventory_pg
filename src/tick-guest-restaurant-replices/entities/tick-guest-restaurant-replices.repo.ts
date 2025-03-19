import { Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { TICKET_GUEST_RESTAURANT_REPLICES_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'

import { TicketGuestRestaurantReplicesEntity } from './tick-guest-restaurant-replices.entity'
import { saveLogSystem } from 'src/log/sendLog.els'
import { IAccount } from 'src/guard/interface/account.interface'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { TicketGuestRestaurantEntity } from 'src/ticket-guest-restaurant/entities/ticket-guest-restaurant.entity'
import { TicketGuestRestaurantRepo } from 'src/ticket-guest-restaurant/entities/ticket-guest-restaurant.repo'
import { TickGuestRestaurantReplicesDto } from '../dto/tick-guest-restaurant-replices.dto'

@Injectable()
export class TicketGuestRestaurantReplicesRepo implements OnModuleInit {
  constructor(
    @InjectRepository(TicketGuestRestaurantReplicesEntity)
    private readonly ticketGuestRestaurantReplicesRepo: Repository<TicketGuestRestaurantReplicesEntity>,
    private readonly configService: ConfigService,
  ) { }

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: TicketGuestRestaurantReplicesEntity[] = await this.ticketGuestRestaurantReplicesRepo.find()
    const indexExist = await indexElasticsearchExists(TICKET_GUEST_RESTAURANT_REPLICES_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(TICKET_GUEST_RESTAURANT_REPLICES_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(TICKET_GUEST_RESTAURANT_REPLICES_ELASTICSEARCH_INDEX, doc.tkgr_rp_id.toString(), doc)
    }
  }

  async restaurantReplyTicket({
    tkgr_id, tkgr_rp_attachment, tkgr_rp_content,
  }: TickGuestRestaurantReplicesDto, account: IAccount): Promise<TicketGuestRestaurantReplicesEntity> {
    try {
      return this.ticketGuestRestaurantReplicesRepo.save({
        tkgr_id: tkgr_id,
        tkgr_rp_content: tkgr_rp_content,
        tkgr_rp_attachment: tkgr_rp_attachment,
        tkgr_rp_type: 'restaurant',
        tkgr_rp_time: new Date(),
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        type: 'error',
        action: 'restaurantReplyTicket',
        class: 'TicketGuestRestaurantReplicesRepo',
        message: error.message,
        function: 'restaurantReplyTicket',
        time: new Date(),
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }

  async guestReplyTicket({
    tkgr_id, tkgr_rp_attachment, tkgr_rp_content,
  }: TickGuestRestaurantReplicesDto): Promise<TicketGuestRestaurantReplicesEntity> {
    try {
      return this.ticketGuestRestaurantReplicesRepo.save({
        tkgr_id: tkgr_id,
        tkgr_rp_content: tkgr_rp_content,
        tkgr_rp_attachment: tkgr_rp_attachment,
        tkgr_rp_type: 'guest',
        tkgr_rp_time: new Date(),
      })
    } catch (error) {
      saveLogSystem({
        type: 'error',
        action: 'guestReplyTicket',
        class: 'TicketGuestRestaurantReplicesRepo',
        message: error.message,
        function: 'guestReplyTicket',
        time: new Date(),
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }

}
