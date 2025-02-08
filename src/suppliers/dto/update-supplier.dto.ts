import { PartialType } from '@nestjs/mapped-types'
import { CreateSupplierDto } from './create-supplier.dto'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  spli_id: string
}
