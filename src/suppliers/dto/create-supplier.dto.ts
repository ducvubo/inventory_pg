import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsString } from 'class-validator'

export class CreateSupplierDto {
  @ApiProperty({ example: 'Nhà cung cấp 1', description: 'Tên nhà cung cấp' })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @IsString({ message: 'Tên phải là chuỗi' })
  spli_name: string

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsString({ message: 'Email phải là chuỗi' })
  spli_email: string

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  spli_phone: string

  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  spli_address: string

  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString({ message: 'Mô tả phải là chuỗi' })
  spli_description: string

  @IsNotEmpty({ message: 'Loại không được để trống' })
  @IsString({ message: 'Loại phải là chuỗi' })
  @IsIn(['supplier', 'customer'], { message: 'Trạng thái phải là "supplier", "customer"' })
  spli_type: 'supplier' | 'customer'
}
