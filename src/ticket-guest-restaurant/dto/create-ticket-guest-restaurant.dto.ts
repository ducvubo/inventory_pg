import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTicketGuestRestaurantDto {
  @ApiProperty({ description: 'ID nhà hàng', example: '123abc' })
  @IsNotEmpty({ message: 'Nhà hàng không được để trống' })
  @IsString({ message: 'Nhà hàng phải là chuỗi' })
  tkgr_res_id: string;

  @ApiProperty({ description: 'ID người dùng (nếu có)', example: 1001, required: false })
  @IsOptional()
  @IsNumber({}, { message: 'User phải là số' })
  tkgr_user_id?: number;

  @ApiProperty({ description: 'Email người dùng (nếu có)', example: '' })
  @IsString({ message: 'Email phải là chuỗi' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  tkgr_user_email: string;

  @ApiProperty({ description: 'Tiêu đề của ticket', example: 'Đặt bàn cho 5 người' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  tkgr_title: string;

  @ApiProperty({ description: 'Mô tả chi tiết', example: 'Tôi muốn đặt bàn vào lúc 19h' })
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString({ message: 'Mô tả phải là chuỗi' })
  tkgr_description: string;

  @ApiProperty({
    description: 'Mức độ ưu tiên',
    example: 'high',
    enum: ['low', 'medium', 'high', 'urgent'],
  })
  @IsNotEmpty({ message: 'Mức độ ưu tiên không được để trống' })
  @IsIn(['low', 'medium', 'high', 'urgent'], { message: 'Mức độ ưu tiên phải là "low", "medium", "high", "urgent"' })
  tkgr_priority: 'low' | 'medium' | 'high' | 'urgent';

  @ApiProperty({
    description: 'Loại ticket',
    example: 'book_table',
    enum: ['book_table', 'order_dish', 'Q&A', 'complain', 'other'],
  })
  @IsNotEmpty({ message: 'Loại không được để trống' })
  @IsIn(['book_table', 'order_dish', 'Q&A', 'complain', 'other'], { message: 'Loại phải là "book_table", "order_dish", "Q&A", "complain", "other"' })
  tkgr_type: 'book_table' | 'order_dish' | 'Q&A' | 'complain' | 'other';

  @ApiProperty({ description: 'Tệp đính kèm (nếu có)', example: 'file.png', required: false })
  @IsOptional()
  @IsString({ message: 'Attachment phải là chuỗi' })
  tkgr_attachment?: string;
}
