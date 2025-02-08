import { STOCK_OUT_ITEM_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { IngredientEntity } from 'src/ingredients/entities/ingredient.entity'
import { StockOutEntity } from 'src/stok-out/entities/stock-out.entity'
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
  ManyToOne,
  JoinColumn,
  RemoveEvent
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

@Entity('stock_out_item')
export class StockOutItemEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  stko_item_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  stko_item_res_id?: string

  @Column('varchar', { length: 36 })
  stko_id?: string

  @Column('varchar', { length: 36 })
  igd_id?: string

  @Column('number')
  stko_item_quantity?: number

  @Column('number')
  stko_item_price?: number

  @ManyToOne(() => StockOutEntity, (stockOut) => stockOut.items, { onDelete: 'CASCADE' })
  stockOut?: StockOutEntity

  @ManyToOne(() => IngredientEntity, (ingredient) => ingredient.stockOutItems)
  @JoinColumn({ name: 'igd_id' })
  ingredient?: IngredientEntity
}

@EventSubscriber()
export class StockOutItemSubscriber implements EntitySubscriberInterface<StockOutItemEntity> {
  listenTo() {
    return StockOutItemEntity
  }

  async afterInsert(event: InsertEvent<StockOutItemEntity>): Promise<void> {
    await addDocToElasticsearch(STOCK_OUT_ITEM_ELASTICSEARCH_INDEX, event.entity.stko_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<StockOutItemEntity>): Promise<void> {
    await updateDocByElasticsearch(STOCK_OUT_ITEM_ELASTICSEARCH_INDEX, event.entity.stko_id, event.entity)
  }

  async afterRemove(event: RemoveEvent<StockOutItemEntity>): Promise<void> {
    await deleteDocByElasticsearch(STOCK_OUT_ITEM_ELASTICSEARCH_INDEX, event.entityId)
  }
}
