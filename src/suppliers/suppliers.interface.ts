import { UpdateResult } from 'typeorm'
import { CreateSupplierDto } from './dto/create-supplier.dto'
import { UpdateSupplierDto } from './dto/update-supplier.dto'
import { UpdateStatusSupplierDto } from './dto/update-status-supplier.dto'
import { SupplierEntity } from './entities/suppliers.entity'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { IAccount } from 'src/guard/interface/account.interface'

export interface ISuppliersService {
  createSupplier(createSupplierDto: CreateSupplierDto, account: IAccount): Promise<SupplierEntity>

  findOneById(spli_id: string, account: IAccount): Promise<SupplierEntity | null>

  updateSupplier(updateSupplierDto: UpdateSupplierDto, account: IAccount): Promise<UpdateResult>

  deleteSupplier(spli_id: string, account: IAccount): Promise<UpdateResult>

  restoreSupplier(spli_id: string, account: IAccount): Promise<UpdateResult>

  updateStatusSupplier(updateStatusSupplierDto: UpdateStatusSupplierDto, account: IAccount): Promise<UpdateResult>

  findAll(
    query: { pageSize: number; pageIndex: number; spli_name: string },
    account: IAccount
  ): Promise<ResultPagination<SupplierEntity>>

  findAllRecycle(
    query: { pageSize: number; pageIndex: number; spli_name: string },
    account: IAccount
  ): Promise<ResultPagination<SupplierEntity>>
  findAllSupplierName(account: IAccount): Promise<SupplierEntity[]>
}
