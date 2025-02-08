import { UNIT_CONVERSION_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { UnitEntity } from 'src/units/entities/units.entity'
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
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

@Entity('unit-conversion')
export class UnitConversionEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  unt_cvs_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  unt_cvs_res_id?: string

  @Column('varchar', { length: 36 })
  unt_cvs_unt_id_from?: string

  @Column('varchar', { length: 36 })
  unt_cvs_unt_id_to?: string

  @Column('number', { default: 1 })
  unt_cvs_value?: number

  @ManyToOne(() => UnitEntity, (unit) => unit.unitConversionsFrom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unt_cvs_unt_id' })
  unitFrom?: UnitEntity

  @ManyToOne(() => UnitEntity, (unit) => unit.unitConversionsTo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unt_cvs_unt_id_to' })
  unitTo?: UnitEntity
}

@EventSubscriber()
export class UnitConversionSubscriber implements EntitySubscriberInterface<UnitConversionEntity> {
  listenTo() {
    return UnitConversionEntity
  }

  async afterInsert(event: InsertEvent<UnitConversionEntity>): Promise<void> {
    await addDocToElasticsearch(UNIT_CONVERSION_ELASTICSEARCH_INDEX, event.entity.unt_cvs_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<UnitConversionEntity>): Promise<void> {
    await updateDocByElasticsearch(UNIT_CONVERSION_ELASTICSEARCH_INDEX, event.entity.unt_cvs_id, event.entity)
  }
}
