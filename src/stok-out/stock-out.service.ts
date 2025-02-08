import { Injectable } from '@nestjs/common'
import { StockOutRepo } from './entities/stock-out.repo'
import { StockOutQuery } from './entities/stock-out.query'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { SupplierQuery } from 'src/suppliers/entities/suppliers.query'
import { IngredientQuey } from 'src/ingredients/entities/ingredient.query'
import { DataSource, UpdateResult } from 'typeorm'
import { StockOutItemQuery } from 'src/stok-out-item/entities/stock-out-item.query'
import { Client, ClientGrpc, Transport } from '@nestjs/microservices'
import { join } from 'path'
import { IEmployeeServiceGprcClient } from 'src/grpc/typescript/employee.client'
import { CreateStockOutDto } from './dto/create-stock-out.dto'
import { IBackendGRPC } from 'src/grpc/typescript/api'
import { firstValueFrom } from 'rxjs'
import { StockOutEntity } from './entities/stock-out.entity'
import { StockOutItemEntity } from 'src/stok-out-item/entities/stock-out-item.entity'
import { UpdateStockOutDto } from './dto/update-stock-in.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { IStockOutService } from './stock-out.interface'
import { configService } from 'src/config/configService'

@Injectable()
export class StockOutService implements IStockOutService {
  constructor(
    private readonly stokOutRepo: StockOutRepo,
    private readonly stockOutQuery: StockOutQuery,
    private readonly supplierQuery: SupplierQuery,
    private readonly ingredientQuey: IngredientQuey,
    private readonly stockOutItemQuery: StockOutItemQuery,
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

  async createStockOut(createStockOutDto: CreateStockOutDto, account: IAccount): Promise<StockOutEntity> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const {
        spli_id,
        stko_code,
        stko_image,
        stko_note,
        stko_payment_method,
        stko_seller,
        stko_seller_type,
        stock_out_items,
        stko_type
      } = createStockOutDto

      let { stko_date } = createStockOutDto
      stko_date = new Date(new Date(stko_date).toISOString().split('T')[0])

      const supplierExits = await this.supplierQuery.findOneById(spli_id, account)
      if (!supplierExits) {
        throw new BadRequestError('Nhà cung cấp không tồn tại')
      }

      const codeExist = await this.stockOutQuery.findOneByCode(stko_code, account)
      if (codeExist) {
        throw new BadRequestError('Mã phiếu xuất đã tồn tại')
      }

      if (stko_seller_type === 'employee') {
        const employeeExists: IBackendGRPC = await firstValueFrom(
          (await this.employeeServiceGrpc.findOneEmployeeById({
            id: stko_seller,
            eplResId: account.account_restaurant_id
          })) as any
        )

        if (!employeeExists.status) {
          throw new BadRequestError('Nhân viên không tồn tại')
        }
      }

      await Promise.all(
        stock_out_items.map(async (item) => {
          const ingredientExists = await this.ingredientQuey.findOneById(item.igd_id, account)
          if (!ingredientExists) {
            throw new BadRequestError('Nguyên liệu không tồn tại')
          }
        })
      )

      const stockIn = await queryRunner.manager.save(StockOutEntity, {
        stko_res_id: account.account_restaurant_id,
        spli_id,
        stko_code,
        stko_image,
        stko_seller,
        stko_seller_type,
        stko_date,
        stko_note,
        stko_type,
        stko_payment_method,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })

      await Promise.all(
        stock_out_items.map(async (item) => {
          await queryRunner.manager.save(StockOutItemEntity, {
            stko_id: stockIn.stko_id,
            stko_item_res_id: account.account_restaurant_id,
            igd_id: item.igd_id,
            stko_item_quantity: item.stko_item_quantity,
            stko_item_price: item.stko_item_price,
            createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
          })
        })
      )

      await queryRunner.commitTransaction()

      return stockIn
    } catch (error) {
      await queryRunner.rollbackTransaction()
      saveLogSystem({
        action: 'createStockOut',
        class: 'StockOutService',
        function: 'createStockOut',
        message: error.message,
        time: new Date(),
        type: 'error',
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStockOut(updateStockOutDto: UpdateStockOutDto, account: IAccount): Promise<UpdateResult> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const {
        stko_id,
        spli_id,
        stko_image,
        stko_code,
        stko_note,
        stko_payment_method,
        stko_seller,
        stko_seller_type,
        stock_out_items,
        stko_type
      } = updateStockOutDto

      let { stko_date } = updateStockOutDto
      stko_date = new Date(new Date(stko_date).toISOString().split('T')[0])

      const stockInExists = await this.stockOutQuery.findOneById(stko_id, account)
      if (!stockInExists) {
        throw new BadRequestError('Phiếu xuất không tồn tại')
      }

      const supplierExits = await this.supplierQuery.findOneById(spli_id, account)
      if (!supplierExits) {
        throw new BadRequestError('Nhà cung cấp không tồn tại')
      }

      const codeExist: StockOutItemEntity[] = await this.stockOutQuery.findOneByCodeWithUpdate(stko_code, account)
      if (codeExist.length >= 1) {
        // if (codeExist[0].stko_id !== stko_id) {
        //   throw new BadRequestError('Mã phiếu xuất đã tồn tại')
        // }
        //lăp qua danh sách mã phiếu xuất
        for (const item of codeExist) {
          if (item.stko_id !== stko_id) {
            throw new BadRequestError('Mã phiếu xuất đã tồn tại')
          }
        }
      }

      if (stko_seller_type === 'employee') {
        const employeeExists: IBackendGRPC = await firstValueFrom(
          (await this.employeeServiceGrpc.findOneEmployeeById({
            id: stko_seller,
            eplResId: account.account_restaurant_id
          })) as any
        )

        if (!employeeExists.status) {
          throw new BadRequestError('Nhân viên không tồn tại')
        }
      }

      await Promise.all(
        stock_out_items.map(async (item) => {
          const ingredientExists = await this.ingredientQuey.findOneById(item.igd_id, account)
          if (!ingredientExists) {
            throw new BadRequestError('Nguyên liệu không tồn tại')
          }
        })
      )

      const listStockOutItems = await this.stockOutItemQuery.findOneByStockOutId(stko_id, account)

      Promise.all(
        listStockOutItems.map(async (item) => {
          await queryRunner.manager.remove(StockOutItemEntity, {
            stko_item_id: item.stko_item_id
          })
        })
      )

      await Promise.all(
        stock_out_items.map(async (item) => {
          await queryRunner.manager.save(StockOutItemEntity, {
            stko_id: stko_id,
            stko_item_res_id: account.account_restaurant_id,
            igd_id: item.igd_id,
            stko_item_quantity: item.stko_item_quantity,
            stko_item_price: item.stko_item_price,
            createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
          })
        })
      )

      const stockIn = queryRunner.manager
        .createQueryBuilder()
        .update(StockOutEntity)
        .set({
          stko_id,
          stko_image,
          stko_res_id: account.account_restaurant_id,
          spli_id,
          stko_code,
          stko_seller,
          stko_seller_type,
          stko_type,
          stko_date,
          stko_note,
          stko_payment_method,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({
          stko_id,
          stko_res_id: account.account_restaurant_id
        })
        .execute()

      await queryRunner.commitTransaction()

      return stockIn
    } catch (error) {
      saveLogSystem({
        action: 'updateStockOut',
        class: 'StockOutService',
        function: 'updateStockOut',
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
      stko_code
    }: {
      pageSize: number
      pageIndex: number
      stko_code: string
    },
    account: IAccount
  ): Promise<ResultPagination<StockOutEntity>> {
    try {
      if (!stko_code && typeof stko_code !== 'string') {
        throw new BadRequestError('Phiếu xuất không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataUnit = await this.stockOutQuery.findAllPagination(
        { pageSize, pageIndex, stko_code, isDeleted: 0 },
        account
      )

      return dataUnit
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'StockOutService',
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
      stko_code
    }: {
      pageSize: number
      pageIndex: number
      stko_code: string
    },
    account: IAccount
  ): Promise<ResultPagination<StockOutEntity>> {
    try {
      if (!stko_code && typeof stko_code !== 'string') {
        throw new BadRequestError('Phiếu xuất không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataUnit = await this.stockOutQuery.findAllPagination(
        { pageSize, pageIndex, stko_code, isDeleted: 1 },
        account
      )

      return dataUnit
    } catch (error) {
      saveLogSystem({
        action: 'findAllRecycle',
        class: 'StockOutService',
        function: 'findAllRecycle',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteStockOut(stko_id: string, account: IAccount): Promise<UpdateResult> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const stockInExists = await this.stockOutQuery.findOneById(stko_id, account)
      if (!stockInExists) {
        throw new BadRequestError('Phiếu xuất không tồn tại')
      }
      const listStockOutItems = await this.stockOutItemQuery.findOneByStockOutId(stko_id, account)

      Promise.all(
        listStockOutItems.map(async (item) => {
          queryRunner.manager
            .createQueryBuilder()
            .update(StockOutItemEntity)
            .set({
              isDeleted: 1,
              deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
              deletedAt: new Date(),
              stko_item_id: item.stko_item_id
            })
            .where({
              stko_item_id: item.stko_item_id,
              stko_item_res_id: account.account_restaurant_id
            })
            .execute()
        })
      )

      const deleted = queryRunner.manager
        .createQueryBuilder()
        .update(StockOutEntity)
        .set({
          isDeleted: 1,
          deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: new Date(),
          stko_id: stko_id
        })
        .where({
          stko_id: stko_id,
          stko_res_id: account.account_restaurant_id
        })
        .execute()

      await queryRunner.commitTransaction()

      return deleted
    } catch (error) {
      await queryRunner.rollbackTransaction()
      saveLogSystem({
        action: 'deleteStockOut',
        class: 'StockOutService',
        function: 'deleteStockOut',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreStockOut(stko_id: string, account: IAccount): Promise<UpdateResult> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const stockInExists = await this.stockOutQuery.findOneById(stko_id, account)
      if (!stockInExists) {
        throw new BadRequestError('Phiếu xuất không tồn tại')
      }
      const listStockOutItems = await this.stockOutItemQuery.findOneByStockOutId(stko_id, account)

      for (const item of listStockOutItems) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(StockOutItemEntity)
          .set({
            isDeleted: 0,
            deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
            deletedAt: new Date(),
            stko_item_id: item.stko_item_id
          })
          .where({
            stko_item_id: item.stko_item_id,
            stko_item_res_id: account.account_restaurant_id
          })
          .execute()
      }

      const deleted = queryRunner.manager
        .createQueryBuilder()
        .update(StockOutEntity)
        .set({
          isDeleted: 0,
          deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: new Date(),
          stko_id: stko_id
        })
        .where({
          stko_id: stko_id,
          stko_res_id: account.account_restaurant_id
        })
        .execute()

      await queryRunner.commitTransaction()

      return deleted
    } catch (error) {
      await queryRunner.rollbackTransaction()
      saveLogSystem({
        action: 'restoreStockOut',
        class: 'StockOutService',
        function: 'restoreStockOut',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneById(stko_id: string, account: IAccount): Promise<StockOutEntity> {
    try {
      const stockIn = await this.stockOutQuery.findOneById(stko_id, account)
      if (!stockIn) {
        throw new BadRequestError('Phiếu xuất không tồn tại')
      }

      const stockInItems = await this.stockOutItemQuery.findOneByStockOutId(stko_id, account)

      stockIn.items = stockInItems

      return stockIn
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'StockOutService',
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
