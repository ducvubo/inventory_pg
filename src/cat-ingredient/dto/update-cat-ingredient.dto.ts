import { PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { CreateCatIngredientDto } from './create-cat-ingredient.dto'

export class UpdateCatIngredientDto extends PartialType(CreateCatIngredientDto) {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  cat_igd_id: string
}
