import { PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { CreateIngredientDto } from './create-ingredient.dto'

export class UpdateIngredientDto extends PartialType(CreateIngredientDto) {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  igd_id: string
}
