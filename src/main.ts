import { NestFactory, Reflector } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { TransformIntercaptor } from './interceptor/transform.interceptor'
import { IdUserGuestInterceptor } from './interceptor/guestId.interceptor'
import { join } from 'path'
import { initRedis } from './config/redis.config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { initElasticsearch } from './config/elasticsearch.config'
import { initMinio } from './config/minio.config'
import { sendMessageToKafka } from './utils/kafka'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const configService = app.get(ConfigService)

  app.useGlobalPipes(new ValidationPipe())
  const reflector = app.get(Reflector)

  initRedis()
  initElasticsearch()
  initMinio()
  sendMessageToKafka({
    topic: "test",
    message: `Hello kafka1: ${Math.floor(Math.random() * 100) + 1}`,
  });

  app.useGlobalInterceptors(new TransformIntercaptor(reflector))
  app.useGlobalInterceptors(new IdUserGuestInterceptor(reflector))

  app.useStaticAssets(join(__dirname, '..', 'public'))
  app.setBaseViewsDir(join(__dirname, '..', 'views'))
  app.setViewEngine('ejs')

  app.setGlobalPrefix('api')
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1']
  })

  app.enableCors()

  const config = new DocumentBuilder()
    .setTitle('Warehouse API')
    .setDescription('The Warehouse API description')
    .setVersion('1.0')
    .addTag('warehouse')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token' // Tên cho access_token
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'refresh-token' // Tên cho refresh_token
    )
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('swagger', app, documentFactory)

  await app.startAllMicroservices()
  await app.listen(configService.get<string>('PORT'))
}
bootstrap()
