import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class TickGuestRestaurantReplicesDto {
  @IsNotEmpty({ message: 'tkgr_id không được để trống' })
  @IsUUID('4', { message: 'tkgr_id không đúng định dạng uuid v4' })
  tkgr_id: string;


  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @IsString({ message: 'Nội dung phải là chuỗi' })
  tkgr_rp_content: string;

  @IsOptional()
  @IsString({ message: 'Đính kèm phải là chuỗi' })
  tkgr_rp_attachment: string;
}
