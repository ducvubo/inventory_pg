import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({
    example: 'Nhà cung cấp 1',
    description: 'Tên nhà cung cấp',
  })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @IsString({ message: 'Tên phải là chuỗi' })
  spli_name: string;

  @ApiProperty({
    example: 'supplier1@example.com',
    description: 'Email của nhà cung cấp',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsString({ message: 'Email phải là chuỗi' })
  spli_email: string;

  @ApiProperty({
    example: '0901234567',
    description: 'Số điện thoại nhà cung cấp',
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  spli_phone: string;

  @ApiProperty({
    example: '123 Đường ABC, Quận 1, TP.HCM',
    description: 'Địa chỉ nhà cung cấp',
  })
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  spli_address: string;

  @ApiProperty({
    example: 'Chuyên cung cấp nguyên liệu tươi',
    description: 'Mô tả về nhà cung cấp',
  })
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString({ message: 'Mô tả phải là chuỗi' })
  spli_description: string;

  @ApiProperty({
    example: 'supplier',
    description: 'Loại đối tượng, có thể là "supplier" hoặc "customer"',
    enum: ['supplier', 'customer'],
  })
  @IsNotEmpty({ message: 'Loại không được để trống' })
  @IsString({ message: 'Loại phải là chuỗi' })
  @IsIn(['supplier', 'customer'], {
    message: 'Trạng thái phải là "supplier" hoặc "customer"',
  })
  spli_type: 'supplier' | 'customer';
}
