import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { IngredientsService } from './ingredients.service'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { CreateIngredientDto } from './dto/create-ingredient.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { IngredientEntity } from './entities/ingredient.entity'
import { UpdateIngredientDto } from './dto/update-ingredient.dto'
import { UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { UpdateStatusIngredientDto } from './dto/update-status-ingredient.dto'
import { GetLowStockDto, GetStatsDto } from './dto/get-stats.dto'

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) { }

  @Post()
  @ResponseMessage('Thêm nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async createIngredient(
    @Body() createIngredientDto: CreateIngredientDto,
    @Acccount() account: IAccount
  ): Promise<IngredientEntity> {
    return this.ingredientsService.createIngredient(createIngredientDto, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async updateIngredient(
    @Body() updateIngredientDto: UpdateIngredientDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.ingredientsService.updateIngredient(updateIngredientDto, account)
  }

  @Get()
  @ResponseMessage('Lấy danh sách nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async findAll(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('igd_name') igd_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<IngredientEntity>> {
    return await this.ingredientsService.findAll(
      {
        igd_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Get('ingredient-name')
  @ResponseMessage('Lấy danh sách tên nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async getAllIngredientName(@Acccount() account: IAccount): Promise<IngredientEntity[]> {
    return this.ingredientsService.getAllIngredientName(account)
  }

  @Get('/recycle')
  @ResponseMessage('Lấy danh sách nguyên liệu đã xóa thành công')
  @UseGuards(AccountAuthGuard)
  async findAllRecycle(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('igd_name') igd_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<IngredientEntity>> {
    return await this.ingredientsService.findAllRecycle(
      {
        igd_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Patch('update-status')
  @ResponseMessage('Cập nhật trạng thái nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async updateStatusIngredient(
    @Body() updateStatusIngredientDto: UpdateStatusIngredientDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.ingredientsService.updateStatusIngredient(updateStatusIngredientDto, account)
  }





  @Get('total-stock-value')
  @ResponseMessage('Lấy tổng giá trị tồn kho thành công')
  @UseGuards(AccountAuthGuard)
  async getTotalStockValue(@Query() query: GetStatsDto, @Acccount() account: IAccount) {
    return this.ingredientsService.getTotalStockValue(query, account);
  }


  @Get('total-inventory')
  @ResponseMessage('Lấy tổng quan tồn kho thành công')
  @UseGuards(AccountAuthGuard)
  async getTotalInventory(@Acccount() account: IAccount) {
    return this.ingredientsService.getTotalInventory(account);
  }

  @Get('total-inventory-value')
  @ResponseMessage('Lấy tổng giá trị tồn kho theo nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async getTotalInventoryValue(@Acccount() account: IAccount) {
    return this.ingredientsService.getTotalInventoryValue(account);
  }

  @Get('low-stock')
  @ResponseMessage('Lấy danh sách nguyên liệu sắp hết thành công')
  @UseGuards(AccountAuthGuard)
  async getLowStockIngredients(
    @Query('threshold') threshold: string,
    @Acccount() account: IAccount,
  ) {
    return this.ingredientsService.getLowStockIngredients(account, threshold ? +threshold : undefined);
  }

  @Get('stock-in-by-time')
  @ResponseMessage('Lấy thống kê nhập kho theo thời gian thành công')
  @UseGuards(AccountAuthGuard)
  async getStockInByTime(@Query() query: GetStatsDto, @Acccount() account: IAccount) {
    if (!query.startDate || !query.endDate) {
      throw new BadRequestException('Vui lòng cung cấp startDate và endDate');
    }
    return this.ingredientsService.getStockInByTime(account, new Date(query.startDate), new Date(query.endDate));
  }

  @Get('stock-out-by-time')
  @ResponseMessage('Lấy thống kê xuất kho theo thời gian thành công')
  @UseGuards(AccountAuthGuard)
  async getStockOutByTime(@Query() query: GetStatsDto, @Acccount() account: IAccount) {
    if (!query.startDate || !query.endDate) {
      throw new BadRequestException('Vui lòng cung cấp startDate và endDate');
    }
    return this.ingredientsService.getStockOutByTime(account, new Date(query.startDate), new Date(query.endDate));
  }

  @Get('stock-movement-by-ingredient')
  @ResponseMessage('Lấy thống kê nhập/xuất kho theo nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async getStockMovementByIngredient(@Acccount() account: IAccount) {
    return this.ingredientsService.getStockMovementByIngredient(account);
  }

  @Get('total-stock-in-cost')
  @ResponseMessage('Lấy tổng chi phí nhập kho thành công')
  @UseGuards(AccountAuthGuard)
  async getTotalStockInCost(@Query() query: GetStatsDto, @Acccount() account: IAccount) {
    if (!query.startDate || !query.endDate) {
      throw new BadRequestException('Vui lòng cung cấp startDate và endDate');
    }
    return this.ingredientsService.getTotalStockInCost(account, new Date(query.startDate), new Date(query.endDate));
  }

  @Get('total-stock-out-value')
  @ResponseMessage('Lấy tổng giá trị xuất kho thành công')
  @UseGuards(AccountAuthGuard)
  async getTotalStockOutValue(@Query() query: GetStatsDto, @Acccount() account: IAccount) {
    if (!query.startDate || !query.endDate) {
      throw new BadRequestException('Vui lòng cung cấp startDate và endDate');
    }
    return this.ingredientsService.getTotalStockOutValue(account, new Date(query.startDate), new Date(query.endDate));
  }

  @Get('stock-in-by-supplier')
  @ResponseMessage('Lấy thống kê nhập kho theo nhà cung cấp thành công')
  @UseGuards(AccountAuthGuard)
  async getStockInBySupplier(@Query() query: GetStatsDto, @Acccount() account: IAccount) {
    if (!query.startDate || !query.endDate) {
      throw new BadRequestException('Vui lòng cung cấp startDate và endDate');
    }
    return this.ingredientsService.getStockInBySupplier(account, new Date(query.startDate), new Date(query.endDate));
  }

  @Get('stock-in-cost-by-supplier')
  @ResponseMessage('Lấy thống kê chi phí nhập kho theo nhà cung cấp thành công')
  @UseGuards(AccountAuthGuard)
  async getStockInCostBySupplier(@Query() query: GetStatsDto, @Acccount() account: IAccount) {
    if (!query.startDate || !query.endDate) {
      throw new BadRequestException('Vui lòng cung cấp startDate và endDate');
    }
    return this.ingredientsService.getStockInCostBySupplier(account, new Date(query.startDate), new Date(query.endDate));
  }

  @Get('inventory-by-category')
  @ResponseMessage('Lấy thống kê tồn kho theo danh mục thành công')
  @UseGuards(AccountAuthGuard)
  async getInventoryByCategory(@Acccount() account: IAccount) {
    return this.ingredientsService.getInventoryByCategory(account);
  }

  @Get('stock-in-cost-by-category')
  @ResponseMessage('Lấy thống kê chi phí nhập kho theo danh mục thành công')
  @UseGuards(AccountAuthGuard)
  async getStockInCostByCategory(@Query() query: GetStatsDto, @Acccount() account: IAccount) {
    if (!query.startDate || !query.endDate) {
      throw new BadRequestException('Vui lòng cung cấp startDate và endDate');
    }
    return this.ingredientsService.getStockInCostByCategory(account, new Date(query.startDate), new Date(query.endDate));
  }

  @Get('stagnant-ingredients')
  @ResponseMessage('Lấy danh sách nguyên liệu không hoạt động thành công')
  @UseGuards(AccountAuthGuard)
  async getStagnantIngredients(
    @Query('daysThreshold') daysThreshold: string,
    @Acccount() account: IAccount,
  ) {
    return this.ingredientsService.getStagnantIngredients(account, daysThreshold ? +daysThreshold : undefined);
  }

  @Patch('restore/:igd_id')
  @ResponseMessage('Khôi phục nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async restoreIngredient(@Param('igd_id') igd_id: string, @Acccount() account: IAccount): Promise<UpdateResult> {
    return this.ingredientsService.restoreIngredient(igd_id, account)
  }

  @Delete(':igd_id')
  @ResponseMessage('Xóa nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async deleteIngredient(@Param('igd_id') igd_id: string, @Acccount() account: IAccount): Promise<UpdateResult> {
    return this.ingredientsService.deleteIngredient(igd_id, account)
  }

  @Get(':igd_id')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy thông tin nguyên liệu thành công')
  async findOneById(@Param('igd_id') igd_id: string, @Acccount() account: IAccount): Promise<IngredientEntity> {
    return this.ingredientsService.findOneById(igd_id, account)
  }


}
