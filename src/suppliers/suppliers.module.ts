import { Module } from '@nestjs/common'
import { SuppliersService } from './suppliers.service'
import { SuppliersController } from './suppliers.controller'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SupplierEntity } from './entities/suppliers.entity'
import { SupplierRepo } from './entities/suppliers.repo'
import { SupplierQuery } from './entities/suppliers.query'

@Module({
  imports: [TypeOrmModule.forFeature([SupplierEntity])],
  controllers: [SuppliersController],
  providers: [SuppliersService, SupplierRepo, SupplierQuery],
  exports: [SuppliersService, SupplierRepo, SupplierQuery]
})
export class SuppliersModule {}
