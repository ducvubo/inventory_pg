import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { StockInService } from './stock-in.service'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { CreateStockInDto } from './dto/create-stock-in.dto'
import { StockInEntity } from './entities/stock-in.entity'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateStockInDto } from './dto/update-stock-in.dto'
import { UpdateResult } from 'typeorm'

@Controller('stock-in')
export class StockInController {
  constructor(private readonly stockInService: StockInService) {}

  @Post()
  @ResponseMessage('Thêm phiếu nhập thành công')
  @UseGuards(AccountAuthGuard)
  async createStockIn(
    @Body() createStockInDto: CreateStockInDto,
    @Acccount() account: IAccount
  ): Promise<StockInEntity> {
    return await this.stockInService.createStockIn(createStockInDto, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật phiếu nhập thành công')
  @UseGuards(AccountAuthGuard)
  async updateStockIn(
    @Body() updateStockInDto: UpdateStockInDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return await this.stockInService.updateStockIn(updateStockInDto, account)
  }

  @Get()
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy danh sách phiếu nhập thành công')
  async findAll(
    @Acccount() account: IAccount,
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('stki_code') stki_code: string
  ): Promise<any> {
    return await this.stockInService.findAll({ pageIndex: +pageIndex, pageSize: +pageSize, stki_code }, account)
  }

  @Get('recycle')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy danh sách phiếu nhập đã xóa thành công')
  async findAllRecycle(
    @Acccount() account: IAccount,
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('stki_code') stki_code: string
  ): Promise<any> {
    return await this.stockInService.findAllRecycle({ pageIndex: +pageIndex, pageSize: +pageSize, stki_code }, account)
  }

  @Patch('restore/:stki_id')
  @ResponseMessage('Khôi phục phiếu nhập thành công')
  @UseGuards(AccountAuthGuard)
  async restoreStockIn(@Acccount() account: IAccount, @Param('stki_id') stki_id: string): Promise<UpdateResult> {
    return await this.stockInService.restoreStockIn(stki_id, account)
  }

  @Delete(':stki_id')
  @ResponseMessage('Xóa phiếu nhập thành công')
  @UseGuards(AccountAuthGuard)
  async deleteStockIn(@Acccount() account: IAccount, @Param('stki_id') stki_id: string): Promise<UpdateResult> {
    return await this.stockInService.deleteStockIn(stki_id, account)
  }

  @Get(':stki_id')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy thông tin phiếu nhập thành công')
  async findOneById(@Acccount() account: IAccount, @Param('stki_id') stki_id: string): Promise<StockInEntity> {
    return await this.stockInService.findOneById(stki_id, account)
  }
}
