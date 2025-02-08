import { Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator'

export class CreateStockInDto {
  @IsNotEmpty({ message: 'Nhà cung cấp không được để trống' })
  @IsUUID('4', { message: 'Nhà cung cấp không đúng định dạng' })
  spli_id: string

  @IsNotEmpty({ message: 'Mã phiếu nhập không được để trống' })
  @IsString({ message: 'Mã phiếu nhập không đúng định dạng' })
  stki_code: string

  @IsOptional()
  @IsString({ message: 'Ảnh chứng từ không đúng định dạng' })
  stki_image: string

  @IsNotEmpty({ message: 'Tên người giao hàng không được để trống' })
  @IsString({ message: 'Tên người giao hàng không đúng định dạng' })
  stki_delivery_name: string

  @IsNotEmpty({ message: 'Số điện thoại người giao hàng không được để trống' })
  @IsString({ message: 'Số điện thoại người giao hàng không đúng định dạng' })
  stki_delivery_phone: string

  @IsNotEmpty({ message: 'Người nhận không được để trống' })
  @IsString({ message: 'Người nhận không đúng định dạng' })
  stki_receiver: string

  @IsNotEmpty({ message: 'Loại người nhận không được để trống' })
  @IsIn(['employee', 'restaurant'], { message: 'Loại người nhận không hợp lệ' })
  stki_receiver_type: 'employee' | 'restaurant'

  @IsNotEmpty({ message: 'Ngày nhập không được để trống' })
  stki_date: Date

  @IsOptional()
  @IsString({ message: 'Ghi chú không đúng định dạng' })
  stki_note: string

  @IsNotEmpty({ message: 'Hình thức thanh toán không được để trống' })
  @IsIn(['cash', 'transfer', 'credit_card'], { message: 'Hình thức thanh toán không hợp lệ' })
  stki_payment_method: string

  @IsArray({ message: 'Danh sách nguyên liệu không đúng định dạng' })
  @ArrayNotEmpty({ message: 'Danh sách nguyên liệu không được để trống' })
  @ValidateNested({ each: true })
  @Type(() => CreateStockInItemDto)
  stock_in_items: CreateStockInItemDto[]
}

export class CreateStockInItemDto {
  @IsNotEmpty({ message: 'Id nguyên liệu không được để trống' })
  @IsUUID('4', { message: 'Id nguyên liệu không đúng định dạng' })
  igd_id: string

  @IsNotEmpty({ message: 'Số lượng trên hóa đơn không được để trống' })
  @IsNumber({}, { message: 'Số lượng trên hóa đơn không đúng định dạng' })
  stki_item_quantity: number

  @IsNotEmpty({ message: 'Số lượng thực tế không được để trống' })
  @IsNumber({}, { message: 'Số lượng thực tế không đúng định dạng' })
  stki_item_quantity_real: number

  @IsNotEmpty({ message: 'Đơn giá không được để trống' })
  @IsNumber({}, { message: 'Đơn giá không đúng định dạng' })
  stki_item_price: number
}
