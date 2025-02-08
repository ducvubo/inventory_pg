import { Controller } from '@nestjs/common';
import { StokOutItemService } from './stok-out-item.service';

@Controller('stok-out-item')
export class StokOutItemController {
  constructor(private readonly stokOutItemService: StokOutItemService) {}
}
