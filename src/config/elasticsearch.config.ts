import { Client } from '@elastic/elasticsearch'
import { configService } from './configService'

const handleEventConnection = async ({ connectionElasticsearch }: { connectionElasticsearch: any }) => {
  try {
    const response = await connectionElasticsearch.ping()
    if (response) {
      console.log('connection Elasticsearch - Connection status: connected')
    }
  } catch (error) {
    console.log('Error connecting to Elasticsearch:', error)
  }
}

export const initElasticsearch = () => {
  const instanceElasticsearch = new Client({
    node: configService.get<string>('ELASTICSEARCH_NODE'),
    auth: {
      username: configService.get<string>('ELASTICSEARCH_USER_NAME'),
      password: configService.get<string>('ELASTICSEARCH_PASSWORD')
    },
    tls: {
      rejectUnauthorized: false
    }
  })

  const client = { instanceConnect: instanceElasticsearch }
  handleEventConnection({ connectionElasticsearch: instanceElasticsearch })
  return client
}

const client = initElasticsearch()
export const getElasticsearch = () => client
