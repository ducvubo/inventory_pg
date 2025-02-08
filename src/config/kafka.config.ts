import { Kafka } from 'kafkajs'
import { configService } from './configService'

const handleEventConnection = async ({ connectionKafka }: { connectionKafka: any }) => {
  try {
    const admin = connectionKafka.admin()
    await admin.connect()
    console.log('connection Kafka - Connection status: connected')
    admin.disconnect()
  } catch (error) {
    console.log('Error connecting to Kafka:', error)
  }
}

export const initKafka = () => {
  const instanceKafka = new Kafka({
    clientId: 'order-service',
    brokers: [
      configService.get<string>('BROKER_KAFKA_1'),
      configService.get<string>('BROKER_KAFKA_2'),
      configService.get<string>('BROKER_KAFKA_3')
    ]
  })

  const client = { instanceConnect: instanceKafka }
  handleEventConnection({ connectionKafka: instanceKafka })
  return client
}

const client = initKafka()
export const getKafka = () => client
