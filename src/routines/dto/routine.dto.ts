import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { UUID_LIKE_REGEX } from '../../common/utils/uuid.util';

export class RoutineExerciseInputDto {
  @ApiProperty({ example: 'uuid-of-exercise' })
  @Matches(UUID_LIKE_REGEX, { message: 'exerciseId must be a valid UUID' })
  exerciseId: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  targetSets?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  targetReps?: number;

  @ApiPropertyOptional({ example: 80.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetWeight?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsInt()
  @Min(0)
  restSeconds?: number;
}

export class CreateRoutineDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ type: [RoutineExerciseInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutineExerciseInputDto)
  exercises?: RoutineExerciseInputDto[];
}

export class UpdateRoutineDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    type: [RoutineExerciseInputDto],
    description:
      'When provided, replaces the full list of exercises for the routine.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutineExerciseInputDto)
  exercises?: RoutineExerciseInputDto[];
}
