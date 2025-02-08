import { Module } from '@nestjs/common'
import { UnitsService } from './units.service'
import { UnitsController } from './units.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UnitEntity } from './entities/units.entity'
import { UnitRepo } from './entities/units.repo'
import { UnitQuery } from './entities/units.query'

@Module({
  imports: [TypeOrmModule.forFeature([UnitEntity])],
  controllers: [UnitsController],
  providers: [UnitsService, UnitRepo, UnitQuery],
  exports: [UnitsService, UnitRepo, UnitQuery]
})
export class UnitsModule {}
