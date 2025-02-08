import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CatIngredientService } from './cat-ingredient.service'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { CreateCatIngredientDto } from './dto/create-cat-ingredient.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { CatIngredientEntity } from './entities/cat-ingredient.entity'
import { UpdateCatIngredientDto } from './dto/update-cat-ingredient.dto'
import { UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { UpdateStatusCatIngredientDto } from './dto/update-status-cat-ingredient.dto'

@Controller('cat-ingredient')
export class CatIngredientController {
  constructor(private readonly catIngredientService: CatIngredientService) {}

  @Post()
  @ResponseMessage('Thêm danh mục nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async createCatIngredient(
    @Body() createCatIngredientDto: CreateCatIngredientDto,
    @Acccount() account: IAccount
  ): Promise<CatIngredientEntity> {
    return this.catIngredientService.createCatIngredient(createCatIngredientDto, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật danh mục nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async updateCatIngredient(
    @Body() updateCatIngredientDto: UpdateCatIngredientDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.catIngredientService.updateCatIngredient(updateCatIngredientDto, account)
  }

  @Get()
  @ResponseMessage('Lấy danh sách danh mục nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async findAll(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('cat_igd_name') cat_igd_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<CatIngredientEntity>> {
    return await this.catIngredientService.findAll(
      {
        cat_igd_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Get('cat-name')
  @ResponseMessage('Lấy danh sách tên danh mục nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async findAllCatName(@Acccount() account: IAccount): Promise<CatIngredientEntity[]> {
    return await this.catIngredientService.findAllCatName(account)
  }

  @Get('/recycle')
  @ResponseMessage('Lấy danh sách danh mục nguyên liệu đã xóa thành công')
  @UseGuards(AccountAuthGuard)
  async findAllRecycle(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('cat_igd_name') cat_igd_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<CatIngredientEntity>> {
    return await this.catIngredientService.findAllRecycle(
      {
        cat_igd_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Patch('update-status')
  @ResponseMessage('Cập nhật trạng thái danh mục nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async updateStatusCatIngredient(
    @Body() updateStatusCatIngredientDto: UpdateStatusCatIngredientDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.catIngredientService.updateStatusCatIngredient(updateStatusCatIngredientDto, account)
  }

  @Patch('restore/:cat_igd_id')
  @ResponseMessage('Khôi phục danh mục nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async restoreCatIngredient(
    @Param('cat_igd_id') cat_igd_id: string,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.catIngredientService.restoreCatIngredient(cat_igd_id, account)
  }

  @Delete(':cat_igd_id')
  @ResponseMessage('Xóa danh mục nguyên liệu thành công')
  @UseGuards(AccountAuthGuard)
  async deleteCatIngredient(
    @Param('cat_igd_id') cat_igd_id: string,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.catIngredientService.deleteCatIngredient(cat_igd_id, account)
  }

  @Get(':cat_igd_id')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy thông tin danh mục nguyên liệu thành công')
  async findOneById(
    @Param('cat_igd_id') cat_igd_id: string,
    @Acccount() account: IAccount
  ): Promise<CatIngredientEntity> {
    return this.catIngredientService.findOneById(cat_igd_id, account)
  }
}
