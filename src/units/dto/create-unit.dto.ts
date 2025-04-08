import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({
    example: 'Kilogram',
    description: 'Tên của đơn vị tính',
  })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @IsString({ message: 'Tên phải là chuỗi' })
  unt_name: string;

  @ApiProperty({
    example: 'kg',
    description: 'Ký hiệu của đơn vị tính',
  })
  @IsNotEmpty({ message: 'Ký hiệu không được để trống' })
  @IsString({ message: 'Ký hiệu phải là chuỗi' })
  unt_symbol: string;

  @ApiProperty({
    example: 'Đơn vị dùng để đo khối lượng',
    description: 'Mô tả về đơn vị tính',
  })
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString({ message: 'Mô tả phải là chuỗi' })
  unt_description: string;
}
