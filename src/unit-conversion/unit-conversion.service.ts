import { Injectable } from '@nestjs/common'
import { UnitConversionRepo } from './entities/unit-conversion.repo'
import { UnitConversionQuery } from './entities/unit-conversion.query'
import { CreateUnitConversionDto } from './dto/create-unit-conversion.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { UnitConversionEntity } from './entities/unit-conversion.entity'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { UpdateUnitConversionDto } from './dto/update-unit-conversion.dto'
import { UpdateResult } from 'typeorm'
import { UnitQuery } from 'src/units/entities/units.query'

@Injectable()
export class UnitConversionService {
  constructor(
    private readonly unitConversionRepo: UnitConversionRepo,
    private readonly unitConversionQuery: UnitConversionQuery,
    private readonly unitQuery: UnitQuery
  ) {}

  async createUnitConversion(
    createUnitConversionDto: CreateUnitConversionDto,
    account: IAccount
  ): Promise<UnitConversionEntity> {
    try {
      const unitConversionFromExits = await this.unitConversionQuery.findUnitConversionFrom({
        unt_cvs_res_id: account.account_restaurant_id,
        unt_cvs_unt_id_from: createUnitConversionDto.unt_cvs_unt_id_from,
        unt_cvs_unt_id_to: createUnitConversionDto.unt_cvs_unt_id_to
      })

      if (unitConversionFromExits) {
        throw new BadRequestError('Đơn vị chuyển đổi đã tồn tại')
      }

      const unitConversionToExits = await this.unitConversionQuery.findUnitConversionFrom({
        unt_cvs_res_id: account.account_restaurant_id,
        unt_cvs_unt_id_from: createUnitConversionDto.unt_cvs_unt_id_to,
        unt_cvs_unt_id_to: createUnitConversionDto.unt_cvs_unt_id_from
      })

      if (unitConversionToExits) {
        throw new BadRequestError('Đơn vị chuyển đổi đã tồn tại')
      }

      return this.unitConversionRepo.createUnitConversion({
        unt_cvs_res_id: account.account_restaurant_id,
        unt_cvs_unt_id_from: createUnitConversionDto.unt_cvs_unt_id_from,
        unt_cvs_unt_id_to: createUnitConversionDto.unt_cvs_unt_id_to,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'createUnitConversion',
        class: 'UnitConversionService',
        function: 'createUnitConversion',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteUnitConversion(unt_cvs_id: string): Promise<boolean> {
    try {
      const result = await this.unitConversionRepo.deleteUnitConversion(unt_cvs_id)
      return result.affected > 0
    } catch (error) {
      saveLogSystem({
        action: 'deleteUnitConversion',
        class: 'UnitConversionService',
        function: 'deleteUnitConversion',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateUnitConversion(
    updateUnitConversionDto: UpdateUnitConversionDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      return this.unitConversionRepo.updateUnitConversion({
        unt_cvs_id: updateUnitConversionDto.unt_cvs_id,
        unt_cvs_value: updateUnitConversionDto.unt_cvs_value,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'updateUnitConversion',
        class: 'UnitConversionService',
        function: 'updateUnitConversion',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getListUnitConversion(
    unt_id: string,
    account: IAccount
  ): Promise<{
    from: UnitConversionEntity[]
    to: UnitConversionEntity[]
  }> {
    try {
      const unitExist = await this.unitQuery.findOneById(unt_id, account)
      if (!unitExist) {
        throw new BadRequestError('Đơn vị không tồn tại')
      }
      return this.unitConversionQuery.getListUnitConversionByUnitId({
        unt_id: unt_id,
        unt_cvs_res_id: account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'getListUnitConversion',
        class: 'UnitConversionService',
        function: 'getListUnitConversion',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
