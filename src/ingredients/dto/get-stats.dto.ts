// src/inventory/dto/get-inventory-stats.dto.ts
import { IsMongoId, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class GetStatsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class GetLowStockDto extends GetStatsDto {
  // @IsNumber()
  // @IsOptional()
  threshold?: number;
}