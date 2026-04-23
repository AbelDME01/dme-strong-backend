import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpsertRecordDto {
  @ApiProperty({ example: 'uuid-of-exercise' })
  @IsUUID()
  exerciseId: string;

  @ApiProperty({ enum: ['max_weight', 'max_reps', 'max_distance', 'max_duration'] })
  @IsIn(['max_weight', 'max_reps', 'max_distance', 'max_duration'])
  recordType: string;

  @ApiProperty({ example: 120.5 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ example: 'kg', enum: ['kg', 'reps', 'meters', 'seconds'] })
  @IsIn(['kg', 'reps', 'meters', 'seconds'])
  unit: string;

  @ApiPropertyOptional({ example: '2024-01-15T09:30:00Z' })
  @IsOptional()
  @IsDateString()
  achievedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workoutId?: string;
}

export class QueryRecordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  exerciseId?: string;

  @ApiPropertyOptional({ enum: ['max_weight', 'max_reps', 'max_distance', 'max_duration'] })
  @IsOptional()
  @IsString()
  recordType?: string;
}
