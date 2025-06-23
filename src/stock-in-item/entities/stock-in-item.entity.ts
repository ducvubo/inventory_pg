import { STOCK_IN_ITEM_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { IngredientEntity } from 'src/ingredients/entities/ingredient.entity'
import { StockInEntity } from 'src/stock-in/entities/stock-in.entity'
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

@Entity('stock_in_item')
export class StockInItemEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  stki_item_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  stki_item_res_id?: string

  @Column('varchar', { length: 36 })
  stki_id?: string

  @Column('varchar', { length: 36 })
  igd_id?: string

  //số lượng trên hóa đơn
  @Column('number')
  stki_item_quantity?: number

  //số lượng thực tế
  @Column('number')
  stki_item_quantity_real?: number

  //đơn giá
  @Column('number')
  stki_item_price?: number

  @ManyToOne(() => StockInEntity, (stockIn) => stockIn.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stki_id' })
  stockIn?: StockInEntity

  @ManyToOne(() => IngredientEntity, (ingredient) => ingredient.stockInItems)
  @JoinColumn({ name: 'igd_id' })
  ingredient?: IngredientEntity
}

@EventSubscriber()
export class StockInItemSubscriber implements EntitySubscriberInterface<StockInItemEntity> {
  listenTo() {
    return StockInItemEntity
  }

  async afterInsert(event: InsertEvent<StockInItemEntity>): Promise<void> {
    await addDocToElasticsearch(STOCK_IN_ITEM_ELASTICSEARCH_INDEX, event.entity.stki_item_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<StockInItemEntity>): Promise<void> {
    await updateDocByElasticsearch(STOCK_IN_ITEM_ELASTICSEARCH_INDEX, event.entity.stki_item_id, event.entity)
  }

  async afterRemove(event: RemoveEvent<StockInItemEntity>): Promise<void> {
    await deleteDocByElasticsearch(STOCK_IN_ITEM_ELASTICSEARCH_INDEX, event.entityId)
  }
}
