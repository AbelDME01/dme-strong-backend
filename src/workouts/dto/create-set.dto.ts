import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { UUID_LIKE_REGEX } from '../../common/utils/uuid.util';

export class CreateSetDto {
  @ApiProperty({ example: 'uuid-of-exercise' })
  @Matches(UUID_LIKE_REGEX, { message: 'exerciseId must be a valid UUID' })
  exerciseId: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  setNumber?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  reps?: number;

  @ApiPropertyOptional({ example: 80.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @ApiPropertyOptional({ example: 1000.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceMeters?: number;

  @ApiPropertyOptional({
    example: 8.5,
    description: 'Rate of perceived exertion (1-10)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rpe?: number;

  @ApiPropertyOptional({ example: 'Paused at bottom' })
  @IsOptional()
  @IsString()
  notes?: string;
}
