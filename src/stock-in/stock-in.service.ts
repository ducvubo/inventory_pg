import { Injectable, OnModuleInit } from '@nestjs/common'
import { StockInRepo } from './entities/stock-in.repo'
import { StockInQuery } from './entities/stock-in.query'
import { IStockInService } from './stock-in.interface'
import { IAccount } from 'src/guard/interface/account.interface'
import { CreateStockInDto } from './dto/create-stock-in.dto'
import { StockInEntity } from './entities/stock-in.entity'
import { SupplierQuery } from 'src/suppliers/entities/suppliers.query'
import { saveLogSystem } from 'src/log/sendLog.els'
import { DataSource, UpdateResult } from 'typeorm'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { IEmployeeServiceGprcClient } from 'src/grpc/typescript/employee.client'
import { Client, ClientGrpc, Transport } from '@nestjs/microservices'
import { join } from 'path'
import { IBackendGRPC } from 'src/grpc/typescript/api'
import { firstValueFrom } from 'rxjs'
import { IngredientQuey } from 'src/ingredients/entities/ingredient.query'
import { StockInItemEntity } from 'src/stock-in-item/entities/stock-in-item.entity'
import { UpdateStockInDto } from './dto/update-stock-in.dto'
import { StockInItemQuery } from 'src/stock-in-item/entities/stock-in-item.query'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { configService } from 'src/config/configService'

