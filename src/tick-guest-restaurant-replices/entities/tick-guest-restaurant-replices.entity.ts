import { TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX, TICKET_GUEST_RESTAURANT_REPLICES_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { TicketGuestRestaurantEntity } from 'src/ticket-guest-restaurant/entities/ticket-guest-restaurant.entity'
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
  ManyToOne
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

@Entity('ticket_guest_restaurant_replices')
export class TicketGuestRestaurantReplicesEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  tkgr_rp_id?: string = uuidv4()

  @Column('varchar', { length: 36 })
  tkgr_id?: string

  @Column('clob')
  tkgr_rp_content?: string

  @Column('varchar', { length: 255 })
  tkgr_rp_attachment?: string

  @Column('varchar', { length: 255 })
  tkgr_rp_type?: 'guest' | 'restaurant'

  @Column('timestamp')
  tkgr_rp_time?: Date

  @ManyToOne(() => TicketGuestRestaurantEntity, (ticket) => ticket.replices, { onDelete: 'CASCADE' })
  ticketGuestRestaurant?: TicketGuestRestaurantEntity
}

@EventSubscriber()
export class TicketGuestRestaurantReplicesSubscriber implements EntitySubscriberInterface<TicketGuestRestaurantReplicesEntity> {
  listenTo() {
    return TicketGuestRestaurantReplicesEntity
  }

  async afterInsert(event: InsertEvent<TicketGuestRestaurantReplicesEntity>): Promise<void> {
    await addDocToElasticsearch(TICKET_GUEST_RESTAURANT_REPLICES_ELASTICSEARCH_INDEX, event.entity.tkgr_rp_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<TicketGuestRestaurantReplicesEntity>): Promise<void> {
    await updateDocByElasticsearch(TICKET_GUEST_RESTAURANT_REPLICES_ELASTICSEARCH_INDEX, event.entity.tkgr_rp_id, event.entity)
  }
}
