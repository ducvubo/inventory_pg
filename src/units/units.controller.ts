import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { UnitsService } from './units.service'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { IAccount } from 'src/guard/interface/account.interface'
import { UnitEntity } from './entities/units.entity'
import { UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { UpdateUnitDto } from './dto/update-unit.dto'
import { CreateUnitDto } from './dto/create-unit.dto'
import { UpdateStatusUnitDto } from './dto/update-status-unit.dto'

@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @ResponseMessage('Thêm đơn vị đo thành công')
  @UseGuards(AccountAuthGuard)
  async createUnit(@Body() createUnitDto: CreateUnitDto, @Acccount() account: IAccount): Promise<UnitEntity> {
    return this.unitsService.createUnit(createUnitDto, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật đơn vị đo thành công')
  @UseGuards(AccountAuthGuard)
  async updateUnit(@Body() updateUnitDto: UpdateUnitDto, @Acccount() account: IAccount): Promise<UpdateResult> {
    return this.unitsService.updateUnit(updateUnitDto, account)
  }

  @Get()
  @ResponseMessage('Lấy danh sách đơn vị đo thành công')
  @UseGuards(AccountAuthGuard)
  async findAll(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('unt_name') unt_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<UnitEntity>> {
    return await this.unitsService.findAll(
      {
        unt_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Get('unit-name')
  @ResponseMessage('Lấy danh sách tên đơn vị đo thành công')
  @UseGuards(AccountAuthGuard)
  async findAllUnitName(@Acccount() account: IAccount): Promise<UnitEntity[]> {
    return await this.unitsService.findAllUnitName(account)
  }

  @Get('/recycle')
  @ResponseMessage('Lấy danh sách đơn vị đo đã xóa thành công')
  @UseGuards(AccountAuthGuard)
  async findAllRecycle(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('unt_name') unt_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<UnitEntity>> {
    return await this.unitsService.findAllRecycle(
      {
        unt_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Patch('update-status')
  @ResponseMessage('Cập nhật trạng thái đơn vị đo thành công')
  @UseGuards(AccountAuthGuard)
  async updateStatusUnit(
    @Body() updateStatusUnitDto: UpdateStatusUnitDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.unitsService.updateStatusUnit(updateStatusUnitDto, account)
  }

  @Patch('restore/:unt_id')
  @ResponseMessage('Khôi phục đơn vị đo thành công')
  @UseGuards(AccountAuthGuard)
  async restoreUnit(@Param('unt_id') unt_id: string, @Acccount() account: IAccount): Promise<UpdateResult> {
    return this.unitsService.restoreUnit(unt_id, account)
  }

  @Delete(':unt_id')
  @ResponseMessage('Xóa đơn vị đo thành công')
  @UseGuards(AccountAuthGuard)
  async deleteUnit(@Param('unt_id') unt_id: string, @Acccount() account: IAccount): Promise<UpdateResult> {
    return this.unitsService.deleteUnit(unt_id, account)
  }

  @Get(':unt_id')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy thông tin đơn vị đo thành công')
  async findOneById(@Param('unt_id') unt_id: string, @Acccount() account: IAccount): Promise<UnitEntity> {
    return this.unitsService.findOneById(unt_id, account)
  }
}
