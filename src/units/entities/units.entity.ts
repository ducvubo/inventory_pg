import { UNIT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { IngredientEntity } from 'src/ingredients/entities/ingredient.entity'
import { UnitConversionEntity } from 'src/unit-conversion/entities/unit-conversion.entity'
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

@Entity('units')
export class UnitEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  unt_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  unt_res_id?: string

  //ký hiệu đơn vị
  @Column('varchar', { length: 255 })
  unt_symbol?: string

  @Column('varchar', { length: 255 })
  unt_name?: string

  @Column('varchar', { length: 255 })
  unt_description?: string

  @Column('varchar', { length: 255, default: 'enable' })
  unt_status?: string

  @OneToMany(() => UnitConversionEntity, (conversion) => conversion.unitFrom)
  unitConversionsFrom?: UnitConversionEntity[]

  @OneToMany(() => UnitConversionEntity, (conversion) => conversion.unitTo)
  unitConversionsTo?: UnitConversionEntity[]

  @OneToMany(() => IngredientEntity, (ingredient) => ingredient.unit)
  ingredients?: IngredientEntity[]
}

@EventSubscriber()
export class UnitSubscriber implements EntitySubscriberInterface<UnitEntity> {
  listenTo() {
    return UnitEntity
  }

  async afterInsert(event: InsertEvent<UnitEntity>): Promise<void> {
    await addDocToElasticsearch(UNIT_ELASTICSEARCH_INDEX, event.entity.unt_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<UnitEntity>): Promise<void> {
    await updateDocByElasticsearch(UNIT_ELASTICSEARCH_INDEX, event.entity.unt_id, event.entity)
  }
}
