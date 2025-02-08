import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { SuppliersService } from './suppliers.service'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { CreateSupplierDto } from './dto/create-supplier.dto'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateSupplierDto } from './dto/update-supplier.dto'
import { UpdateStatusSupplierDto } from './dto/update-status-supplier.dto'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { SupplierEntity } from './entities/suppliers.entity'
import { UpdateResult } from 'typeorm'
import { ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger'

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ResponseMessage('Thêm nhà cung cấp thành công')
  @ApiResponse({
    status: 201,
    description: 'Thêm nhà cung cấp thành công.',
    type: SupplierEntity
  })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreateSupplierDto })
  @UseGuards(AccountAuthGuard)
  async createSupplier(
    @Body() createSupplierDto: CreateSupplierDto,
    @Acccount() account: IAccount
  ): Promise<SupplierEntity> {
    return await this.suppliersService.createSupplier(createSupplierDto, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật nhà cung cấp thành công')
  @UseGuards(AccountAuthGuard)
  async updateSupplier(
    @Body() updateSupplierDto: UpdateSupplierDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return await this.suppliersService.updateSupplier(updateSupplierDto, account)
  }

  @Get()
  @ResponseMessage('Lấy danh sách nhà cung cấp thành công')
  @UseGuards(AccountAuthGuard)
  async findAll(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('spli_name') spli_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<SupplierEntity>> {
    return await this.suppliersService.findAll(
      {
        spli_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Get('/supplier-name')
  @ResponseMessage('Lấy danh sách tên nhà cung cấp thành công')
  @UseGuards(AccountAuthGuard)
  async findAllSupplierName(@Acccount() account: IAccount): Promise<SupplierEntity[]> {
    return await this.suppliersService.findAllSupplierName(account)
  }

  @Get('/recycle')
  @ResponseMessage('Lấy danh sách nhà cung cấp đã xóa thành công')
  @UseGuards(AccountAuthGuard)
  async findAllRecycle(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('spli_name') spli_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<SupplierEntity>> {
    return await this.suppliersService.findAllRecycle(
      {
        spli_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Patch('/restore/:spli_id')
  @ResponseMessage('Khôi phục nhà cung cấp thành công')
  @UseGuards(AccountAuthGuard)
  async restoreSupplier(@Param('spli_id') id: string, @Acccount() account: IAccount): Promise<UpdateResult> {
    return await this.suppliersService.restoreSupplier(id, account)
  }

  @Patch('/update-status')
  @ResponseMessage('Cập nhật trạng thái nhà cung cấp thành công')
  @UseGuards(AccountAuthGuard)
  async updateStatusSupplier(
    @Body() updateStatusSupplierDto: UpdateStatusSupplierDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return await this.suppliersService.updateStatusSupplier(updateStatusSupplierDto, account)
  }

  @Delete(':spli_id')
  @ResponseMessage('Xóa nhà cung cấp thành công')
  @UseGuards(AccountAuthGuard)
  async deleteSupplier(@Param('spli_id') id: string, @Acccount() account: IAccount): Promise<UpdateResult> {
    return await this.suppliersService.deleteSupplier(id, account)
  }

  @Get(':spli_id')
  @ResponseMessage('Lấy thông tin nhà cung cấp thành công')
  @UseGuards(AccountAuthGuard)
  async findOneById(@Param('spli_id') id: string, @Acccount() account: IAccount): Promise<SupplierEntity> {
    return await this.suppliersService.findOneById(id, account)
  }
}
