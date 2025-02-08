import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class CreateIngredientDto {
  @IsNotEmpty({ message: 'Danh mục nguyên liệu không được để trống' })
  @IsUUID('4', { message: 'Danh mục nguyên liệu không đúng định dạng' })
  cat_igd_id: string

  @IsNotEmpty({ message: 'Đơn vị đo không được để trống' })
  @IsUUID('4', { message: 'Đơn vị đo không đúng định dạng' })
  unt_id: string

  @IsNotEmpty({ message: 'Tên nguyên liệu không được để trống' })
  @IsString({ message: 'Tên nguyên liệu phải là chuỗi' })
  igd_name: string

  @IsNotEmpty({ message: 'Mô tả nguyên liệu không được để trống' })
  @IsString({ message: 'Mô tả nguyên liệu phải là chuỗi' })
  igd_description: string

  @IsNotEmpty({ message: 'Ảnh nguyên liệu không được để trống' })
  @IsString({ message: 'Ảnh nguyên liệu phải là chuỗi' })
  igd_image: string
}
