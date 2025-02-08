import { ConfigModule, ConfigService } from '@nestjs/config'

// Khởi tạo ConfigModule một cách tạm thời
ConfigModule.forRoot({
  isGlobal: true
})

export const configService = new ConfigService()
