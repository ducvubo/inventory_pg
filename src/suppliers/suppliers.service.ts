import { Injectable } from '@nestjs/common'
import { SupplierQuery } from './entities/suppliers.query'
import { SupplierRepo } from './entities/suppliers.repo'
import { CreateSupplierDto } from './dto/create-supplier.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { UpdateSupplierDto } from './dto/update-supplier.dto'
import { UpdateStatusSupplierDto } from './dto/update-status-supplier.dto'
import { SupplierEntity } from './entities/suppliers.entity'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { UpdateResult } from 'typeorm'
import { ISuppliersService } from './suppliers.interface'

@Injectable()
export class SuppliersService implements ISuppliersService {
  constructor(
    private readonly supplierQuery: SupplierQuery,
    private readonly supplierRepo: SupplierRepo
  ) {}

  async createSupplier(createSupplierDto: CreateSupplierDto, account: IAccount): Promise<SupplierEntity> {
    try {
      return await this.supplierRepo.createSupplier({
        spli_name: createSupplierDto.spli_name,
        spli_phone: createSupplierDto.spli_phone,
        spli_email: createSupplierDto.spli_email,
        spli_address: createSupplierDto.spli_address,
        spli_description: createSupplierDto.spli_description,
        spli_type: createSupplierDto.spli_type,
        spli_res_id: account.account_restaurant_id,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'createSupplier',
        class: 'SuppliersService',
        function: 'createSupplier',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneById(spli_id: string, account: IAccount) {
    try {
      return await this.supplierQuery.findOneById(spli_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'SuppliersService',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateSupplier(updateSupplierDto: UpdateSupplierDto, account: IAccount): Promise<UpdateResult> {
    try {
      const supplierExist = await this.supplierQuery.findOneById(updateSupplierDto.spli_id, account)
      if (!supplierExist) {
        throw new BadRequestError('Nhà cung cấp không tồn tại')
      }
      return await this.supplierRepo.updateSupplier({
        spli_id: updateSupplierDto.spli_id,
        spli_name: updateSupplierDto.spli_name,
        spli_phone: updateSupplierDto.spli_phone,
        spli_email: updateSupplierDto.spli_email,
        spli_address: updateSupplierDto.spli_address,
        spli_description: updateSupplierDto.spli_description,
        spli_type: updateSupplierDto.spli_type,
        spli_res_id: account.account_restaurant_id,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'updateSupplier',
        class: 'SuppliersService',
        function: 'updateSupplier',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteSupplier(spli_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const supplierExist = await this.supplierQuery.findOneById(spli_id, account)
      if (!supplierExist) {
        throw new BadRequestError('Nhà cung cấp không tồn tại')
      }
      return await this.supplierRepo.deleteSupplier(spli_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'deleteSupplier',
        class: 'SuppliersService',
        function: 'deleteSupplier',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreSupplier(spli_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const supplierExist = await this.supplierQuery.findOneById(spli_id, account)
      if (!supplierExist) {
        throw new BadRequestError('Nhà cung cấp không tồn tại')
      }
      return await this.supplierRepo.restoreSupplier(spli_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'restoreSupplier',
        class: 'SuppliersService',
        function: 'restoreSupplier',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusSupplier(
    updateStatusSupplierDto: UpdateStatusSupplierDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      const supplierExist = await this.supplierQuery.findOneById(updateStatusSupplierDto.spli_id, account)
      if (!supplierExist) {
        throw new BadRequestError('Nhà cung cấp không tồn tại')
      }
      return await this.supplierRepo.updateStatusSupplier(updateStatusSupplierDto, account)
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusSupplier',
        class: 'SuppliersService',
        function: 'updateStatusSupplier',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAll(
    {
      pageSize,
      pageIndex,
      spli_name
    }: {
      pageSize: number
      pageIndex: number
      spli_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<SupplierEntity>> {
    try {
      if (!spli_name && typeof spli_name !== 'string') {
        throw new BadRequestError('Nhà cung cấp không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataSupplier = await this.supplierQuery.findAllPagination(
        { pageSize, pageIndex, spli_name, isDeleted: 0 },
        account
      )

      return dataSupplier
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'SuppliersService',
        function: 'findAll',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllRecycle(
    {
      pageSize,
      pageIndex,
      spli_name
    }: {
      pageSize: number
      pageIndex: number
      spli_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<SupplierEntity>> {
    try {
      if (!spli_name && typeof spli_name !== 'string') {
        throw new BadRequestError('Nhà cung cấp không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataSupplier = await this.supplierQuery.findAllPagination(
        { pageSize, pageIndex, spli_name, isDeleted: 1 },
        account
      )

      return dataSupplier
    } catch (error) {
      saveLogSystem({
        action: 'findAllRecycle',
        class: 'SuppliersService',
        function: 'findAllRecycle',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  findAllSupplierName(account: IAccount): Promise<SupplierEntity[]> {
    try {
      return this.supplierQuery.findAllSupplierName(account)
    } catch (error) {
      saveLogSystem({
        action: 'findAllSupplierName',
        class: 'SuppliersService',
        function: 'findAllSupplierName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
