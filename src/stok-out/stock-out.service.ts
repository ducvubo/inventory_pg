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
import { callGeminiAPI } from 'src/utils/gemini.api'
import * as pdfParse from 'pdf-parse';
import { sendMessageToKafka } from 'src/utils/kafka'
@Injectable()
export class StockOutService implements IStockOutService {
  constructor(
    private readonly stokOutRepo: StockOutRepo,
    private readonly stockOutQuery: StockOutQuery,
    private readonly supplierQuery: SupplierQuery,
    private readonly ingredientQuey: IngredientQuey,
    private readonly stockOutItemQuery: StockOutItemQuery,
    private readonly dataSource: DataSource
  ) { }

  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'EmployeeProto',
      protoPath: join(__dirname, '../grpc/proto/employee.proto'),
      url: process.env.URL_SERVICE_GRPC
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
        throw new BadRequestError('Mã phiếu xuất đã tồn tại, hoặc đã bị xóa vui lòng kiểm tra lại')
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

      const stockOut = await queryRunner.manager.save(StockOutEntity, {
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
            stko_id: stockOut.stko_id,
            stko_item_res_id: account.account_restaurant_id,
            igd_id: item.igd_id,
            stko_item_quantity: item.stko_item_quantity,
            stko_item_price: item.stko_item_price,
            createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
          })
        })
      )

      await queryRunner.commitTransaction()
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Phiếu xuất kho ${createStockOutDto.stko_code} vừa được tạo`,
          noti_title: `Xuất kho`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      return stockOut
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

      const stockOutExists = await this.stockOutQuery.findOneById(stko_id, account)
      if (!stockOutExists) {
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
            throw new BadRequestError('Mã phiếu xuất đã tồn tại, hoặc đã bị xóa vui lòng kiểm tra lại')
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

      const stockOut = queryRunner.manager
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

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Phiếu xuất kho ${updateStockOutDto.stko_code} vừa được cập nhật`,
          noti_title: `Xuất kho`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      return stockOut
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

      const stockOutExists = await this.stockOutQuery.findOneById(stko_id, account)
      if (!stockOutExists) {
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

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Phiếu xuất kho ${stockOutExists.stko_code} vừa được xóa`,
          noti_title: `Xuất kho`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

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

      const stockOutExists = await this.stockOutQuery.findOneById(stko_id, account)
      if (!stockOutExists) {
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

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Phiếu xuất kho ${stockOutExists.stko_code} vừa được khôi phục`,
          noti_title: `Xuất kho`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

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
      const stockOut = await this.stockOutQuery.findOneById(stko_id, account)
      if (!stockOut) {
        throw new BadRequestError('Phiếu xuất không tồn tại')
      }

      const stockOutItems = await this.stockOutItemQuery.findOneByStockOutId(stko_id, account)

      stockOut.items = stockOutItems

      return stockOut
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

  async importPdfFromBuffer(
    buffer: Buffer,
  ): Promise<any> {
    const jsonData = await this.extractJsonFromPdfBuffer(buffer);
    return jsonData;
  }

  async extractJsonFromPdfBuffer(buffer: Buffer): Promise<any> {
    const data = await pdfParse(buffer);
    const rawText = data.text;

    const prompt = `
Dựa vào nội dung sau, hãy trích xuất và trả về dữ liệu ở dạng JSON với các trường sau:
- stko_code: Mã phiếu xuất (tìm từ "Số chứng từ" hoặc "Mã phiếu xuất")
- spli_id: Mã nhà cung cấp (tìm từ "Mã nhà cung cấp" hoặc "Nhà cung cấp", nếu có)
- stko_seller: Người bán/người xuất hàng (tìm từ "Người xuất hàng" hoặc "Họ tên người bán")
- stko_seller_type: Loại người bán (mặc định "employee" nếu không có, nếu có "chủ nhà hàng" thì ghi "restaurant")
- stko_date: Ngày xuất hàng (tìm từ "Ngày ... tháng ... năm ..." hoặc định dạng tương tự, chuyển thành định dạng ISO "YYYY-MM-DD")
- stko_note: Ghi chú (tìm từ "Ghi chú")
- stko_payment_method: Phương thức thanh toán (tìm từ "Phương thức thanh toán", nếu không có, mặc định là "cash")
- stko_type: Loại xuất kho (tìm từ "Loại xuất kho", nếu có "nội bộ" thì ghi "internal", nếu có "bán lẻ" thì ghi "retail", mặc định "internal")
- items: Mảng sản phẩm từ bảng, ánh xạ chính xác theo thứ tự cột trong bảng:
  - stko_item_unit: Đơn vị tính (từ cột "Đơn yị tinh", ví dụ: "Chai", "Túi")
  - stko_item_quantity: Số lượng xuất (từ cột "Số lượng", ví dụ: "10", "20")
  - stko_item_price: Đơn giá (từ cột "Đơn giá", ví dụ: "10000")
  - igd_id: Tên nguyên liệu (từ cột "Tên nguyên liệu" hoặc "Tên sản phẩm", "Tên hàng hóa", ví dụ: "Gạo", "Bột mỳ". Lưu ý không lấy mã nguyên liệu, chỉ lấy tên)

Lưu ý:
- Nếu trường nào không có dữ liệu, để trống bằng chuỗi rỗng "" hoặc mảng rỗng [] cho items.
- Đảm bảo dữ liệu khớp với cấu trúc của StockOutEntity và StockOutItemEntity.
- Chỉ trả về dữ liệu JSON thuần túy, không giải thích hay ký hiệu markdown.

Nội dung:
${rawText}
  `.trim();

    const result = await callGeminiAPI(prompt);
    const clean = result.replace(/```json|```/g, '').trim();

    try {
      return JSON.parse(clean);
    } catch (e) {
      console.error('❌ Parse JSON thất bại:', e.message);
      console.log('Raw Gemini result:', result);
      return null;
    }
  }


}
