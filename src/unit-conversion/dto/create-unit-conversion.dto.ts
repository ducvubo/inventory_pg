import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator'

export class CreateUnitConversionDto {
  @IsNotEmpty({ message: 'Đơn vị chuyển đổi không được để trống' })
  @IsUUID('4', { message: 'Đơn vị chuyển đổi không đúng định dạng' })
  unt_cvs_unt_id_from: string

  @IsNotEmpty({ message: 'Đơn vị chuyển đổi không được để trống' })
  @IsUUID('4', { message: 'Đơn vị chuyển đổi không đúng định dạng' })
  unt_cvs_unt_id_to: string

  @IsNotEmpty({ message: 'Giá trị chuyển đổi không được để trống' })
  @IsNumber({}, { message: 'Giá trị chuyển đổi không đúng định dạng' })
  unt_cvs_value: number
}
