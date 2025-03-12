import { Controller } from '@nestjs/common';
import { TickGuestRestaurantReplicesService } from './tick-guest-restaurant-replices.service';

@Controller('tick-guest-restaurant-replices')
export class TickGuestRestaurantReplicesController {
  constructor(private readonly tickGuestRestaurantReplicesService: TickGuestRestaurantReplicesService) {}
}
