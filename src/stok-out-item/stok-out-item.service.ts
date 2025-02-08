import { Injectable } from '@nestjs/common'
import { StockOutItemRepo } from './entities/stock-out-item.repo'
import { StockOutItemQuery } from './entities/stock-out-item.query'

@Injectable()
export class StokOutItemService {
  constructor(
    private readonly stockOutItemRepo: StockOutItemRepo,
    private readonly stockOutItemQuery: StockOutItemQuery
  ) {}
}
