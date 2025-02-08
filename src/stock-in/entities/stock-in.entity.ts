import { STOCK_IN_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { StockInItemEntity } from 'src/stock-in-item/entities/stock-in-item.entity'
import { SupplierEntity } from 'src/suppliers/entities/suppliers.entity'
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
  OneToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

@Entity('stock_in')
export class StockInEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  stki_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  stki_res_id?: string

  @Column('varchar', { length: 36 })
  spli_id?: string

  @Column('varchar', { length: 255, unique: true })
  stki_code?: string // mã phiếu nhập

  //ảnh chứng từ
  @Column('clob', { nullable: true })
  stki_image?: string

  @Column('varchar', { length: 255 })
  stki_delivery_name?: string //tên người giao hàng

  @Column('varchar', { length: 255 })
  stki_delivery_phone?: string //số điện thoại người giao hàng

  @Column('varchar', { length: 24 }) //tùy theo loại người nhận
  stki_receiver?: string

  @Column('varchar', { length: 24 }) //employee: nhân viên | restaurant: chủ nhà hàng
  stki_receiver_type?: string

  @Column('date')
  stki_date?: Date // ngày nhập

  @Column('varchar', { length: 255 })
  stki_note?: string // ghi chú

  @Column('varchar', { length: 255 })
  stki_payment_method?: string //hình thức thanh toán - `cash`, `transfer`, `credit_card`

  @OneToMany(() => StockInItemEntity, (item) => item.stockIn, { cascade: true })
  items?: StockInItemEntity[]

  @ManyToOne(() => SupplierEntity, (supplier) => supplier.stockIns, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'spli_id' })
  supplier?: SupplierEntity
}

@EventSubscriber()
export class StockInSubscriber implements EntitySubscriberInterface<StockInEntity> {
  listenTo() {
    return StockInEntity
  }

  async afterInsert(event: InsertEvent<StockInEntity>): Promise<void> {
    await addDocToElasticsearch(STOCK_IN_ELASTICSEARCH_INDEX, event.entity.stki_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<StockInEntity>): Promise<void> {
    await updateDocByElasticsearch(STOCK_IN_ELASTICSEARCH_INDEX, event.entity.stki_id, event.entity)
  }
}
