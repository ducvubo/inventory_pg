import { Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { FOOD_RESTAURANT_ELASTICSEARCH_INDEX, TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { saveLogSystem } from 'src/log/sendLog.els'
import { TicketGuestRestaurantEntity } from './ticket-guest-restaurant.entity'
import { IAccount } from 'src/guard/interface/account.interface'

@Injectable()
export class TicketGuestRestaurantRepo implements OnModuleInit {
  constructor(
    @InjectRepository(TicketGuestRestaurantEntity)
    private readonly ticketGuestRestaurantRepo: Repository<TicketGuestRestaurantEntity>,
    private readonly configService: ConfigService
  ) { }

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: TicketGuestRestaurantEntity[] = await this.ticketGuestRestaurantRepo.find()
    const indexExist = await indexElasticsearchExists(TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX, doc.tkgr_id.toString(), doc)
    }
  }

  createTicketGuestRestaurant(data: TicketGuestRestaurantEntity): Promise<TicketGuestRestaurantEntity> {
    try {
      return this.ticketGuestRestaurantRepo.save(data)
    } catch (error) {
      saveLogSystem({
        action: 'create',
        class: 'TicketGuestRestaurantRepo',
        function: 'createTicketGuestRestaurant',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  updateStatusTicketGuestRestaurant(tkgr_status: 'open' | 'in_progress' | 'close' | 'resolved', tkgr_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      return this.ticketGuestRestaurantRepo
        .createQueryBuilder()
        .update(TicketGuestRestaurantEntity)
        .set({
          tkgr_status: tkgr_status,
          tkgr_res_id: account.account_restaurant_id,
          tkgr_id: tkgr_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({
          tkgr_id: tkgr_id,
          tkgr_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'update',
        class: 'TicketGuestRestaurantRepo',
        function: 'updateStatusTicketGuestRestaurant',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateTicketRestaurantInProgess(tkgr_id: string, account: IAccount) {
    try {
      return await this.ticketGuestRestaurantRepo.createQueryBuilder()
        .update(TicketGuestRestaurantEntity)
        .set({
          tkgr_status: 'in_progress',
          tkgr_res_id: account.account_restaurant_id,
          tkgr_id: tkgr_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({
          tkgr_id: tkgr_id,
          tkgr_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'update',
        class: 'TicketGuestRestaurantRepo',
        function: 'updateTicketRestaurantInProgess',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
    }
  }

  async resolvedTicketRestaurant(tkgr_id: string, account: IAccount) {
    try {
      return await this.ticketGuestRestaurantRepo.createQueryBuilder()
        .update(TicketGuestRestaurantEntity)
        .set({
          tkgr_status: 'resolved',
          tkgr_res_id: account.account_restaurant_id,
          tkgr_id: tkgr_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({
          tkgr_id: tkgr_id,
          tkgr_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'update',
        class: 'TicketGuestRestaurantRepo',
        function: 'resolvedTicketRestaurant',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async closeTicketRestaurant(tkgr_id: string) {
    try {
      return await this.ticketGuestRestaurantRepo.createQueryBuilder()
        .update(TicketGuestRestaurantEntity)
        .set({
          tkgr_id: tkgr_id,
          tkgr_status: 'close',
        })
        .where({
          tkgr_id: tkgr_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'update',
        class: 'TicketGuestRestaurantRepo',
        function: 'closeTicketRestaurant',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }


}
