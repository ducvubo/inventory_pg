import { IsNotEmpty, IsString } from 'class-validator'

export class CreateUnitDto {
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @IsString({ message: 'Tên phải là chuỗi' })
  unt_name: string

  @IsNotEmpty({ message: 'Ký hiệu không được để trống' })
  @IsString({ message: 'Ký hiệu phải là chuỗi' })
  unt_symbol: string

  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString({ message: 'Mô tả phải là chuỗi' })
  unt_description: string
}
