import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateWorkoutDto {
  @ApiProperty({ example: 'Morning Push Day' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Felt strong today' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'uuid-of-routine' })
  @IsOptional()
  @IsUUID()
  routineId?: string;

  @ApiPropertyOptional({ example: '2024-01-15T08:00:00Z' })
  @IsOptional()
  @IsDateString()
  startedAt?: string;
}
