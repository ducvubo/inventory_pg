import { PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { CreateStockOutDto } from './create-stock-out.dto'

export class UpdateStockOutDto extends PartialType(CreateStockOutDto) {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  stko_id: string
}
