import Redis from 'ioredis'
import { configService } from './configService'

const statusConnectRedis = {
  CONNECT: 'connect',
  END: 'end',
  ERROR: 'error',
  RECONNECT: 'reconnecting'
}

const handleEventConnection = ({ connectionRedis }: { connectionRedis: any }) => {
  connectionRedis.on(statusConnectRedis.CONNECT, () => {
    console.log('connection Redis - Connection status: connected')
  })
  connectionRedis.on(statusConnectRedis.END, () => {
    console.log('connection Redis - Connection status: disconnected')
  })
  connectionRedis.on(statusConnectRedis.RECONNECT, () => {
    console.log('connection Redis - Connection status: reconnecting')
  })
  connectionRedis.on(statusConnectRedis.ERROR, (err) => {
    console.log(`connection Redis - Connection status: error ${err}`)
  })
}

export const initRedis = () => {
  const instanceRedis = new Redis({
    port: configService.get<number>('REDIS_PORT'),
    host: configService.get<string>('REDIS_HOST'),
    username: configService.get<string>('REDIS_USERNAME'),
    password: configService.get<string>('REDIS_PASSWORD')
  })

  const client = { instanceConnect: instanceRedis }
  handleEventConnection({ connectionRedis: instanceRedis })
  return client
}

const client = initRedis()
export const getRedis = () => client
