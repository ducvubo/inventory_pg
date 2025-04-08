import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCatIngredientDto {
  @ApiProperty({
    example: 'Rau củ',
    description: 'Tên danh mục nguyên liệu',
  })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString({ message: 'Tên danh mục phải là chuỗi' })
  cat_igd_name: string;

  @ApiProperty({
    example: 'Danh mục chứa các loại rau củ như cải, cà rốt, hành...',
    description: 'Mô tả về danh mục nguyên liệu',
  })
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString({ message: 'Mô tả phải là chuỗi' })
  cat_igd_description: string;
}
