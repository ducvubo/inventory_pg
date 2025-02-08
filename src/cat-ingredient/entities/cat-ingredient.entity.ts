import { CAT_INGREDIENT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { IngredientEntity } from 'src/ingredients/entities/ingredient.entity'
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

@Entity('cat-ingredient')
export class CatIngredientEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  cat_igd_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  cat_igd_res_id?: string

  @Column('varchar', { length: 255 })
  cat_igd_name?: string

  @Column('varchar', { length: 255 })
  cat_igd_description?: string

  @Column('varchar', { length: 255, default: 'enable' })
  cat_igd_status?: string

  @OneToMany(() => IngredientEntity, (ingredient) => ingredient.category)
  ingredients?: IngredientEntity[]
}

@EventSubscriber()
export class CatIngredientSubscriber implements EntitySubscriberInterface<CatIngredientEntity> {
  listenTo() {
    return CatIngredientEntity
  }

  async afterInsert(event: InsertEvent<CatIngredientEntity>): Promise<void> {
    await addDocToElasticsearch(CAT_INGREDIENT_ELASTICSEARCH_INDEX, event.entity.cat_igd_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<CatIngredientEntity>): Promise<void> {
    await updateDocByElasticsearch(CAT_INGREDIENT_ELASTICSEARCH_INDEX, event.entity.cat_igd_id, event.entity)
  }
}
