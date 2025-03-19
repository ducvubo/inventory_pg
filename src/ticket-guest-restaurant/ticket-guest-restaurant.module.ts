import { Module } from '@nestjs/common';
import { TicketGuestRestaurantService } from './ticket-guest-restaurant.service';
import { TicketGuestRestaurantController } from './ticket-guest-restaurant.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketGuestRestaurantEntity } from './entities/ticket-guest-restaurant.entity';
import { TicketGuestRestaurantQuery } from './entities/ticket-guest-restaurant.query';
import { TicketGuestRestaurantRepo } from './entities/ticket-guest-restaurant.repo';

@Module({
  imports: [TypeOrmModule.forFeature([TicketGuestRestaurantEntity])],
  controllers: [TicketGuestRestaurantController],
  providers: [TicketGuestRestaurantService, TicketGuestRestaurantQuery, TicketGuestRestaurantRepo],
  exports: [TicketGuestRestaurantService, TicketGuestRestaurantQuery, TicketGuestRestaurantRepo]
})
export class TicketGuestRestaurantModule { }
