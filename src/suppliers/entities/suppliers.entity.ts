import { SUPPLIER_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { StockInEntity } from 'src/stock-in/entities/stock-in.entity'
import { StockOutEntity } from 'src/stok-out/entities/stock-out.entity'
import { addDocToElasticsearch, updateDocByElasticsearch } from 'src/utils/elasticsearch'
import { SampleEntity } from 'src/utils/sample.entity'
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  OneToMany
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

@Entity('suppliers')
export class SupplierEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  spli_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  spli_res_id?: string

  @Column('varchar', { length: 255 })
  spli_name?: string

  @Column('varchar', { length: 255 })
  spli_email?: string

  @Column('varchar', { length: 255 })
  spli_phone?: string

  @Column('clob')
  spli_address?: string

  @Column('varchar', { length: 255 })
  spli_description?: string

  // supplier, customer
  @Column('varchar', { default: 'supplier' })
  spli_type?: string

  @Column('varchar', { length: 255, default: 'enable' })
  spli_status?: string

  @OneToMany(() => StockInEntity, (stockIn) => stockIn.supplier)
  stockIns?: StockInEntity[]

  @OneToMany(() => StockOutEntity, (stockOut) => stockOut.supplier)
  stockOuts?: StockOutEntity[]
}

@EventSubscriber()
export class SupplierSubscriber implements EntitySubscriberInterface<SupplierEntity> {
  listenTo() {
    return SupplierEntity
  }

  async afterInsert(event: InsertEvent<SupplierEntity>): Promise<void> {
    await addDocToElasticsearch(SUPPLIER_ELASTICSEARCH_INDEX, event.entity.spli_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<SupplierEntity>): Promise<void> {
    await updateDocByElasticsearch(SUPPLIER_ELASTICSEARCH_INDEX, event.entity.spli_id, event.entity)
  }
}
