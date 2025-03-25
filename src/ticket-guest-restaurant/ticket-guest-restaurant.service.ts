import { Injectable } from '@nestjs/common';
import { TicketGuestRestaurantRepo } from './entities/ticket-guest-restaurant.repo';
import { TicketGuestRestaurantQuery } from './entities/ticket-guest-restaurant.query';
import { CreateTicketGuestRestaurantDto } from './dto/create-ticket-guest-restaurant.dto';
import { saveLogSystem } from 'src/log/sendLog.els';
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse';
import { checkSensitiveContent } from 'src/utils/censorly.api';
import slugify from 'slugify';
import { getCacheIO, setCacheIOExpiration } from 'src/utils/cache';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { IRestaurantServiceGprcClient } from 'src/grpc/typescript/restaurant.client';
import { IBackendGRPC } from 'src/grpc/typescript/api';
import { firstValueFrom } from 'rxjs';
import 'dotenv/config'
import { sendMessageToKafka } from 'src/utils/kafka';
import { IAccount } from 'src/guard/interface/account.interface';
import { ResultPagination } from 'src/interface/resultPagination.interface';
import { TicketGuestRestaurantEntity } from './entities/ticket-guest-restaurant.entity';

@Injectable()
export class TicketGuestRestaurantService {
  constructor(
    private readonly ticketGuestRestaurantRepo: TicketGuestRestaurantRepo,
    private readonly ticketGuestRestaurantQuery: TicketGuestRestaurantQuery
  ) { }

  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'RestaurantProto',
      protoPath: join(__dirname, '../grpc/proto/restaurant.proto'),
      url: process.env.URL_SERVICE_GRPC
    }
  })
  client: ClientGrpc
  private RestaurantServiceGprc: IRestaurantServiceGprcClient

  onModuleInit() {
    this.RestaurantServiceGprc = this.client.getService<IRestaurantServiceGprcClient>(
      'RestaurantServiceGprc'
    )
  }

  async guestCreateTicket(createTicketGuestRestaurantDto: CreateTicketGuestRestaurantDto, id_user_guest: string) {
    try {

      const restaurantExist: IBackendGRPC = await firstValueFrom(
        (
          await this.RestaurantServiceGprc.findOneRestaurantById({
            resId: createTicketGuestRestaurantDto.tkgr_res_id
          })
        ) as any
      )

      if (!restaurantExist.status) {
        throw new BadRequestError("Nhà hàng không tồn tại")
      }


      const slugTitle = slugify(createTicketGuestRestaurantDto.tkgr_title, {
        replacement: '-',
        remove: undefined,
        lower: false,
        strict: false,
        locale: 'vi',
        trim: true
      })
      const isCheckCache = await getCacheIO(`ticket-guest-restaurant-title-${slugTitle}`)

      if (isCheckCache === null) {
        const isCheckTitle = await checkSensitiveContent(createTicketGuestRestaurantDto.tkgr_title)
        if (isCheckTitle) {
          setCacheIOExpiration(`ticket-guest-restaurant-title-${slugTitle}`, 'false', 60 * 60 * 24)
          throw new BadRequestError("Nội dung tiêu đề không phù hợp")
        } else {
          setCacheIOExpiration(`ticket-guest-restaurant-title-${slugTitle}`, 'true', 60 * 60 * 24)
        }
      }
      if (isCheckCache && isCheckCache === 'false') {
        throw new BadRequestError("Nội dung tiêu đề không phù hợp")
      }

      const slugDescription = slugify(createTicketGuestRestaurantDto.tkgr_description, {
        replacement: '-',
        remove: undefined,
        lower: false,
        strict: false,
        locale: 'vi',
        trim: true
      })

      const isCheckCacheDescription = await getCacheIO(`ticket-guest-restaurant-description-${slugDescription}`)
      if (isCheckCacheDescription === null) {
        const isCheckDescription = await checkSensitiveContent(createTicketGuestRestaurantDto.tkgr_description)
        if (isCheckDescription) {
          setCacheIOExpiration(`ticket-guest-restaurant-description-${slugDescription}`, 'false', 60 * 60 * 24)
          throw new BadRequestError("Nội dung mô tả không phù hợp")
        } else {
          setCacheIOExpiration(`ticket-guest-restaurant-description-${slugDescription}`, 'true', 60 * 60 * 24)
        }
      }
      if (isCheckCacheDescription && isCheckCacheDescription === 'false') {
        throw new BadRequestError("Nội dung mô tả không phù hợp")
      }

      if (id_user_guest === null || id_user_guest === undefined) {
        throw new BadRequestError("ID khách không được để trống")
      }

      const newTicket = await this.ticketGuestRestaurantRepo.createTicketGuestRestaurant({
        id_user_guest: id_user_guest,
        tkgr_res_id: createTicketGuestRestaurantDto.tkgr_res_id,
        tkgr_user_id: createTicketGuestRestaurantDto.tkgr_user_id,
        tkgr_title: createTicketGuestRestaurantDto.tkgr_title,
        tkgr_description: createTicketGuestRestaurantDto.tkgr_description,
        tkgr_status: 'open',
        tkgr_priority: createTicketGuestRestaurantDto.tkgr_priority,
        tkgr_type: createTicketGuestRestaurantDto.tkgr_type,
        tkgr_attachment: createTicketGuestRestaurantDto.tkgr_attachment,
        tkgr_user_email: createTicketGuestRestaurantDto.tkgr_user_email,
      })

      sendMessageToKafka({
        topic: 'GUEST_CREATE_TICKET',
        message: JSON.stringify({
          tkgr_user_email: createTicketGuestRestaurantDto.tkgr_user_email,
          title: createTicketGuestRestaurantDto.tkgr_title,
          description: createTicketGuestRestaurantDto.tkgr_description,
          restaurant_name: JSON.parse(restaurantExist.data).restaurant_name,
          restaurant_email: JSON.parse(restaurantExist.data).restaurant_email,
          restaurant_phone: JSON.parse(restaurantExist.data).restaurant_phone,
          restaurant_address: JSON.parse(restaurantExist.data).restaurant_address,
          type: this.getTextType(createTicketGuestRestaurantDto.tkgr_type),
          priority: this.getTextPriority(createTicketGuestRestaurantDto.tkgr_priority)
        })
      })


      return newTicket
    } catch (error) {
      saveLogSystem({
        action: 'guestCreateTicket',
        class: 'TicketGuestRestaurantService',
        function: 'guestCreateTicket',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
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
      return await this.ticketGuestRestaurantQuery.getTicketRestaurant({
        pageSize,
        pageIndex,
        q,
        tkgr_priority,
        tkgr_status,
        tkgr_type
      }, account)
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

  async getTicketRestaurantById(tkgr_id: string) {
    try {
      return await this.ticketGuestRestaurantQuery.findTicketGuestRestaurantById(tkgr_id)
    } catch (error) {
      saveLogSystem({
        action: 'get',
        class: 'TicketGuestRestaurantQuery',
        function: 'getTicketRestaurantById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
    }
  }

  async resolvedTicketRestaurant(tkgr_id: string, account: IAccount) {
    try {
      const ticket = await this.ticketGuestRestaurantQuery.findTicketGuestRestaurantById(tkgr_id)
      if (!ticket) {
        throw new BadRequestError('Ticket không tồn tại')
      }

      if (ticket.tkgr_status === 'close' || ticket.tkgr_status === 'resolved') {
        throw new BadRequestError('Ticket đã đóng hoặc đã giải quyết')
      }

      return await this.ticketGuestRestaurantRepo.resolvedTicketRestaurant(tkgr_id, account)

    } catch (error) {
      saveLogSystem({
        action: 'resolved',
        class: 'TicketGuestRestaurantQuery',
        function: 'resolvedTicketRestaurant',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
    }
  }

  async closeTicketRestaurant(tkgr_id: string) {
    try {
      const ticket = await this.ticketGuestRestaurantQuery.findTicketGuestRestaurantById(tkgr_id)
      if (!ticket) {
        throw new BadRequestError('Ticket không tồn tại')
      }

      if (ticket.tkgr_status === 'close' || ticket.tkgr_status === 'resolved') {
        throw new BadRequestError('Ticket đã đóng hoặc đã giải quyết')
      }

      return await this.ticketGuestRestaurantRepo.closeTicketRestaurant(tkgr_id)

    } catch (error) {
      saveLogSystem({
        action: 'close',
        class: 'TicketGuestRestaurantQuery',
        function: 'closeTicketRestaurant',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
    }
  }

  async getTicketGuestRestaurantPagination({
    pageSize, pageIndex, q, tkgr_priority, tkgr_status, tkgr_type,
    id_user_guest, tkgr_user_id }): Promise<{
      meta: {
        pageIndex: number,
        pageSize: number,
        totalPage: number,
        totalItem: number
      },
      result: TicketGuestRestaurantEntity[]
    }> {
    try {
      return await this.ticketGuestRestaurantQuery.getTicketGuestRestaurantPagination({
        pageSize,
        pageIndex,
        q,
        tkgr_priority,
        tkgr_status,
        tkgr_type,
        id_user_guest,
        tkgr_user_id: tkgr_user_id
      })
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


  getTextType(type: string) {
    switch (type) {
      case 'book_table':
        return 'Đặt bàn'
      case 'order_dish':
        return 'Đặt món'
      case 'Q&A':
        return 'Hỏi đáp'
      case 'complain':
        return 'Khiếu nại'
      case 'other':
        return 'Khác'
      default:
        return ''
    }
  }

  getTextPriority(priority: string) {
    switch (priority) {
      case 'low':
        return 'Thấp'
      case 'medium':
        return 'Trung bình'
      case 'high':
        return 'Cao'
      case 'urgent':
        return 'Khẩn cấp'
      default:
        return ''
    }
  }
}
