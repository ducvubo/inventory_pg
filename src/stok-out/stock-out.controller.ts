import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { StockOutService } from './stock-out.service'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { CreateStockOutDto } from './dto/create-stock-out.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { StockOutEntity } from './entities/stock-out.entity'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { UpdateStockOutDto } from './dto/update-stock-in.dto'
import { UpdateResult } from 'typeorm'

@Controller('stock-out')
export class StockOutController {
  constructor(private readonly stokOutService: StockOutService) {}

  @Post()
  @ResponseMessage('Thêm phiếu xuất thành công')
  @UseGuards(AccountAuthGuard)
  async createStockOut(
    @Body() createStockOutDto: CreateStockOutDto,
    @Acccount() account: IAccount
  ): Promise<StockOutEntity> {
    return await this.stokOutService.createStockOut(createStockOutDto, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật phiếu xuất thành công')
  @UseGuards(AccountAuthGuard)
  async updateStockOut(
    @Body() updateStockOutDto: UpdateStockOutDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return await this.stokOutService.updateStockOut(updateStockOutDto, account)
  }

  @Get()
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy danh sách phiếu xuất thành công')
  async findAll(
    @Acccount() account: IAccount,
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('stko_code') stko_code: string
  ): Promise<any> {
    return await this.stokOutService.findAll({ pageIndex: +pageIndex, pageSize: +pageSize, stko_code }, account)
  }

  @Get('recycle')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy danh sách phiếu xuất đã xóa thành công')
  async findAllRecycle(
    @Acccount() account: IAccount,
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('stko_code') stko_code: string
  ): Promise<any> {
    return await this.stokOutService.findAllRecycle({ pageIndex: +pageIndex, pageSize: +pageSize, stko_code }, account)
  }

  @Patch('restore/:stko_id')
  @ResponseMessage('Khôi phục phiếu xuất thành công')
  @UseGuards(AccountAuthGuard)
  async restoreStockOut(@Acccount() account: IAccount, @Param('stko_id') stko_id: string): Promise<UpdateResult> {
    return await this.stokOutService.restoreStockOut(stko_id, account)
  }

  @Delete(':stko_id')
  @ResponseMessage('Xóa phiếu xuất thành công')
  @UseGuards(AccountAuthGuard)
  async deleteStockOut(@Acccount() account: IAccount, @Param('stko_id') stko_id: string): Promise<UpdateResult> {
    return await this.stokOutService.deleteStockOut(stko_id, account)
  }

  @Get(':stko_id')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy thông tin phiếu xuất thành công')
  async findOneById(@Acccount() account: IAccount, @Param('stko_id') stko_id: string): Promise<StockOutEntity> {
    return await this.stokOutService.findOneById(stko_id, account)
  }
}
