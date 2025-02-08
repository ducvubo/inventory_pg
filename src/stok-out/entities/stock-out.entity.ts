import { STOCK_OUT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { StockOutItemEntity } from 'src/stok-out-item/entities/stock-out-item.entity'
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

@Entity('stock_out')
export class StockOutEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  stko_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  stko_res_id?: string

  @Column('varchar', { length: 36, nullable: true })
  spli_id?: string

  @Column('varchar', { length: 255, unique: true })
  stko_code?: string // mã phiếu xuất

  //ảnh chứng từ
  @Column('clob', { nullable: true })
  stko_image?: string

  @Column('varchar', { length: 24 }) //tùy theo loại người gửi
  stko_seller?: string

  @Column('varchar', { length: 24 }) //employee: nhân viên | restaurant: chủ nhà hàng
  stko_seller_type?: string

  @Column('date')
  stko_date?: Date // ngày xuất

  @Column('varchar', { length: 255 })
  stko_note?: string // ghi chú

  @Column('varchar', { length: 255 })
  stko_payment_method?: string //hình thức thanh toán - `cash`, `transfer`, `credit_card`

  @Column('varchar', { length: 255 })
  stko_type?: string //loại xuất kho - 'internal', 'retail' - nội bộ, bán lẻ

  @OneToMany(() => StockOutItemEntity, (item) => item.stockOut, { cascade: true })
  items?: StockOutItemEntity[]

  @ManyToOne(() => SupplierEntity, (supplier) => supplier.stockOuts, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'spli_id' })
  supplier?: SupplierEntity
}

@EventSubscriber()
export class StockOutSubscriber implements EntitySubscriberInterface<StockOutEntity> {
  listenTo() {
    return StockOutEntity
  }

  async afterInsert(event: InsertEvent<StockOutEntity>): Promise<void> {
    await addDocToElasticsearch(STOCK_OUT_ELASTICSEARCH_INDEX, event.entity.stko_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<StockOutEntity>): Promise<void> {
    await updateDocByElasticsearch(STOCK_OUT_ELASTICSEARCH_INDEX, event.entity.stko_id, event.entity)
  }
}
