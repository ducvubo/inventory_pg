import { Injectable } from '@nestjs/common';
import { TicketGuestRestaurantReplicesRepo } from './entities/tick-guest-restaurant-replices.repo';
import { TicketGuestRestaurantReplicesQuery } from './entities/tick-guest-restaurant-replices.query';
import { TicketGuestRestaurantRepo } from 'src/ticket-guest-restaurant/entities/ticket-guest-restaurant.repo';
import { IAccount } from 'src/guard/interface/account.interface';
import { TicketGuestRestaurantReplicesEntity } from './entities/tick-guest-restaurant-replices.entity';
import { TicketGuestRestaurantQuery } from 'src/ticket-guest-restaurant/entities/ticket-guest-restaurant.query';
import { saveLogSystem } from 'src/log/sendLog.els';
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse';
import { TickGuestRestaurantReplicesDto } from './dto/tick-guest-restaurant-replices.dto';
import { getCacheIO, setCacheIOExpiration } from 'src/utils/cache';
import { checkSensitiveContent } from 'src/utils/censorly.api';
import slugify from 'slugify';

@Injectable()
export class TickGuestRestaurantReplicesService {
  constructor(
    private readonly ticketGuestRestaurantReplicesRepo: TicketGuestRestaurantReplicesRepo,
    private readonly ticketGuestRestaurantReplicesQuery: TicketGuestRestaurantReplicesQuery,
    private readonly ticketGuestRestaurantRepo: TicketGuestRestaurantRepo,
    private readonly ticketGuestRestaurantQuery: TicketGuestRestaurantQuery
  ) { }

  async restaurantReplyTicket({
    tkgr_id, tkgr_rp_attachment, tkgr_rp_content
  }: TickGuestRestaurantReplicesDto, account: IAccount): Promise<TicketGuestRestaurantReplicesEntity> {

    try {

      const ticket = await this.ticketGuestRestaurantQuery.findTicketGuestRestaurantById(tkgr_id)
      if (!ticket) {
        throw new BadRequestError('Ticket không tồn tại')
      }

      if (ticket.tkgr_status === 'close' || ticket.tkgr_status === 'resolved') {
        throw new BadRequestError('Ticket đã đóng hoặc đã giải quyết')
      }

      if (ticket.tkgr_res_id !== account.account_restaurant_id) {
        throw new BadRequestError('Bạn không có quyền trả lời ticket này')
      }

      if (ticket.tkgr_status === 'open') {
        await this.ticketGuestRestaurantRepo.updateTicketRestaurantInProgess(tkgr_id, account)
      }

      const slugContent = slugify(tkgr_rp_content, {
        replacement: '-',
        remove: undefined,
        lower: false,
        strict: false,
        locale: 'vi',
        trim: true
      })
      const isCheckCache = await getCacheIO(`ticket-guest-restaurant-title-${slugContent}`)

      if (isCheckCache === null) {
        const isCheckTitle = await checkSensitiveContent(tkgr_rp_content)
        if (isCheckTitle) {
          setCacheIOExpiration(`ticket-guest-restaurant-title-${slugContent}`, 'false', 60 * 60 * 24)
          throw new BadRequestError("Nội dung  không phù hợp")
        } else {
          setCacheIOExpiration(`ticket-guest-restaurant-title-${slugContent}`, 'true', 60 * 60 * 24)
        }
      }
      if (isCheckCache && isCheckCache === 'false') {
        throw new BadRequestError("Nội dung không phù hợp")
      }


      return await this.ticketGuestRestaurantReplicesRepo.restaurantReplyTicket({
        tkgr_id, tkgr_rp_attachment, tkgr_rp_content
      }, account)
    } catch (error) {
      saveLogSystem({
        type: 'error',
        action: 'restaurantReplyTicket',
        class: 'TickGuestRestaurantReplicesService',
        message: error.message,
        function: 'restaurantReplyTicket',
        time: new Date(),
        error: error
      })
      throw new ServerErrorDefault(error)
    }

  }

  async guestReplyTicket({
    tkgr_id, tkgr_rp_attachment, tkgr_rp_content }: TickGuestRestaurantReplicesDto): Promise<TicketGuestRestaurantReplicesEntity> {
    try {
      const ticket = await this.ticketGuestRestaurantQuery.findTicketGuestRestaurantById(tkgr_id)
      if (!ticket) {
        throw new BadRequestError('Ticket không tồn tại')
      }

      if (ticket.tkgr_status === 'close' || ticket.tkgr_status === 'resolved') {
        throw new BadRequestError('Ticket đã đóng hoặc đã giải quyết')
      }

      if (ticket.tkgr_status === 'open') {
        throw new BadRequestError('Ticket chưa được nhà hàng trả lời')
      }

      const slugContent = slugify(tkgr_rp_content, {
        replacement: '-',
        remove: undefined,
        lower: false,
        strict: false,
        locale: 'vi',
        trim: true
      })
      const isCheckCache = await getCacheIO(`ticket-guest-restaurant-title-${slugContent}`)

      if (isCheckCache === null) {
        const isCheckTitle = await checkSensitiveContent(tkgr_rp_content)
        if (isCheckTitle) {
          setCacheIOExpiration(`ticket-guest-restaurant-title-${slugContent}`, 'false', 60 * 60 * 24)
          throw new BadRequestError("Nội dung  không phù hợp")
        } else {
          setCacheIOExpiration(`ticket-guest-restaurant-title-${slugContent}`, 'true', 60 * 60 * 24)
        }
      }
      if (isCheckCache && isCheckCache === 'false') {
        throw new BadRequestError("Nội dung không phù hợp")
      }

      return this.ticketGuestRestaurantReplicesRepo.guestReplyTicket({
        tkgr_id, tkgr_rp_attachment, tkgr_rp_content
      })
    } catch (error) {
      saveLogSystem({
        type: 'error',
        action: 'guestReplyTicket',
        class: 'TickGuestRestaurantReplicesService',
        message: error.message,
        function: 'guestReplyTicket',
        time: new Date(),
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getTicketRestaurantReplicesByTicketId(tkgr_id: string): Promise<TicketGuestRestaurantReplicesEntity[]> {
    try {
      return await this.ticketGuestRestaurantReplicesQuery.getTicketGuestRestaurantReplices(tkgr_id)
    } catch (error) {
      saveLogSystem({
        type: 'error',
        action: 'getTicketRestaurantReplicesByTicketId',
        class: 'TickGuestRestaurantReplicesService',
        message: error.message,
        function: 'getTicketRestaurantReplicesByTicketId',
        time: new Date(),
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }
}
