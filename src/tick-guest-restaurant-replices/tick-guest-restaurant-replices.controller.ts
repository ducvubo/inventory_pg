import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { TickGuestRestaurantReplicesService } from './tick-guest-restaurant-replices.service';
import { Acccount, ResponseMessage } from 'src/decorator/customize';
import { TicketGuestRestaurantReplicesEntity } from './entities/tick-guest-restaurant-replices.entity';
import { AccountAuthGuard } from 'src/guard/account.guard';
import { TickGuestRestaurantReplicesDto } from './dto/tick-guest-restaurant-replices.dto';
import { IAccount } from 'src/guard/interface/account.interface';

@Controller('tick-guest-restaurant-replices')
export class TickGuestRestaurantReplicesController {
  constructor(private readonly tickGuestRestaurantReplicesService: TickGuestRestaurantReplicesService) { }

  @Get()
  @ResponseMessage("Lấy thông tin ticket thành công")
  async getTicketRestaurantReplices(
    @Query('tkgr_id') tkgr_id: string
  ): Promise<TicketGuestRestaurantReplicesEntity[]> {
    return await this.tickGuestRestaurantReplicesService.getTicketRestaurantReplicesByTicketId(tkgr_id)
  }

  @Post('/restaurant-reply')
  @ResponseMessage("Trả lời ticket thành công")
  @UseGuards(AccountAuthGuard)
  async restaurantReplyTicket(
    @Body() tickGuestRestaurantReplicesDto: TickGuestRestaurantReplicesDto,
    @Acccount() account: IAccount
  ) {
    return await this.tickGuestRestaurantReplicesService.restaurantReplyTicket(tickGuestRestaurantReplicesDto, account)
  }

  @Post('/guest-reply')
  @ResponseMessage("Trả lời ticket thành công")
  async guestReplyTicket(
    @Body() tickGuestRestaurantReplicesDto: TickGuestRestaurantReplicesDto,
  ) {
    return await this.tickGuestRestaurantReplicesService.guestReplyTicket(tickGuestRestaurantReplicesDto)
  }
}
