import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateIngredientDto {
  @ApiProperty({
    example: '5fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'ID danh mục nguyên liệu (UUID)',
  })
  @IsNotEmpty({ message: 'Danh mục nguyên liệu không được để trống' })
  @IsUUID('4', { message: 'Danh mục nguyên liệu không đúng định dạng' })
  cat_igd_id: string;

  @ApiProperty({
    example: '3fc7ec01-4f15-4d13-aaf2-8e3ac7819453',
    description: 'ID đơn vị đo (UUID)',
  })
  @IsNotEmpty({ message: 'Đơn vị đo không được để trống' })
  @IsUUID('4', { message: 'Đơn vị đo không đúng định dạng' })
  unt_id: string;

  @ApiProperty({
    example: 'Thịt bò',
    description: 'Tên nguyên liệu',
  })
  @IsNotEmpty({ message: 'Tên nguyên liệu không được để trống' })
  @IsString({ message: 'Tên nguyên liệu phải là chuỗi' })
  igd_name: string;

  @ApiProperty({
    example: 'Thịt bò tươi nhập khẩu từ Úc',
    description: 'Mô tả nguyên liệu',
  })
  @IsNotEmpty({ message: 'Mô tả nguyên liệu không được để trống' })
  @IsString({ message: 'Mô tả nguyên liệu phải là chuỗi' })
  igd_description: string;

  @ApiProperty({
    example: 'https://example.com/images/thit-bo.jpg',
    description: 'URL ảnh nguyên liệu',
  })
  @IsNotEmpty({ message: 'Ảnh nguyên liệu không được để trống' })
  @IsString({ message: 'Ảnh nguyên liệu phải là chuỗi' })
  igd_image: string;
}
