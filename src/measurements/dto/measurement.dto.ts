import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateMeasurementDto {
  @ApiPropertyOptional({ example: '2024-01-15T08:00:00Z' })
  @IsOptional()
  @IsDateString()
  measuredAt?: string;

  @ApiPropertyOptional({ example: 80.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiPropertyOptional({ example: 18.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bodyFatPercentage?: number;

  @ApiPropertyOptional({ example: 70.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  muscleMassKg?: number;

  @ApiPropertyOptional({ example: 100.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  chestCm?: number;

  @ApiPropertyOptional({ example: 80.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  waistCm?: number;

  @ApiPropertyOptional({ example: 95.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hipsCm?: number;

  @ApiPropertyOptional({ example: 35.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  armCm?: number;

  @ApiPropertyOptional({ example: 55.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  thighCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMeasurementDto extends PartialType(CreateMeasurementDto) {}

export class QueryMeasurementDto {
  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
