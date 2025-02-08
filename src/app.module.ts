import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UploadModule } from './upload/upload.module'
import { SuppliersModule } from './suppliers/suppliers.module'
import { SupplierEntity, SupplierSubscriber } from './suppliers/entities/suppliers.entity'
import { CatIngredientModule } from './cat-ingredient/cat-ingredient.module'
import { CatIngredientEntity, CatIngredientSubscriber } from './cat-ingredient/entities/cat-ingredient.entity'
import { UnitsModule } from './units/units.module'
import { UnitEntity, UnitSubscriber } from './units/entities/units.entity'
import { UnitConversionModule } from './unit-conversion/unit-conversion.module'
import { UnitConversionEntity, UnitConversionSubscriber } from './unit-conversion/entities/unit-conversion.entity'
import { IngredientsModule } from './ingredients/ingredients.module'
import { IngredientEntity, IngredientSubscriber } from './ingredients/entities/ingredient.entity'
import { StockInModule } from './stock-in/stock-in.module'
import { StockInItemModule } from './stock-in-item/stock-in-item.module'
import { StockInEntity, StockInSubscriber } from './stock-in/entities/stock-in.entity'
import { StockInItemEntity, StockInItemSubscriber } from './stock-in-item/entities/stock-in-item.entity'
import { StockOutModule } from './stok-out/stock-out.module'
import { StokOutItemModule } from './stok-out-item/stok-out-item.module'
import { StockOutEntity, StockOutSubscriber } from './stok-out/entities/stock-out.entity'
import { StockOutItemEntity, StockOutItemSubscriber } from './stok-out-item/entities/stock-out-item.entity'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRoot({
      type: 'oracle',
      host: '160.191.51.57',
      port: 1521,
      username: 'WareHousePG',
      password: 'Duc17052003*',
      serviceName: 'ORCLPDB1',
      entities: [
        SupplierEntity,
        CatIngredientEntity,
        UnitEntity,
        UnitConversionEntity,
        IngredientEntity,
        StockInEntity,
        StockInItemEntity,
        StockOutEntity,
        StockOutItemEntity
      ],
      subscribers: [
        SupplierSubscriber,
        CatIngredientSubscriber,
        UnitSubscriber,
        UnitConversionSubscriber,
        IngredientSubscriber,
        StockInSubscriber,
        StockInItemSubscriber,
        StockOutSubscriber,
        StockOutItemSubscriber
      ],
      synchronize: true
    }),
    UploadModule,
    SuppliersModule,
    CatIngredientModule,
    UnitsModule,
    UnitConversionModule,
    IngredientsModule,
    StockInModule,
    StockInItemModule,
    StockOutModule,
    StokOutItemModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
