import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
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




  @Get('low-stock')
  @ResponseMessage('Lấy tổng giá trị tồn kho thành công')
  @UseGuards(AccountAuthGuard)
  async getLowStockIngredients(@Query() query: GetLowStockDto, @Acccount() account: IAccount) {
    return this.ingredientsService.getLowStockIngredients(query, account);
  }


  @Get('recent-transactions')
  @ResponseMessage('Lấy tổng giá trị tồn kho thành công')
  @UseGuards(AccountAuthGuard)
  async getRecentStockTransactions(@Query() query: GetStatsDto, @Acccount() account: IAccount) {
    return this.ingredientsService.getRecentStockTransactions(query, account);
  }


  @Get('stock-usage-by-type')
  @ResponseMessage('Lấy tổng giá trị tồn kho thành công')
  @UseGuards(AccountAuthGuard)
  async getStockUsageByType(@Query() query: GetStatsDto, @Acccount() account: IAccount) {
    return this.ingredientsService.getStockUsageByType(query, account);
  }

  @Get('stock-turnover-rate')
  @ResponseMessage('Lấy tổng giá trị tồn kho thành công')
  @UseGuards(AccountAuthGuard)
  async getStockTurnoverRate(@Query() query: GetStatsDto, @Acccount() account: IAccount) {
    return this.ingredientsService.getStockTurnoverRate(query, account);
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
