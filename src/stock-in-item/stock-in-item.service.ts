import { Injectable } from '@nestjs/common'
import { StockInItemRepo } from './entities/stock-in-item.repo'
import { StockInItemQuery } from './entities/stock-in-item.query'

@Injectable()
export class StockInItemService {
  constructor(
    private readonly stockInItemRepo: StockInItemRepo,
    private readonly stockInItemQuery: StockInItemQuery
  ) {}
}
