import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const MUSCLE_GROUPS = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'cardio',
  'other',
] as const;
const EQUIPMENT_TYPES = [
  'barbell',
  'dumbbell',
  'machine',
  'bodyweight',
  'cable',
  'other',
] as const;

export class QueryExerciseDto {
  @ApiPropertyOptional({ enum: MUSCLE_GROUPS })
  @IsOptional()
  @IsIn(MUSCLE_GROUPS)
  muscleGroup?: string;

  @ApiPropertyOptional({ enum: EQUIPMENT_TYPES })
  @IsOptional()
  @IsIn(EQUIPMENT_TYPES)
  equipment?: string;

  @ApiPropertyOptional({ example: 'bench' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
