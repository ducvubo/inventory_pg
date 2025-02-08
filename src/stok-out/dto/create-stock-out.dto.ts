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

export class CreateStockOutDto {
  @IsNotEmpty({ message: 'Nhà cung cấp không được để trống' })
  @IsUUID('4', { message: 'Nhà cung cấp không đúng định dạng' })
  spli_id: string

  @IsNotEmpty({ message: 'Mã phiếu xuất không được để trống' })
  @IsString({ message: 'Mã phiếu xuất không đúng định dạng' })
  stko_code: string

  @IsOptional()
  @IsString({ message: 'Ảnh chứng từ không đúng định dạng' })
  stko_image: string

  @IsNotEmpty({ message: 'Người xuất không được để trống' })
  @IsString({ message: 'Người xuất không đúng định dạng' })
  stko_seller: string

  @IsNotEmpty({ message: 'Loại người xuất không được để trống' })
  @IsIn(['employee', 'restaurant'], { message: 'Loại người xuất không hợp lệ' })
  stko_seller_type: 'employee' | 'restaurant'

  @IsNotEmpty({ message: 'Ngày xuất không được để trống' })
  stko_date: Date

  @IsOptional()
  @IsString({ message: 'Ghi chú không đúng định dạng' })
  stko_note: string

  @IsNotEmpty({ message: 'Hình thức thanh toán không được để trống' })
  @IsIn(['cash', 'transfer', 'credit_card'], { message: 'Hình thức thanh toán không hợp lệ' })
  stko_payment_method: string

  @IsNotEmpty({ message: 'Loại xuất kho không được để trống' })
  @IsIn(['internal', 'retail'], { message: 'Loại xuất kho không hợp lệ' })
  stko_type: 'internal' | 'retail'

  @IsArray({ message: 'Danh sách nguyên liệu không đúng định dạng' })
  @ArrayNotEmpty({ message: 'Danh sách nguyên liệu không được để trống' })
  @ValidateNested({ each: true })
  @Type(() => CreateStockOutItemDto)
  stock_out_items: CreateStockOutItemDto[]
}

export class CreateStockOutItemDto {
  @IsNotEmpty({ message: 'Id nguyên liệu không được để trống' })
  @IsUUID('4', { message: 'Id nguyên liệu không đúng định dạng' })
  igd_id: string

  @IsNotEmpty({ message: 'Số lượng  đơn không được để trống' })
  @IsNumber({}, { message: 'Số lượng  đơn không đúng định dạng' })
  stko_item_quantity: number

  @IsNotEmpty({ message: 'Đơn giá không được để trống' })
  @IsNumber({}, { message: 'Đơn giá không đúng định dạng' })
  stko_item_price: number
}
