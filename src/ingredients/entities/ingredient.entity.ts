import { CatIngredientEntity } from 'src/cat-ingredient/entities/cat-ingredient.entity'
import { INGREDIENT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { StockInItemEntity } from 'src/stock-in-item/entities/stock-in-item.entity'
import { StockOutItemEntity } from 'src/stok-out-item/entities/stock-out-item.entity'
import { UnitEntity } from 'src/units/entities/units.entity'
import { addDocToElasticsearch, deleteDocByElasticsearch, updateDocByElasticsearch } from 'src/utils/elasticsearch'
import { SampleEntity } from 'src/utils/sample.entity'
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RemoveEvent
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

@Entity('ingredient')
export class IngredientEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  igd_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  igd_res_id?: string

  @Column('varchar', { length: 36 })
  cat_igd_id?: string

  @Column('varchar', { length: 36 })
  unt_id?: string

  @Column('varchar', { length: 255 })
  igd_name?: string

  @Column('clob')
  igd_image?: string

  @Column('varchar', { length: 255 })
  igd_description?: string

  @Column('varchar', { length: 255, default: 'enable' })
  igd_status?: string

  @ManyToOne(() => CatIngredientEntity, (category) => category.ingredients)
  @JoinColumn({ name: 'cat_igd_id' }) // Map với cột cat_igd_id
  category?: CatIngredientEntity

  @ManyToOne(() => UnitEntity, (unit) => unit.ingredients)
  @JoinColumn({ name: 'unt_id' })
  unit?: UnitEntity

  @OneToMany(() => StockInItemEntity, (stockInItem) => stockInItem.ingredient)
  stockInItems?: StockInItemEntity[]

  @OneToMany(() => StockOutItemEntity, (stockOutItem) => stockOutItem.ingredient)
  stockOutItems?: StockOutItemEntity[]
}

@EventSubscriber()
export class IngredientSubscriber implements EntitySubscriberInterface<IngredientEntity> {
  listenTo() {
    return IngredientEntity
  }

  async afterInsert(event: InsertEvent<IngredientEntity>): Promise<void> {
    await addDocToElasticsearch(INGREDIENT_ELASTICSEARCH_INDEX, event.entity.igd_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<IngredientEntity>): Promise<void> {
    await updateDocByElasticsearch(INGREDIENT_ELASTICSEARCH_INDEX, event.entity.igd_id, event.entity)
  }

  async afterRemove(event: RemoveEvent<IngredientEntity>): Promise<void> {
    await deleteDocByElasticsearch(INGREDIENT_ELASTICSEARCH_INDEX, event.entityId)
  }
}
