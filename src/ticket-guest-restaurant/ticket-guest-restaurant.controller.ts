import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { TicketGuestRestaurantService } from './ticket-guest-restaurant.service';
import { ResponseMessage } from 'src/decorator/customize';
import { CreateTicketGuestRestaurantDto } from './dto/create-ticket-guest-restaurant.dto';
import { Request as RequestExpress } from 'express'
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

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

  
}
