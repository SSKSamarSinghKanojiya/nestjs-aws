import { IsOptional, IsNumber } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  lastKey?: string;
}