import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { StockInService } from './stock-in.service'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { CreateStockInDto } from './dto/create-stock-in.dto'
import { StockInEntity } from './entities/stock-in.entity'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateStockInDto } from './dto/update-stock-in.dto'
import { UpdateResult } from 'typeorm'
import { FileInterceptor } from '@nestjs/platform-express'
import * as multer from 'multer';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger'

@Controller('stock-in')
export class StockInController {
  constructor(private readonly stockInService: StockInService) { }

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

  @Post('import-pdf')
  @ResponseMessage('Nhập phiếu nhập thành công')
  @ApiOperation({ summary: 'Import phiếu nhập từ file PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(), // lưu file vào bộ nhớ RAM
      limits: { fileSize: 10 * 1024 * 1024 }, // giới hạn dung lượng 10MB (tuỳ chỉnh nếu cần)
    }),
  )
  async importPdf(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    return await this.stockInService.importPdfFromBuffer(file.buffer);
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