@Injectable()
export class StockInService implements IStockInService, OnModuleInit {
  constructor(
    private readonly stockInRepo: StockInRepo,
    private readonly stockInQuery: StockInQuery,
    private readonly supplierQuery: SupplierQuery,
    private readonly ingredientQuey: IngredientQuey,
    private readonly stockInItemQuery: StockInItemQuery,
    private readonly dataSource: DataSource
  ) {}

  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'EmployeeProto',
      protoPath: join(__dirname, '../grpc/proto/employee.proto'),
      url: configService.get<string>('URL_SERVICE_GRPC')
    }
  })
  client: ClientGrpc
  private employeeServiceGrpc: IEmployeeServiceGprcClient

  onModuleInit() {
    this.employeeServiceGrpc = this.client.getService<IEmployeeServiceGprcClient>('EmployeeServiceGprc')
  }

  async createStockIn(createStockInDto: CreateStockInDto, account: IAccount): Promise<StockInEntity> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const {
        spli_id,
        stki_code,
        stki_image,
        stki_delivery_name,
        stki_delivery_phone,
        stki_note,
        stki_payment_method,
        stki_receiver,
        stki_receiver_type,
        stock_in_items
      } = createStockInDto

      let { stki_date } = createStockInDto
      stki_date = new Date(new Date(stki_date).toISOString().split('T')[0])

      const supplierExits = await this.supplierQuery.findOneById(spli_id, account)
      if (!supplierExits) {
        throw new BadRequestError('Nhà cung cấp không tồn tại')
      }

      const codeExist = await this.stockInQuery.findOneByCode(stki_code, account)
      if (codeExist) {
        throw new BadRequestError('Mã phiếu nhập đã tồn tại')
      }

      if (stki_receiver_type === 'employee') {
        const employeeExists: IBackendGRPC = await firstValueFrom(
          (await this.employeeServiceGrpc.findOneEmployeeById({
            id: stki_receiver,
            eplResId: account.account_restaurant_id
          })) as any
        )

        if (!employeeExists.status) {
          throw new BadRequestError('Nhân viên không tồn tại')
        }
      }

      await Promise.all(
        stock_in_items.map(async (item) => {
          const ingredientExists = await this.ingredientQuey.findOneById(item.igd_id, account)
          if (!ingredientExists) {
            throw new BadRequestError('Nguyên liệu không tồn tại')
          }
        })
      )

      const stockIn = await queryRunner.manager.save(StockInEntity, {
        stki_res_id: account.account_restaurant_id,
        spli_id,
        stki_code,
        stki_image,
        stki_delivery_name,
        stki_delivery_phone,
        stki_receiver,
        stki_receiver_type,
        stki_date,
        stki_note,
        stki_payment_method,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })

      await Promise.all(
        stock_in_items.map(async (item) => {
          await queryRunner.manager.save(StockInItemEntity, {
            stki_id: stockIn.stki_id,
            stki_item_res_id: account.account_restaurant_id,
            igd_id: item.igd_id,
            stki_item_quantity: item.stki_item_quantity,
            stki_item_quantity_real: item.stki_item_quantity_real,
            stki_item_price: item.stki_item_price,
            createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
          })
        })
      )

      await queryRunner.commitTransaction()

      return stockIn
    } catch (error) {
      await queryRunner.rollbackTransaction()
      saveLogSystem({
        action: 'createStockIn',
        class: 'StockInService',
        function: 'createStockIn',
        message: error.message,
        time: new Date(),
        type: 'error',
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStockIn(updateStockInDto: UpdateStockInDto, account: IAccount): Promise<UpdateResult> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const {
        stki_id,
        spli_id,
        stki_image,
        stki_code,
        stki_delivery_name,
        stki_delivery_phone,
        stki_note,
        stki_payment_method,
        stki_receiver,
        stki_receiver_type,
        stock_in_items
      } = updateStockInDto

      let { stki_date } = updateStockInDto
      stki_date = new Date(new Date(stki_date).toISOString().split('T')[0])

      const stockInExists = await this.stockInQuery.findOneById(stki_id, account)
      if (!stockInExists) {
        throw new BadRequestError('Phiếu nhập không tồn tại')
      }

      const supplierExits = await this.supplierQuery.findOneById(spli_id, account)
      if (!supplierExits) {
        throw new BadRequestError('Nhà cung cấp không tồn tại')
      }

      const codeExist: StockInItemEntity[] = await this.stockInQuery.findOneByCodeWithUpdate(stki_code, account)
      if (codeExist.length >= 1) {
        // if (codeExist[0].stki_id !== stki_id) {
        //   throw new BadRequestError('Mã phiếu nhập đã tồn tại')
        // }
        //lăp qua danh sách mã phiếu nhập
        for (const item of codeExist) {
          if (item.stki_id !== stki_id) {
            throw new BadRequestError('Mã phiếu nhập đã tồn tại')
          }
        }
      }

      if (stki_receiver_type === 'employee') {
        const employeeExists: IBackendGRPC = await firstValueFrom(
          (await this.employeeServiceGrpc.findOneEmployeeById({
            id: stki_receiver,
            eplResId: account.account_restaurant_id
          })) as any
        )

        if (!employeeExists.status) {
          throw new BadRequestError('Nhân viên không tồn tại')
        }
      }

      await Promise.all(
        stock_in_items.map(async (item) => {
          const ingredientExists = await this.ingredientQuey.findOneById(item.igd_id, account)
          if (!ingredientExists) {
            throw new BadRequestError('Nguyên liệu không tồn tại')
          }
        })
      )

      const listStockInItems = await this.stockInItemQuery.findOneByStockInId(stki_id, account)

      Promise.all(
        listStockInItems.map(async (item) => {
          await queryRunner.manager.remove(StockInItemEntity, {
            stki_item_id: item.stki_item_id
          })
        })
      )

      await Promise.all(
        stock_in_items.map(async (item) => {
          await queryRunner.manager.save(StockInItemEntity, {
            stki_id: stki_id,
            stki_item_res_id: account.account_restaurant_id,
            igd_id: item.igd_id,
            stki_item_quantity: item.stki_item_quantity,
            stki_item_quantity_real: item.stki_item_quantity_real,
            stki_item_price: item.stki_item_price,
            createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
          })
        })
      )

      const stockIn = queryRunner.manager
        .createQueryBuilder()
        .update(StockInEntity)
        .set({
          stki_id,
          stki_image,
          stki_res_id: account.account_restaurant_id,
          spli_id,
          stki_code,
          stki_delivery_name,
          stki_delivery_phone,
          stki_receiver,
          stki_receiver_type,
          stki_date,
          stki_note,
          stki_payment_method,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({
          stki_id,
          stki_res_id: account.account_restaurant_id
        })
        .execute()

      await queryRunner.commitTransaction()

      return stockIn
    } catch (error) {
      saveLogSystem({
        action: 'updateStockIn',
        class: 'StockInService',
        function: 'updateStockIn',
        message: error.message,
        time: new Date(),
        type: 'error',
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAll(
    {
      pageSize,
      pageIndex,
      stki_code
    }: {
      pageSize: number
      pageIndex: number
      stki_code: string
    },
    account: IAccount
  ): Promise<ResultPagination<StockInEntity>> {
    try {
      if (!stki_code && typeof stki_code !== 'string') {
        throw new BadRequestError('Phiếu nhập không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataUnit = await this.stockInQuery.findAllPagination(
        { pageSize, pageIndex, stki_code, isDeleted: 0 },
        account
      )

      return dataUnit
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'StockInService',
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
      stki_code
    }: {
      pageSize: number
      pageIndex: number
      stki_code: string
    },
    account: IAccount
  ): Promise<ResultPagination<StockInEntity>> {
    try {
      if (!stki_code && typeof stki_code !== 'string') {
        throw new BadRequestError('Phiếu nhập không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataUnit = await this.stockInQuery.findAllPagination(
        { pageSize, pageIndex, stki_code, isDeleted: 1 },
        account
      )

      return dataUnit
    } catch (error) {
      saveLogSystem({
        action: 'findAllRecycle',
        class: 'StockInService',
        function: 'findAllRecycle',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteStockIn(stki_id: string, account: IAccount): Promise<UpdateResult> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const stockInExists = await this.stockInQuery.findOneById(stki_id, account)
      if (!stockInExists) {
        throw new BadRequestError('Phiếu nhập không tồn tại')
      }
      const listStockInItems = await this.stockInItemQuery.findOneByStockInId(stki_id, account)

      Promise.all(
        listStockInItems.map(async (item) => {
          queryRunner.manager
            .createQueryBuilder()
            .update(StockInItemEntity)
            .set({
              isDeleted: 1,
              deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
              deletedAt: new Date(),
              stki_item_id: item.stki_item_id
            })
            .where({
              stki_item_id: item.stki_item_id,
              stki_item_res_id: account.account_restaurant_id
            })
            .execute()
        })
      )

      const deleted = queryRunner.manager
        .createQueryBuilder()
        .update(StockInEntity)
        .set({
          isDeleted: 1,
          deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: new Date(),
          stki_id: stki_id
        })
        .where({
          stki_id: stki_id,
          stki_res_id: account.account_restaurant_id
        })
        .execute()

      await queryRunner.commitTransaction()

      return deleted
    } catch (error) {
      await queryRunner.rollbackTransaction()
      saveLogSystem({
        action: 'deleteStockIn',
        class: 'StockInService',
        function: 'deleteStockIn',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreStockIn(stki_id: string, account: IAccount): Promise<UpdateResult> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const stockInExists = await this.stockInQuery.findOneById(stki_id, account)
      if (!stockInExists) {
        throw new BadRequestError('Phiếu nhập không tồn tại')
      }
      const listStockInItems = await this.stockInItemQuery.findOneByStockInId(stki_id, account)

      for (const item of listStockInItems) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(StockInItemEntity)
          .set({
            isDeleted: 0,
            deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
            deletedAt: new Date(),
            stki_item_id: item.stki_item_id
          })
          .where({
            stki_item_id: item.stki_item_id,
            stki_item_res_id: account.account_restaurant_id
          })
          .execute()
      }

      const deleted = queryRunner.manager
        .createQueryBuilder()
        .update(StockInEntity)
        .set({
          isDeleted: 0,
          deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: new Date(),
          stki_id: stki_id
        })
        .where({
          stki_id: stki_id,
          stki_res_id: account.account_restaurant_id
        })
        .execute()

      await queryRunner.commitTransaction()

      return deleted
    } catch (error) {
      await queryRunner.rollbackTransaction()
      saveLogSystem({
        action: 'restoreStockIn',
        class: 'StockInService',
        function: 'restoreStockIn',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneById(stki_id: string, account: IAccount): Promise<StockInEntity> {
    try {
      const stockIn = await this.stockInQuery.findOneById(stki_id, account)
      if (!stockIn) {
        throw new BadRequestError('Phiếu nhập không tồn tại')
      }

      const stockInItems = await this.stockInItemQuery.findOneByStockInId(stki_id, account)

      stockIn.items = stockInItems

      return stockIn
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'StockInService',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
