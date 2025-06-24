import { BadRequestException, Injectable } from '@nestjs/common'
import { IngredientRepo } from './entities/ingredient.repo'
import { IngredientQuey } from './entities/ingredient.query'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { IngredientEntity } from './entities/ingredient.entity'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateStatusIngredientDto } from './dto/update-status-ingredient.dto'
import { Between, Repository, UpdateResult } from 'typeorm'
import { CreateIngredientDto } from './dto/create-ingredient.dto'
import { UpdateIngredientDto } from './dto/update-ingredient.dto'
import { IIngredientsService } from './ingredients.interface'
import { InjectRepository } from '@nestjs/typeorm'
import { StockInItemEntity } from 'src/stock-in-item/entities/stock-in-item.entity'
import { StockOutItemEntity } from 'src/stok-out-item/entities/stock-out-item.entity'
import { StockInEntity } from 'src/stock-in/entities/stock-in.entity'
import { StockOutEntity } from 'src/stok-out/entities/stock-out.entity'
import { CatIngredientEntity } from 'src/cat-ingredient/entities/cat-ingredient.entity'
import { GetLowStockDto, GetStatsDto } from './dto/get-stats.dto'
import { sendMessageToKafka } from 'src/utils/kafka'
import { format } from 'date-fns';
@Injectable()
export class IngredientsService implements IIngredientsService {
  constructor(
    private readonly ingredientRepo: IngredientRepo,
    private readonly ingredientQuery: IngredientQuey,
    @InjectRepository(StockInItemEntity)
    private stockInItemRepo: Repository<StockInItemEntity>,
    @InjectRepository(StockOutItemEntity)
    private stockOutItemRepo: Repository<StockOutItemEntity>,
    @InjectRepository(IngredientEntity)
    private ingredientRepoDas: Repository<IngredientEntity>,
    @InjectRepository(StockInEntity)
    private stockInRepo: Repository<StockInEntity>,
    @InjectRepository(StockOutEntity)
    private stockOutRepo: Repository<StockOutEntity>,
    @InjectRepository(CatIngredientEntity)
    private catIngredientRepo: Repository<CatIngredientEntity>,
  ) { }

