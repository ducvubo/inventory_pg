import { Injectable } from '@nestjs/common'
import { UnitRepo } from './entities/units.repo'
import { UnitQuery } from './entities/units.query'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { IAccount } from 'src/guard/interface/account.interface'
import { CreateUnitDto } from './dto/create-unit.dto'
import { UnitEntity } from './entities/units.entity'
import { UpdateUnitDto } from './dto/update-unit.dto'
import { UpdateResult } from 'typeorm'
import { UpdateStatusUnitDto } from './dto/update-status-unit.dto'
import { IUnitsService } from './unit.interface'
import { sendMessageToKafka } from 'src/utils/kafka'

@Injectable()
export class UnitsService implements IUnitsService {
  constructor(
    private readonly unitRepo: UnitRepo,
    private readonly unitQuery: UnitQuery
  ) { }

  async createUnit(createUnitDto: CreateUnitDto, account: IAccount): Promise<UnitEntity> {
    try {
      const unit = await this.unitRepo.createUnit({
        unt_name: createUnitDto.unt_name,
        unt_description: createUnitDto.unt_description,
        unt_symbol: createUnitDto.unt_symbol,
        unt_res_id: account.account_restaurant_id,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Đơn vị đo ${createUnitDto.unt_name} vừa được tạo`,
          noti_title: `Đơn vị đo`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      return unit

    } catch (error) {
      saveLogSystem({
        action: 'createUnit',
        class: 'UnitService',
        function: 'createUnit',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneById(unt_id: string, account: IAccount): Promise<UnitEntity | null> {
    try {
      return this.unitQuery.findOneById(unt_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'UnitService',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateUnit(updateUnitDto: UpdateUnitDto, account: IAccount): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.unitQuery.findOneById(updateUnitDto.unt_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Đơn vị đo không tồn tại')
      }
      const update = await this.unitRepo.updateUnit({
        unt_name: updateUnitDto.unt_name,
        unt_description: updateUnitDto.unt_description,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        unt_res_id: account.account_restaurant_id,
        unt_symbol: updateUnitDto.unt_symbol,
        unt_id: updateUnitDto.unt_id
      })
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Đơn vị đo ${updateUnitDto.unt_name} vừa được cập nhật`,
          noti_title: `Đơn vị đo`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      return update
    } catch (error) {
      saveLogSystem({
        action: 'updateUnit',
        class: 'UnitService',
        function: 'updateUnit',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteUnit(unt_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.unitQuery.findOneById(unt_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Đơn vị đo không tồn tại')
      }
      const deleted = await this.unitRepo.deleteUnit(unt_id, account)
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Đơn vị đo ${catIngredientExist.unt_name} vừa bị xóa`,
          noti_title: `Đơn vị đo`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      return deleted
    } catch (error) {
      saveLogSystem({
        action: 'deleteUnit',
        class: 'UnitService',
        function: 'deleteUnit',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreUnit(unt_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.unitQuery.findOneById(unt_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Đơn vị đo không tồn tại')
      }
      const restore = await this.unitRepo.restoreUnit(unt_id, account)
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Đơn vị đo ${catIngredientExist.unt_name} vừa được khôi phục`,
          noti_title: `Đơn vị đo`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      return restore
    } catch (error) {
      saveLogSystem({
        action: 'restoreUnit',
        class: 'UnitService',
        function: 'restoreUnit',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusUnit(updateStatusUnitDto: UpdateStatusUnitDto, account: IAccount): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.unitQuery.findOneById(updateStatusUnitDto.unt_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Đơn vị đo không tồn tại')
      }
      const update = await this.unitRepo.updateStatusUnit(updateStatusUnitDto, account)

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Đơn vị đo ${catIngredientExist.unt_name} vừa được cập nhật trạng thái`,
          noti_title: `Đơn vị đo`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      return update
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusUnit',
        class: 'UnitService',
        function: 'updateStatusUnit',
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
      unt_name
    }: {
      pageSize: number
      pageIndex: number
      unt_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<UnitEntity>> {
    try {
      if (!unt_name && typeof unt_name !== 'string') {
        throw new BadRequestError('Đơn vị đo không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataUnit = await this.unitQuery.findAllPagination({ pageSize, pageIndex, unt_name, isDeleted: 0 }, account)

      return dataUnit
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'UnitService',
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
      unt_name
    }: {
      pageSize: number
      pageIndex: number
      unt_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<UnitEntity>> {
    try {
      if (!unt_name && typeof unt_name !== 'string') {
        throw new BadRequestError('Đơn vị đo không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataUnit = await this.unitQuery.findAllPagination({ pageSize, pageIndex, unt_name, isDeleted: 1 }, account)

      return dataUnit
    } catch (error) {
      saveLogSystem({
        action: 'findAllRecycle',
        class: 'UnitService',
        function: 'findAllRecycle',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllUnitName(account: IAccount): Promise<UnitEntity[]> {
    try {
      return this.unitQuery.findAllUnitName(account)
    } catch (error) {
      saveLogSystem({
        action: 'findAllUnitName',
        class: 'UnitService',
        function: 'findAllUnitName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
