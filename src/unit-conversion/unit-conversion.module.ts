import { Module } from '@nestjs/common'
import { UnitConversionService } from './unit-conversion.service'
import { UnitConversionController } from './unit-conversion.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UnitConversionEntity } from './entities/unit-conversion.entity'
import { UnitConversionQuery } from './entities/unit-conversion.query'
import { UnitConversionRepo } from './entities/unit-conversion.repo'
import { UnitsModule } from 'src/units/units.module'

@Module({
  imports: [TypeOrmModule.forFeature([UnitConversionEntity]), UnitsModule],
  controllers: [UnitConversionController],
  providers: [UnitConversionService, UnitConversionQuery, UnitConversionRepo]
})
export class UnitConversionModule {}
