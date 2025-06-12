import { Injectable } from '@nestjs/common'
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

  async getStockInTrends({ startDate, endDate }: GetStatsDto, account: IAccount) {

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
      .select('TO_CHAR(stockIn.stki_date, \'YYYY-MM-DD\')', 'date')
      .addSelect('SUM(si.stki_item_quantity_real)', 'quantity')
      .addSelect('SUM(si.stki_item_quantity_real * si.stki_item_price)', 'value')
      .where('si.deletedAt IS NULL');

    if (account.account_restaurant_id) {
      queryBuilder.andWhere('si.stki_item_res_id = :restaurantId', {
        restaurantId: account.account_restaurant_id,
      });
    }

    queryBuilder
      .groupBy('TO_CHAR(stockIn.stki_date, \'YYYY-MM-DD\')')
      .orderBy('TO_CHAR(stockIn.stki_date, \'YYYY-MM-DD\')', 'ASC');


    const trends = await queryBuilder.getRawMany();

    return trends.length > 0
      ? trends.map((t) => ({
        date: t.date,
        quantity: parseFloat(t.quantity) || 0,
        value: parseFloat(parseFloat(t.value || '0').toFixed(2)),
      }))
      : [];
  }

  async getStockOutTrends({ startDate, endDate }: GetStatsDto, account: IAccount) {

    const queryBuilder = this.stockOutItemRepo
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
      .select('TO_CHAR(stockOut.stko_date, \'YYYY-MM-DD\')', 'date')
      .addSelect('SUM(so.stko_item_quantity)', 'quantity')
      .addSelect('SUM(so.stko_item_quantity * so.stko_item_price)', 'value')
      .where('so.deletedAt IS NULL');

    if (account.account_restaurant_id) {
      queryBuilder.andWhere('so.stko_item_res_id = :restaurantId', {
        restaurantId: account.account_restaurant_id,
      });
    }

    queryBuilder
      .groupBy('TO_CHAR(stockOut.stko_date, \'YYYY-MM-DD\')')
      .orderBy('TO_CHAR(stockOut.stko_date, \'YYYY-MM-DD\')', 'ASC');


    const trends = await queryBuilder.getRawMany();

    return trends.length > 0
      ? trends.map((t) => ({
        date: t.date,
        quantity: parseFloat(t.quantity) || 0,
        value: parseFloat(parseFloat(t.value || '0').toFixed(2)),
      }))
      : [];
  }

  async getLowStockIngredients({ startDate, endDate, threshold = 10 }: GetLowStockDto, account: IAccount) {
    threshold = +threshold || 10;


    const queryBuilder = this.ingredientRepoDas
      .createQueryBuilder('i')
      .leftJoin('i.stockInItems', 'si')
      .leftJoin(
        'si.stockIn',
        'stockIn',
        startDate && endDate
          ? 'stockIn.stki_date BETWEEN TO_DATE(:startDateIn, \'YYYY-MM-DD\') AND TO_DATE(:endDateIn, \'YYYY-MM-DD\')'
          : ''
        , { startDateIn: startDate, endDateIn: endDate }
      )
      .leftJoin('i.stockOutItems', 'so')
      .leftJoin(
        'so.stockOut',
        'stockOut',
        startDate && endDate
          ? 'stockOut.stko_date BETWEEN TO_DATE(:startDateOut, \'YYYY-MM-DD\') AND TO_DATE(:endDateOut, \'YYYY-MM-DD\')'
          : ''
        , { startDateOut: startDate, endDateOut: endDate }
      )
      .leftJoin('i.unit', 'unit')
      .select([
        'i.igd_id AS igd_id',
        'i.igd_name AS igd_name',
        'COALESCE(SUM(si.stki_item_quantity_real), 0) - COALESCE(SUM(so.stko_item_quantity), 0) AS stock',
        'COALESCE(unit.unt_symbol, \'unit\') AS unit',
      ])
      .groupBy('i.igd_id, i.igd_name, unit.unt_symbol')
      .having('COALESCE(SUM(si.stki_item_quantity_real), 0) - COALESCE(SUM(so.stko_item_quantity), 0) <= :threshold', {
        threshold,
      });

    if (account.account_restaurant_id) {
      queryBuilder.where('i.igd_res_id = :restaurantId', {
        restaurantId: account.account_restaurant_id,
      });
    }

    const stockQuery = await queryBuilder.getRawMany();

    return stockQuery.length > 0
      ? stockQuery.map((item) => ({
        igd_name: item.IGD_NAME,
        stock: parseFloat(item.STOCK) || 0,
        unit: item.UNIT || 'unit',
      }))
      : [];
  }
  async getTopIngredients({ startDate, endDate }: GetStatsDto, account: IAccount) {
    const queryBuilder = this.stockOutItemRepo
      .createQueryBuilder('so')
      .leftJoin('so.ingredient', 'i', 'i.deletedAt IS NULL')
      .leftJoin(
        'so.stockOut',
        'stockOut',
        'stockOut.deletedAt IS NULL' +
        (startDate && endDate
          ? ' AND stockOut.stko_date BETWEEN TO_DATE(:startDate, \'YYYY-MM-DD\') AND TO_DATE(:endDate, \'YYYY-MM-DD\')'
          : ''),
        { startDate, endDate }
      )
      .select([
        'i.igd_name AS igd_name',
        'SUM(so.stko_item_quantity) AS quantity',
        'SUM(so.stko_item_quantity * so.stko_item_price) AS value',
      ])
      .where('so.deletedAt IS NULL')
      .groupBy('i.igd_id, i.igd_name')
      .orderBy('SUM(so.stko_item_quantity)', 'DESC')
      .limit(10);

    if (account.account_restaurant_id) {
      queryBuilder.andWhere('so.stko_item_res_id = :restaurantId', {
        restaurantId: account.account_restaurant_id,
      });
    }


    const topIngredients = await queryBuilder.getRawMany();

    return topIngredients.length > 0
      ? topIngredients.map((item) => ({
        igd_name: item.igd_name,
        quantity: parseFloat(item.quantity) || 0,
        value: parseFloat(parseFloat(item.value || '0').toFixed(2)),
      }))
      : [];
  }

  async getRecentStockTransactions({ startDate, endDate }: GetStatsDto, account: IAccount) {
    const stockInQuery = this.stockInItemRepo
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
      .leftJoin('si.ingredient', 'i', 'i.deletedAt IS NULL')
      .select('si.stki_item_id', 'id')
      .addSelect('stockIn.stki_code', 'code')
      .addSelect('i.igd_name', 'ingredient')
      .addSelect('si.stki_item_quantity_real', 'quantity')
      .addSelect('TO_CHAR(stockIn.stki_date, \'YYYY-MM-DD\')', 'date')
      .where('si.deletedAt IS NULL');

    if (account.account_restaurant_id) {
      stockInQuery.andWhere('si.stki_item_res_id = :restaurantId', {
        restaurantId: account.account_restaurant_id,
      });
    }

    stockInQuery.orderBy('stockIn.stki_date', 'DESC').limit(5);


    const stockInTransactions = await stockInQuery.getRawMany();

    const stockOutQuery = this.stockOutItemRepo
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
      .leftJoin('so.ingredient', 'i', 'i.deletedAt IS NULL')
      .select('so.stko_item_id', 'id')
      .addSelect('stockOut.stko_code', 'code')
      .addSelect('i.igd_name', 'ingredient')
      .addSelect('so.stko_item_quantity', 'quantity')
      .addSelect('TO_CHAR(stockOut.stko_date, \'YYYY-MM-DD\')', 'date')
      .where('so.deletedAt IS NULL');

    if (account.account_restaurant_id) {
      stockOutQuery.andWhere('so.stko_item_res_id = :restaurantId', {
        restaurantId: account.account_restaurant_id,
      });
    }

    stockOutQuery.orderBy('stockOut.stko_date', 'DESC').limit(5);


    const stockOutTransactions = await stockOutQuery.getRawMany();

    const transactions = [
      ...stockInTransactions.map((t) => ({
        id: t.id,
        code: t.code,
        ingredient: t.ingredient,
        quantity: parseFloat(t.quantity) || 0,
        date: t.date,
        type: 'in' as const,
      })),
      ...stockOutTransactions.map((t) => ({
        id: t.id,
        code: t.code,
        ingredient: t.ingredient,
        quantity: parseFloat(t.quantity) || 0,
        date: t.date,
        type: 'out' as const,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return transactions;
  }

  async getStockByCategory({ startDate, endDate }: GetStatsDto, account: IAccount) {
    const queryBuilder = this.ingredientRepoDas
      .createQueryBuilder('i')
      .leftJoin('i.stockInItems', 'si', 'si.deletedAt IS NULL')
      .leftJoin(
        'si.stockIn',
        'stockIn',
        'stockIn.deletedAt IS NULL' +
        (startDate && endDate
          ? ' AND stockIn.stki_date BETWEEN TO_DATE(:startDateIn, \'YYYY-MM-DD\') AND TO_DATE(:endDateIn, \'YYYY-MM-DD\')'
          : ''),
        { startDateIn: startDate, endDateIn: endDate }
      )
      .leftJoin('i.stockOutItems', 'so', 'so.deletedAt IS NULL')
      .leftJoin(
        'so.stockOut',
        'stockOut',
        'stockOut.deletedAt IS NULL' +
        (startDate && endDate
          ? ' AND stockOut.stko_date BETWEEN TO_DATE(:startDateOut, \'YYYY-MM-DD\') AND TO_DATE(:endDateOut, \'YYYY-MM-DD\')'
          : ''),
        { startDateOut: startDate, endDateOut: endDate }
      )
      .leftJoin('i.category', 'cat', 'cat.deletedAt IS NULL')
      .select([
        'COALESCE(cat.cat_igd_name, \'Không xác định\') AS category',
        'COALESCE(SUM(si.stki_item_quantity_real), 0) - COALESCE(SUM(so.stko_item_quantity), 0) AS stock',
        'COALESCE(SUM(si.stki_item_quantity_real * si.stki_item_price), 0) - COALESCE(SUM(so.stko_item_quantity * so.stko_item_price), 0) AS value',
      ])
      .where('i.deletedAt IS NULL')
      .groupBy('cat.cat_igd_id, cat.cat_igd_name');

    if (account.account_restaurant_id) {
      queryBuilder.andWhere('i.igd_res_id = :restaurantId', {
        restaurantId: account.account_restaurant_id,
      });
    }


    const stockByCategory = await queryBuilder.getRawMany();

    return stockByCategory.length > 0
      ? stockByCategory.map((item) => ({
        category: item.CATEGORY,
        stock: parseFloat(item.STOCK) || 0,
        value: parseFloat(parseFloat(item.VALUE || '0').toFixed(2)),
      }))
      : [];
  }

}
