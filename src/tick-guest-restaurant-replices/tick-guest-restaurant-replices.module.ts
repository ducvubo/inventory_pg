import { Module } from '@nestjs/common';
import { TickGuestRestaurantReplicesService } from './tick-guest-restaurant-replices.service';
import { TickGuestRestaurantReplicesController } from './tick-guest-restaurant-replices.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketGuestRestaurantReplicesEntity } from './entities/tick-guest-restaurant-replices.entity';
import { TicketGuestRestaurantReplicesRepo } from './entities/tick-guest-restaurant-replices.repo';
import { TicketGuestRestaurantReplicesQuery } from './entities/tick-guest-restaurant-replices.query';
import { TicketGuestRestaurantModule } from 'src/ticket-guest-restaurant/ticket-guest-restaurant.module';

@Module({
  imports: [TypeOrmModule.forFeature([TicketGuestRestaurantReplicesEntity]),
    TicketGuestRestaurantModule],
  controllers: [TickGuestRestaurantReplicesController],
  providers: [TickGuestRestaurantReplicesService, TicketGuestRestaurantReplicesRepo, TicketGuestRestaurantReplicesQuery],
})
export class TickGuestRestaurantReplicesModule { }
