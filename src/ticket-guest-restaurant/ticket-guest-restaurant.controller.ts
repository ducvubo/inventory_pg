import { Body, Controller, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { TicketGuestRestaurantService } from './ticket-guest-restaurant.service';
import { Acccount, ResponseMessage } from 'src/decorator/customize';
import { CreateTicketGuestRestaurantDto } from './dto/create-ticket-guest-restaurant.dto';
import { Request as RequestExpress } from 'express'
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IAccount } from 'src/guard/interface/account.interface';
import { ResultPagination } from 'src/interface/resultPagination.interface';
import { TicketGuestRestaurantEntity } from './entities/ticket-guest-restaurant.entity';
import { AccountAuthGuard } from 'src/guard/account.guard';

@Controller('ticket-guest-restaurant')
export class TicketGuestRestaurantController {
  constructor(private readonly ticketGuestRestaurantService: TicketGuestRestaurantService) { }

  @Post()
  @ApiOperation({ summary: 'Guest tạo ticket', description: 'Tạo một ticket mới từ khách hàng' })
  @ApiResponse({ status: 201, description: 'Tạo ticket thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiBody({ type: CreateTicketGuestRestaurantDto })
  @ResponseMessage("Tạo ticket thành công")
  async guestCreateTicket(@Body() createTicketGuestRestaurantDto: CreateTicketGuestRestaurantDto, @Request() req: RequestExpress) {
    return await this.ticketGuestRestaurantService.guestCreateTicket(createTicketGuestRestaurantDto, req.headers['x-cl-id'] as string)
  }

  @Get('/get-ticket-restaurants')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage("Lấy danh sách ticket thành công")
  async getTicketGuestRestaurant(
    @Acccount() account: IAccount,
    @Query('current') pageIndex: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('q') q: string = '',
    @Query('tkgr_priority') tkgr_priority: string = '',
    @Query('tkgr_status') tkgr_status: string = '',
    @Query('tkgr_type') tkgr_type: string = ''
  ): Promise<ResultPagination<TicketGuestRestaurantEntity>> {
    return await this.ticketGuestRestaurantService.getTicketRestaurant({
      pageIndex: parseInt(pageIndex),
      pageSize: parseInt(pageSize),
      q,
      tkgr_priority,
      tkgr_status,
      tkgr_type,
    }, account)
  }

  @Get('/get-ticket-restaurants/:id')
  // @UseGuards(AccountAuthGuard)
  @ResponseMessage("Lấy thông tin ticket thành công")
  async getTicketGuestRestaurantById(
    @Param('id') id: string
  ): Promise<TicketGuestRestaurantEntity> {
    return await this.ticketGuestRestaurantService.getTicketRestaurantById(id)
  }

  @Put('/resolved-ticket/:id')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage("Giải quyết ticket thành công")
  async resolvedTicket(
    @Param('id') id: string,
    @Acccount() account: IAccount
  ) {
    return await this.ticketGuestRestaurantService.resolvedTicketRestaurant(id, account)
  }

  @Put('/close-ticket/:id')
  @ResponseMessage("Đóng ticket thành công")
  async closeTicket(
    @Param('id') id: string
  ) {
    return await this.ticketGuestRestaurantService.closeTicketRestaurant(id)
  }


  @Get('/get-ticket-guest')
  @ResponseMessage("Lấy danh sách ticket thành công")
  async getTicketGuest(
    @Query('pageIndex') pageIndex: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('q') q: string = '',
    @Query('tkgr_priority') tkgr_priority: string = '',
    @Query('tkgr_status') tkgr_status: string = '',
    @Query('tkgr_type') tkgr_type: string = '',
    @Query('tkgr_user_id') tkgr_user_id: number = 0,
    @Request() req: RequestExpress
  ): Promise<{
    meta: {
      pageIndex: number,
      pageSize: number,
      totalPage: number,
      totalItem: number
    },
    result: TicketGuestRestaurantEntity[]
  }> {
    return await this.ticketGuestRestaurantService.getTicketGuestRestaurantPagination({
      pageIndex: parseInt(pageIndex),
      pageSize: parseInt(pageSize),
      q,
      tkgr_priority,
      tkgr_status,
      tkgr_type,
      id_user_guest: req.headers['x-cl-id'] as string,
      tkgr_user_id
    })
  }
}
