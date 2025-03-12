import { Module } from '@nestjs/common';
import { TickGuestRestaurantReplicesService } from './tick-guest-restaurant-replices.service';
import { TickGuestRestaurantReplicesController } from './tick-guest-restaurant-replices.controller';

@Module({
  controllers: [TickGuestRestaurantReplicesController],
  providers: [TickGuestRestaurantReplicesService],
})
export class TickGuestRestaurantReplicesModule {}
