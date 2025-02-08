import { IsIn, IsNotEmpty, IsUUID } from 'class-validator'

export class UpdateStatusIngredientDto {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  igd_id: string

  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsIn(['enable', 'disable'], { message: 'Trạng thái phải là "enable", "disable"' })
  igd_status: 'enable' | 'disable'
}
