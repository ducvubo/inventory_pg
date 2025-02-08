import { IAccount } from 'src/guard/interface/account.interface'
import { CreateStockInDto } from './dto/create-stock-in.dto'
import { StockInEntity } from './entities/stock-in.entity'
import { UpdateStockInDto } from './dto/update-stock-in.dto'
import { UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'

export interface IStockInService {
  createStockIn(createStockInDto: CreateStockInDto, account: IAccount): Promise<StockInEntity>
  updateStockIn(updateStockInDto: UpdateStockInDto, account: IAccount): Promise<UpdateResult>
  findAll(
    {
      pageIndex,
      pageSize,
      stki_code
    }: {
      pageSize: number
      pageIndex: number
      stki_code: string
    },
    account: IAccount
  ): Promise<ResultPagination<StockInEntity>>
  findAllRecycle(
    {
      pageIndex,
      pageSize,
      stki_code
    }: {
      pageSize: number
      pageIndex: number
      stki_code: string
    },
    account: IAccount
  ): Promise<ResultPagination<StockInEntity>>
  deleteStockIn(stki_id: string, account: IAccount): Promise<UpdateResult>
  restoreStockIn(stki_id: string, account: IAccount): Promise<UpdateResult>
  findOneById(stki_id: string, account: IAccount): Promise<StockInEntity>
}