  async createIngredient(createIngredientDto: CreateIngredientDto, account: IAccount): Promise<IngredientEntity> {
    try {
      const ingredient = await this.ingredientRepo.createIngredient({
        igd_name: createIngredientDto.igd_name,
        igd_description: createIngredientDto.igd_description,
        cat_igd_id: createIngredientDto.cat_igd_id,
        igd_image: createIngredientDto.igd_image,
        igd_res_id: account.account_restaurant_id,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        unt_id: createIngredientDto.unt_id
      })

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Nguyên liệu ${createIngredientDto.igd_name} vừa được tạo mới`,
          noti_title: `Nguyên liệu`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      return ingredient
    } catch (error) {
      saveLogSystem({
        action: 'createIngredient',
        class: 'IngredientService',
        function: 'createIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneById(igd_id: string, account: IAccount): Promise<IngredientEntity | null> {
    try {
      return this.ingredientQuery.findOneById(igd_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'IngredientService',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateIngredient(updateIngredientDto: UpdateIngredientDto, account: IAccount): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.ingredientQuery.findOneById(updateIngredientDto.igd_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Nguyên liệu không tồn tại')
      }
      const update = await this.ingredientRepo.updateIngredient({
        igd_name: updateIngredientDto.igd_name,
        igd_description: updateIngredientDto.igd_description,
        igd_image: updateIngredientDto.igd_image,
        cat_igd_id: updateIngredientDto.cat_igd_id,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        igd_res_id: account.account_restaurant_id,
        igd_id: updateIngredientDto.igd_id,
        unt_id: updateIngredientDto.unt_id
      })

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Nguyên liệu ${updateIngredientDto.igd_name} vừa được cập nhật`,
          noti_title: `Nguyên liệu`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      return update
    } catch (error) {
      saveLogSystem({
        action: 'updateIngredient',
        class: 'IngredientService',
        function: 'updateIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteIngredient(igd_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.ingredientQuery.findOneById(igd_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Nguyên liệu không tồn tại')
      }
      const deleted = await this.ingredientRepo.deleteIngredient(igd_id, account)
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Nguyên liệu ${catIngredientExist.igd_name} vừa được chuyển vào thùng rác`,
          noti_title: `Nguyên liệu`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      return deleted
    } catch (error) {
      saveLogSystem({
        action: 'deleteIngredient',
        class: 'IngredientService',
        function: 'deleteIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreIngredient(igd_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.ingredientQuery.findOneById(igd_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Nguyên liệu không tồn tại')
      }
      const update = await this.ingredientRepo.restoreIngredient(igd_id, account)

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Nguyên liệu ${catIngredientExist.igd_name} vừa được khôi phục`,
          noti_title: `Nguyên liệu`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      return update

    } catch (error) {
      saveLogSystem({
        action: 'restoreIngredient',
        class: 'IngredientService',
        function: 'restoreIngredient',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusIngredient(
    updateStatusIngredientDto: UpdateStatusIngredientDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      const catIngredientExist = await this.ingredientQuery.findOneById(updateStatusIngredientDto.igd_id, account)
      if (!catIngredientExist) {
        throw new BadRequestError('Nguyên liệu không tồn tại')
      }
      const update = await this.ingredientRepo.updateStatusIngredient(updateStatusIngredientDto, account)

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Nguyên liệu ${catIngredientExist.igd_name} vừa được cập nhật trạng thái`,
          noti_title: `Nguyên liệu`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      return update
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusIngredient',
        class: 'IngredientService',
        function: 'updateStatusIngredient',
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
      igd_name
    }: {
      pageSize: number
      pageIndex: number
      igd_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<IngredientEntity>> {
    try {
      if (!igd_name && typeof igd_name !== 'string') {
        throw new BadRequestError('Nguyên liệu không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataIngredient = await this.ingredientQuery.findAllPagination(
        { pageSize, pageIndex, igd_name, isDeleted: 0 },
        account
      )

      return dataIngredient
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'IngredientService',
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
      igd_name
    }: {
      pageSize: number
      pageIndex: number
      igd_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<IngredientEntity>> {
    try {
      if (!igd_name && typeof igd_name !== 'string') {
        throw new BadRequestError('Nguyên liệu không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataIngredient = await this.ingredientQuery.findAllPagination(
        { pageSize, pageIndex, igd_name, isDeleted: 1 },
        account
      )

      return dataIngredient
    } catch (error) {
      saveLogSystem({
        action: 'findAllRecycle',
        class: 'IngredientService',
        function: 'findAllRecycle',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  getAllIngredientName(account: IAccount): Promise<IngredientEntity[]> {
    try {
      return this.ingredientQuery.getAllIngredientName(account)
    } catch (error) {
      saveLogSystem({
        action: 'getAllIngredientName',
        class: 'IngredientService',
        function: 'getAllIngredientName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getTotalStockValue({ startDate, endDate }: GetStatsDto, account: IAccount) {
    const queryBuilder = this.stockInItemRepo
      .createQueryBuilder('si')
      .leftJoin(
        'si.stockIn',
        'stockIn',
        'stockIn.deletedAt IS NULL' +
        (startDate && endDate
          ? ' AND stockIn.stki_date BETWEEN TO_DATE(:startDate, \'YYYY-MM-DD\') AND TO_DATE(:endDate, \'YYYY-MM-DD\')'
          : ''),
        { startDate, endDate }
      )
      .select('SUM(si.stki_item_quantity_real * si.stki_item_price)', 'totalIn')
      .where('si.deletedAt IS NULL');

    if (account.account_restaurant_id) {
      queryBuilder.andWhere('si.stki_item_res_id = :restaurantId', {
        restaurantId: account.account_restaurant_id,
      });
    }


    const stockIns = await queryBuilder.getRawOne();

    const stockOutQueryBuilder = this.stockOutItemRepo
      .createQueryBuilder('so')
      .leftJoin(
        'so.stockOut',
        'stockOut',
        'stockOut.deletedAt IS NULL' +
        (startDate && endDate
          ? ' AND stockOut.stko_date BETWEEN TO_DATE(:startDate, \'YYYY-MM-DD\') AND TO_DATE(:endDate, \'YYYY-MM-DD\')'
          : ''),
        { startDate, endDate }
      )
      .select('SUM(so.stko_item_quantity * so.stko_item_price)', 'totalOut')
      .where('so.deletedAt IS NULL');

    if (account.account_restaurant_id) {
      stockOutQueryBuilder.andWhere('so.stko_item_res_id = :restaurantId', {
        restaurantId: account.account_restaurant_id,
      });
    }


    const stockOuts = await stockOutQueryBuilder.getRawOne();

    const totalStockValue = (parseFloat(stockOuts?.totalOut || '0') - parseFloat(stockIns?.totalIn || '0')) || 0;
    return { totalStockValue: parseFloat(totalStockValue.toFixed(2)) };
  }

  async getTotalInventory(account: IAccount): Promise<
    Array<{ igd_id: string; igd_name: string; total_quantity: number }>
  > {
    try {
      const queryBuilder = this.ingredientRepoDas
        .createQueryBuilder('ingredient')
        .leftJoin('ingredient.stockInItems', 'stockInItem', 'stockInItem.deletedAt IS NULL')
        .leftJoin('ingredient.stockOutItems', 'stockOutItem', 'stockOutItem.deletedAt IS NULL')
        .select('ingredient.igd_id', 'igd_id')
        .addSelect('ingredient.igd_name', 'igd_name')
        .addSelect(
          'COALESCE(SUM(stockInItem.stki_item_quantity_real), 0) - COALESCE(SUM(stockOutItem.stko_item_quantity), 0)',
          'total_quantity',
        )
        .where('ingredient.isDeleted = :isDeleted AND ingredient.igd_status = :igdStatus', {
          isDeleted: 0,
          igdStatus: 'enable',
        })
        .andWhere('ingredient.igd_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
        .groupBy('ingredient.igd_id, ingredient.igd_name');

      const results = await queryBuilder.getRawMany();
      return results.map((item) => ({
        igd_id: item.igd_id,
        igd_name: item.igd_name,
        total_quantity: parseFloat(item.total_quantity || 0),
      }));
    } catch (error) {
      saveLogSystem({
        action: 'getTotalInventory',
        class: 'IngredientsService',
        function: 'getTotalInventory',
        message: error.message,
        time: new Date(),
        error,
        type: 'error',
      });
      throw new ServerErrorDefault(error);
    }
  }

  /**
   * Lấy tổng giá trị tồn kho (số lượng * giá trung bình)
   */
  async getTotalInventoryValue(account: IAccount): Promise<
    Array<{ igd_id: string; igd_name: string; total_quantity: number; total_value: number }>
  > {
    try {
      const queryBuilder = this.ingredientRepoDas
        .createQueryBuilder('ingredient')
        .leftJoin('ingredient.stockInItems', 'stockInItem', 'stockInItem.deletedAt IS NULL')
        .leftJoin('ingredient.stockOutItems', 'stockOutItem', 'stockOutItem.deletedAt IS NULL')
        .select('ingredient.igd_id', 'igd_id')
        .addSelect('ingredient.igd_name', 'igd_name')
        .addSelect(
          'COALESCE(SUM(stockInItem.stki_item_quantity_real), 0) - COALESCE(SUM(stockOutItem.stko_item_quantity), 0)',
          'total_quantity',
        )
        .addSelect('AVG(stockInItem.stki_item_price)', 'avg_price')
        .where('ingredient.isDeleted = :isDeleted AND ingredient.igd_status = :igdStatus', {
          isDeleted: 0,
          igdStatus: 'enable',
        })
        .andWhere('ingredient.igd_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
        .groupBy('ingredient.igd_id, ingredient.igd_name');

      const results = await queryBuilder.getRawMany();
      return results.map((item) => ({
        igd_id: item.igd_id,
        igd_name: item.igd_name,
        total_quantity: parseFloat(item.total_quantity || 0),
        total_value: parseFloat(item.total_quantity || 0),
      }));
    } catch (error) {
      saveLogSystem({
        action: 'getTotalInventoryValue',
        class: 'IngredientsService',
        function: 'getTotalInventoryValue',
        message: error.message,
        time: new Date(),
        error,
        type: 'error',
      });
      throw new ServerErrorDefault(error);
    }
  }

  /**
   * Lấy danh sách nguyên liệu sắp hết (dưới ngưỡng)
   */
  async getLowStockIngredients(
    account: IAccount,
    threshold: number = 10,
  ): Promise<Array<{ igd_id: string; igd_name: string; total_quantity: number; unt_name: string }>> {
    try {
      //limit 5
      const queryBuilder = this.ingredientRepoDas
        .createQueryBuilder('ingredient')
        .leftJoin('ingredient.stockInItems', 'stockInItem', 'stockInItem.deletedAt IS NULL')
        .leftJoin('ingredient.stockOutItems', 'stockOutItem', 'stockOutItem.deletedAt IS NULL')
        .leftJoin('ingredient.unit', 'unit') // Join với bảng units
        .select('ingredient.igd_id', 'igd_id')
        .addSelect('ingredient.igd_name', 'igd_name')
        .addSelect('unit.unt_name', 'unt_name') // Chọn tên đơn vị từ bảng units
        .addSelect(
          'COALESCE(SUM(stockInItem.stki_item_quantity_real), 0) - COALESCE(SUM(stockOutItem.stko_item_quantity), 0)',
          'total_quantity',
        )
        .where('ingredient.isDeleted = :isDeleted AND ingredient.igd_status = :igdStatus', {
          isDeleted: 0,
          igdStatus: 'enable',
        })
        .andWhere('ingredient.igd_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
        .groupBy('ingredient.igd_id, ingredient.igd_name, unit.unt_name') // Thêm unit.unt_name vào GROUP BY
        .having(
          'COALESCE(SUM(stockInItem.stki_item_quantity_real), 0) - COALESCE(SUM(stockOutItem.stko_item_quantity), 0) < :threshold',
          { threshold },
        )
        .limit(5);

      const results = await queryBuilder.getRawMany();
      return results.map((item) => ({
        igd_id: item.igd_id,
        igd_name: item.igd_name,
        total_quantity: parseFloat(item.total_quantity || '0'),
        unt_name: item.unt_name || '', // Xử lý trường hợp null
      }));
    } catch (error) {
      saveLogSystem({
        action: 'getLowStockIngredients',
        class: 'IngredientsService',
        function: 'getLowStockIngredients',
        message: error.message,
        time: new Date(),
        error,
        type: 'error',
      });
      throw new ServerErrorDefault(error);
    }
  }

  /**
 * Thống kê tổng tiền nhập kho theo thời gian
 */
  /**
  * Thống kê tổng tiền nhập kho theo thời gian
  */
  async getStockInByTime(
    account: IAccount,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ date: string; total_amount: number; invoice_count: number }>> {
    try {
      // Điều chỉnh múi giờ UTC+7 và đảm bảo bao gồm toàn bộ ngày cuối
      const startDateLocal = new Date(startDate);
      startDateLocal.setHours(startDateLocal.getHours() + 7);
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(adjustedEndDate.getHours() + 7);
      adjustedEndDate.setUTCHours(23, 59, 59, 999);

      const queryBuilder = this.stockInItemRepo
        .createQueryBuilder('stockInItem')
        .leftJoin('stockInItem.stockIn', 'stockIn')
        .select("TO_CHAR(TRUNC(stockIn.stki_date), 'YYYY-MM-DD')", 'date')
        .addSelect('SUM(stockInItem.stki_item_price * stockInItem.stki_item_quantity_real)', 'total_amount') // Tính tổng tiền
        .addSelect('COUNT(DISTINCT stockIn.stki_id)', 'invoice_count') // Số lượng hóa đơn trong ngày
        .where('TRUNC(stockIn.stki_date) BETWEEN TRUNC(:startDate) AND TRUNC(:endDate)', {
          startDate: startDateLocal,
          endDate: adjustedEndDate,
        })
        .andWhere('stockInItem.stki_item_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
        .andWhere('stockIn.stki_res_id = :account_restaurant_id', { account_restaurant_id: account.account_restaurant_id }) // Sửa thành restaurantId
        .andWhere('stockIn.deletedAt IS NULL')
        .andWhere('stockInItem.deletedAt IS NULL')
        .groupBy("TO_CHAR(TRUNC(stockIn.stki_date), 'YYYY-MM-DD')")
        .orderBy('"date"', 'ASC');

      const sql = queryBuilder.getSql();

      const results = await queryBuilder.getRawMany();

      const data = results.map((item) => ({
        date: item.date,
        total_amount: parseFloat(item.total_amount || '0'),
        invoice_count: parseInt(item.invoice_count || '0'),
      }));
      return data;
    } catch (error) {
      saveLogSystem({
        action: 'getStockInByTime',
        class: 'IngredientsService',
        function: 'getStockInByTime',
        message: error.message,
        time: new Date(),
        error,
        type: 'error',
      });
      throw new ServerErrorDefault(error);
    }
  }



  /**
   * Thống kê tổng tiền xuất kho theo thời gian
   */
  /**
   * Thống kê tổng tiền xuất kho theo thời gian
   */
  async getStockOutByTime(
    account: IAccount,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ date: string; total_amount: number; invoice_count: number }>> {
    try {

      const startDateLocal = new Date(startDate);
      startDateLocal.setHours(startDateLocal.getHours() + 7);
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(adjustedEndDate.getHours() + 7);
      adjustedEndDate.setUTCHours(23, 59, 59, 999);

      const queryBuilder = this.stockOutItemRepo
        .createQueryBuilder('stockOutItem')
        .leftJoin('stockOutItem.stockOut', 'stockOut')
        .select("TO_CHAR(TRUNC(stockOut.stko_date), 'YYYY-MM-DD')", 'date')
        .addSelect('SUM(stockOutItem.stko_item_price * stockOutItem.stko_item_quantity)', 'total_amount') // Tính tổng tiền (giả định cột stko_item_price tồn tại)
        .addSelect('COUNT(DISTINCT stockOut.stko_id)', 'invoice_count') // Số lượng hóa đơn trong ngày
        .where('TRUNC(stockOut.stko_date) BETWEEN TRUNC(:startDate) AND TRUNC(:endDate)', {
          startDate: startDateLocal,
          endDate: adjustedEndDate,
        })
        .andWhere('stockOutItem.stko_item_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
        .andWhere('stockOut.stko_res_id = :account_restaurant_id', { account_restaurant_id: account.account_restaurant_id }) // Sửa thành restaurantId
        .andWhere('stockOut.deletedAt IS NULL')
        .andWhere('stockOutItem.deletedAt IS NULL')
        .groupBy("TO_CHAR(TRUNC(stockOut.stko_date), 'YYYY-MM-DD')")
        .orderBy('"date"', 'ASC');

      const sql = queryBuilder.getSql();

      const results = await queryBuilder.getRawMany();

      const data = results.map((item) => ({
        date: item.date,
        total_amount: parseFloat(item.total_amount || '0'),
        invoice_count: parseInt(item.invoice_count || '0'),
      }));
      return data;
    } catch (error) {
      saveLogSystem({
        action: 'getStockOutByTime',
        class: 'IngredientsService',
        function: 'getStockOutByTime',
        message: error.message,
        time: new Date(),
        error,
        type: 'error',
      });
      throw new ServerErrorDefault(error);
    }
  }

  /**
   * Thống kê nhập/xuất kho theo nguyên liệu
   */
  async getStockMovementByIngredient(
    account: IAccount,
  ): Promise<Array<{ igd_id: string; igd_name: string; total_in: number; total_out: number }>> {
    try {
      const queryBuilder = this.ingredientRepoDas
        .createQueryBuilder('ingredient')
        .leftJoin('ingredient.stockInItems', 'stockInItem', 'stockInItem.deletedAt IS NULL')
        .leftJoin('ingredient.stockOutItems', 'stockOutItem', 'stockOutItem.deletedAt IS NULL')
        .select('ingredient.igd_id', 'igd_id')
        .addSelect('ingredient.igd_name', 'igd_name')
        .addSelect('COALESCE(SUM(stockInItem.stki_item_quantity_real), 0)', 'total_in')
        .addSelect('COALESCE(SUM(stockOutItem.stko_item_quantity), 0)', 'total_out')
        .where('ingredient.isDeleted = :isDeleted AND ingredient.igd_status = :igdStatus', {
          isDeleted: 0,
          igdStatus: 'enable',
        })
        .andWhere('ingredient.igd_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
        .groupBy('ingredient.igd_id, ingredient.igd_name');

      const results = await queryBuilder.getRawMany();
      return results.map((item) => ({
        igd_id: item.igd_id,
        igd_name: item.igd_name,
        total_in: parseFloat(item.total_in || 0),
        total_out: parseFloat(item.total_out || 0),
      }));
    } catch (error) {
      saveLogSystem({
        action: 'getStockMovementByIngredient',
        class: 'IngredientsService',
        function: 'getStockMovementByIngredient',
        message: error.message,
        time: new Date(),
        error,
        type: 'error',
      });
      throw new ServerErrorDefault(error);
    }
  }

  /**
   * Thống kê tổng chi phí nhập kho theo thời gian
   */
  async getTotalStockInCost(
    account: IAccount,
    startDate: Date,
    endDate: Date,
  ): Promise<{ total_cost: number }> {
    try {
      const queryBuilder = this.stockInItemRepo
        .createQueryBuilder('stockInItem')
        .leftJoin('stockInItem.stockIn', 'stockIn')
        .select('SUM(stockInItem.stki_item_quantity_real * stockInItem.stki_item_price)', 'total_cost')
        .where('stockIn.stki_date BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere('stockInItem.stki_item_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
        .andWhere('stockInItem.deletedAt IS NULL AND stockIn.isDeleted = :isDeleted', { isDeleted: 0 });

      const result = await queryBuilder.getRawOne();
      return { total_cost: parseFloat(result.total_cost || 0) };
    } catch (error) {
      saveLogSystem({
        action: 'getTotalStockInCost',
        class: 'IngredientsService',
        function: 'getTotalStockInCost',
        message: error.message,
        time: new Date(),
        error,
        type: 'error',
      });
      throw new ServerErrorDefault(error);
    }
  }

  /**
   * Thống kê tổng giá trị xuất kho theo thời gian
   */
  async getTotalStockOutValue(
    account: IAccount,
    startDate: Date,
    endDate: Date,
  ): Promise<{ total_value: number }> {
    try {
      const queryBuilder = this.stockOutItemRepo
        .createQueryBuilder('stockOutItem')
        .leftJoin('stockOutItem.stockOut', 'stockOut')
        .select('SUM(stockOutItem.stko_item_quantity * stockOutItem.stko_item_price)', 'total_value')
        .where('stockOut.stko_date BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere('stockOutItem.stko_item_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
        .andWhere('stockOutItem.deletedAt IS NULL AND stockOut.isDeleted = :isDeleted', { isDeleted: 0 });

      const result = await queryBuilder.getRawOne();
      return { total_value: parseFloat(result.total_value || 0) };
    } catch (error) {
      saveLogSystem({
        action: 'getTotalStockOutValue',
        class: 'IngredientsService',
        function: 'getTotalStockOutValue',
        message: error.message,
        time: new Date(),
        error,
        type: 'error',
      });
      throw new ServerErrorDefault(error);
    }
  }

  /**
   * Thống kê số lượng nhập kho theo nhà cung cấp
   */
  async getStockInBySupplier(
    account: IAccount,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ spli_id: string; spli_name: string; total_quantity: number }>> {
    try {
      const queryBuilder = this.stockInItemRepo
        .createQueryBuilder('stockInItem')
        .leftJoin('stockInItem.stockIn', 'stockIn')
        .leftJoin('stockIn.supplier', 'supplier')
        .select('supplier.spli_id', 'spli_id')
        .addSelect('supplier.spli_name', 'spli_name')
        .addSelect('SUM(stockInItem.stki_item_quantity_real)', 'total_quantity')
        .where('stockIn.stki_date BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere('stockInItem.stki_item_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
        .andWhere('stockInItem.deletedAt IS NULL AND stockIn.isDeleted = :isDeleted', { isDeleted: 0 })
        .groupBy('supplier.spli_id, supplier.spli_name');

      const results = await queryBuilder.getRawMany();
      return results.map((item) => ({
        spli_id: item.spli_id,
        spli_name: item.spli_name,
        total_quantity: parseFloat(item.total_quantity || 0),
      }));
    } catch (error) {
      saveLogSystem({
        action: 'getStockInBySupplier',
        class: 'IngredientsService',
        function: 'getStockInBySupplier',
        message: error.message,
        time: new Date(),
        error,
        type: 'error',
      });
      throw new ServerErrorDefault(error);
    }
  }

  /**
   * Thống kê chi phí nhập kho theo nhà cung cấp
   */
  async getStockInCostBySupplier(
    account: IAccount,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ spli_id: string; spli_name: string; total_cost: number }>> {
    try {
      const queryBuilder = this.stockInItemRepo
        .createQueryBuilder('stockInItem')
        .leftJoin('stockInItem.stockIn', 'stockIn')
        .leftJoin('stockIn.supplier', 'supplier')
        .select('supplier.spli_id', 'spli_id')
        .addSelect('supplier.spli_name', 'spli_name')
        .addSelect('SUM(stockInItem.stki_item_quantity_real * stockInItem.stki_item_price)', 'total_cost')
        .where('stockIn.stki_date BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere('stockInItem.stki_item_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
        .andWhere('stockInItem.deletedAt IS NULL AND stockIn.isDeleted = :isDeleted', { isDeleted: 0 })
        .groupBy('supplier.spli_id, supplier.spli_name');

      const results = await queryBuilder.getRawMany();
      return results.map((item) => ({
        spli_id: item.spli_id,
        spli_name: item.spli_name,
        total_cost: parseFloat(item.total_cost || 0),
      }));
    } catch (error) {
      saveLogSystem({
        action: 'getStockInCostBySupplier',
        class: 'IngredientsService',
        function: 'getStockInCostBySupplier',
        message: error.message,
        time: new Date(),
        error,
        type: 'error',
      });
      throw new ServerErrorDefault(error);
    }
  }

  /**
   * Thống kê tồn kho theo danh mục nguyên liệu
   */
  async getInventoryByCategory(
    account: IAccount,
  ): Promise<Array<{ cat_igd_id: string; cat_igd_name: string; total_quantity: number }>> {
    try {
      const queryBuilder = this.ingredientRepoDas
        .createQueryBuilder('ingredient')
        .leftJoin('ingredient.category', 'category')
        .leftJoin('ingredient.stockInItems', 'stockInItem', 'stockInItem.deletedAt IS NULL')
        .leftJoin('ingredient.stockOutItems', 'stockOutItem', 'stockOutItem.deletedAt IS NULL')
        .select('category.cat_igd_id', 'cat_igd_id')
        .addSelect('category.cat_igd_name', 'cat_igd_name')
        .addSelect(
          'COALESCE(SUM(stockInItem.stki_item_quantity_real), 0) - COALESCE(SUM(stockOutItem.stko_item_quantity), 0)',
          'total_quantity',
        )
        .where('ingredient.isDeleted = :isDeleted AND ingredient.igd_status = :igdStatus', {
          isDeleted: 0,
          igdStatus: 'enable',
        })
        .andWhere('ingredient.igd_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
        .groupBy('category.cat_igd_id, category.cat_igd_name');

      const results = await queryBuilder.getRawMany();
      return results.map((item) => ({
        cat_igd_id: item.cat_igd_id,
        cat_igd_name: item.cat_igd_name,
        total_quantity: parseFloat(item.total_quantity || 0),
      }));
    } catch (error) {
      saveLogSystem({
        action: 'getInventoryByCategory',
        class: 'IngredientsService',
        function: 'getInventoryByCategory',
        message: error.message,
        time: new Date(),
        error,
        type: 'error',
      });
      throw new ServerErrorDefault(error);
    }
  }

  /**
   * Thống kê chi phí nhập kho theo danh mục nguyên liệu
   */
  async getStockInCostByCategory(
    account: IAccount,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ cat_igd_id: string; cat_igd_name: string; total_cost: number }>> {
    try {
      const queryBuilder = this.stockInItemRepo
        .createQueryBuilder('stockInItem')
        .leftJoin('stockInItem.ingredient', 'ingredient')
        .leftJoin('ingredient.category', 'category')
        .select('category.cat_igd_id', 'cat_igd_id')
        .addSelect('category.cat_igd_name', 'cat_igd_name')
        .addSelect('SUM(stockInItem.stki_item_quantity_real * stockInItem.stki_item_price)', 'total_cost')
        .where('stockInItem.deletedAt IS NULL')
        .andWhere('ingredient.isDeleted = :isDeleted AND ingredient.igd_status = :igdStatus', {
          isDeleted: 0,
          igdStatus: 'enable',
        })
        .andWhere('stockInItem.stki_item_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
        .groupBy('category.cat_igd_id, category.cat_igd_name');

      const results = await queryBuilder.getRawMany();
      return results.map((item) => ({
        cat_igd_id: item.cat_igd_id,
        cat_igd_name: item.cat_igd_name,
        total_cost: parseFloat(item.total_cost || 0),
      }));
    } catch (error) {
      saveLogSystem({
        action: 'getStockInCostByCategory',
        class: 'IngredientsService',
        function: 'getStockInCostByCategory',
        message: error.message,
        time: new Date(),
        error,
        type: 'error',
      });
      throw new ServerErrorDefault(error);
    }
  }

  /**
   * Lấy danh sách nguyên liệu không hoạt động (không có xuất kho trong khoảng thời gian)
   */
  async getStagnantIngredients(
    account: IAccount,
    daysThreshold: number = 30,
  ): Promise<Array<{ igd_id: string; igd_name: string }>> {
    try {
      const thresholdDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);
      const queryBuilder = this.ingredientRepoDas
        .createQueryBuilder('ingredient')
        .leftJoin('ingredient.stockOutItems', 'stockOutItem', 'stockOutItem.deletedAt IS NULL')
        .leftJoin('stockOutItem.stockOut', 'stockOut')
        .select('ingredient.igd_id', 'igd_id')
        .addSelect('ingredient.igd_name', 'igd_name')
        .where('ingredient.isDeleted = :isDeleted AND ingredient.igd_status = :igdStatus', {
          isDeleted: 0,
          igdStatus: 'enable',
        })
        .andWhere('ingredient.igd_res_id = :restaurantId', { restaurantId: account.account_restaurant_id })
        .andWhere('stockOut.stko_date < :thresholdDate OR stockOut.stko_date IS NULL', { thresholdDate })
        .groupBy('ingredient.igd_id, ingredient.igd_name');

      const results = await queryBuilder.getRawMany();
      return results.map((item) => ({
        igd_id: item.igd_id,
        igd_name: item.igd_name,
      }));
    } catch (error) {
      saveLogSystem({
        action: 'getStagnantIngredients',
        class: 'IngredientsService',
        function: 'getStagnantIngredients',
        message: error.message,
        time: new Date(),
        error,
        type: 'error',
      });
      throw new ServerErrorDefault(error);
    }
  }

}
