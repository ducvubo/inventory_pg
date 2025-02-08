import { CreateStockOutDto } from './dto/create-stock-out.dto'
import { UpdateStockOutDto } from './dto/update-stock-in.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { StockOutEntity } from './entities/stock-out.entity'
import { UpdateResult } from 'typeorm'

export interface IStockOutService {
  createStockOut(createStockOutDto: CreateStockOutDto, account: IAccount): Promise<StockOutEntity>

  updateStockOut(updateStockOutDto: UpdateStockOutDto, account: IAccount): Promise<UpdateResult>

  findAll(
    params: {
      pageSize: number
      pageIndex: number
      stko_code: string
    },
    account: IAccount
  ): Promise<ResultPagination<StockOutEntity>>

  findAllRecycle(
    params: {
      pageSize: number
      pageIndex: number
      stko_code: string
    },
    account: IAccount
  ): Promise<ResultPagination<StockOutEntity>>

  deleteStockOut(stko_id: string, account: IAccount): Promise<UpdateResult>

  restoreStockOut(stko_id: string, account: IAccount): Promise<UpdateResult>

  findOneById(stko_id: string, account: IAccount): Promise<StockOutEntity>
}
