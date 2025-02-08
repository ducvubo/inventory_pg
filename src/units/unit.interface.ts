import { UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { UnitEntity } from './entities/units.entity'
import { IAccount } from 'src/guard/interface/account.interface'
import { CreateUnitDto } from './dto/create-unit.dto'
import { UpdateUnitDto } from './dto/update-unit.dto'
import { UpdateStatusUnitDto } from './dto/update-status-unit.dto'

export interface IUnitsService {
  createUnit(createUnitDto: CreateUnitDto, account: IAccount): Promise<UnitEntity>
  findOneById(unt_id: string, account: IAccount): Promise<UnitEntity | null>
  updateUnit(updateUnitDto: UpdateUnitDto, account: IAccount): Promise<UpdateResult>
  deleteUnit(unt_id: string, account: IAccount): Promise<UpdateResult>
  restoreUnit(unt_id: string, account: IAccount): Promise<UpdateResult>
  updateStatusUnit(updateStatusUnitDto: UpdateStatusUnitDto, account: IAccount): Promise<UpdateResult>
  findAll(
    params: { pageSize: number; pageIndex: number; unt_name: string },
    account: IAccount
  ): Promise<ResultPagination<UnitEntity>>
  findAllRecycle(
    params: { pageSize: number; pageIndex: number; unt_name: string },
    account: IAccount
  ): Promise<ResultPagination<UnitEntity>>
  findAllUnitName(account: IAccount): Promise<UnitEntity[]>
}
