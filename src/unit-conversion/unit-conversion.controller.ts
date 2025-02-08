import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { UnitConversionService } from './unit-conversion.service'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { UnitConversionEntity } from './entities/unit-conversion.entity'
import { CreateUnitConversionDto } from './dto/create-unit-conversion.dto'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateUnitConversionDto } from './dto/update-unit-conversion.dto'
import { UpdateResult } from 'typeorm'

@Controller('unit-conversion')
export class UnitConversionController {
  constructor(private readonly unitConversionService: UnitConversionService) {}

  @Post()
  @ResponseMessage('Tạo đơn vị chuyển đổi thành công')
  @UseGuards(AccountAuthGuard)
  async createUnitConversion(
    @Body() createUnitConversionDto: CreateUnitConversionDto,
    @Acccount() account: IAccount
  ): Promise<UnitConversionEntity> {
    return await this.unitConversionService.createUnitConversion(createUnitConversionDto, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật đơn vị chuyển đổi thành công')
  @UseGuards(AccountAuthGuard)
  async updateUnitConversion(
    @Body() updateUnitConversionDto: UpdateUnitConversionDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return await this.unitConversionService.updateUnitConversion(updateUnitConversionDto, account)
  }

  @Delete()
  @ResponseMessage('Xóa đơn vị chuyển đổi thành công')
  @UseGuards(AccountAuthGuard)
  async deleteUnitConversion(@Param('unt_cvs_id') unt_cvs_id: string): Promise<boolean> {
    return await this.unitConversionService.deleteUnitConversion(unt_cvs_id)
  }

  @Get()
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy danh sách đơn vị chuyển đổi thành công')
  async getUnitConversion(
    @Param('unt_id') unt_id: string,
    @Acccount() account: IAccount
  ): Promise<{
    from: UnitConversionEntity[]
    to: UnitConversionEntity[]
  }> {
    return await this.unitConversionService.getListUnitConversion(unt_id, account)
  }
}
