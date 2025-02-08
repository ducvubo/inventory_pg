import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator'

export class UpdateUnitConversionDto {
  @IsNotEmpty({ message: 'Đơn vị chuyển đổi không được để trống' })
  @IsUUID('4', { message: 'Đơn vị chuyển đổi không đúng định dạng' })
  unt_cvs_id: string

  @IsNotEmpty({ message: 'Giá trị chuyển đổi không được để trống' })
  @IsNumber({}, { message: 'Giá trị chuyển đổi không đúng định dạng' })
  unt_cvs_value: number
}
