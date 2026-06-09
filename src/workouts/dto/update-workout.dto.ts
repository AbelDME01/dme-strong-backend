import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateWorkoutDto {
  @ApiPropertyOptional({ example: 'Evening Pull Day' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Great session!' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '2024-01-15T09:30:00Z' })
  @IsOptional()
  @IsDateString()
  finishedAt?: string;

  @ApiPropertyOptional({ example: 3600 })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;
}
