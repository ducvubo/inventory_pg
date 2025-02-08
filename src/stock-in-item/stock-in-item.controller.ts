import { Controller } from '@nestjs/common';
import { StockInItemService } from './stock-in-item.service';

@Controller('stock-in-item')
export class StockInItemController {
  constructor(private readonly stockInItemService: StockInItemService) {}
}
