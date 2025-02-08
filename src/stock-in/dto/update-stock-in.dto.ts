import { PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { CreateStockInDto } from './create-stock-in.dto'

export class UpdateStockInDto extends PartialType(CreateStockInDto) {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  stki_id: string
}
