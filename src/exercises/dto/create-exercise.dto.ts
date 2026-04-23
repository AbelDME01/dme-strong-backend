import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'other'] as const;
const EQUIPMENT_TYPES = ['barbell', 'dumbbell', 'machine', 'bodyweight', 'cable', 'other'] as const;

export class CreateExerciseDto {
  @ApiProperty({ example: 'Bench Press' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Classic chest compound movement' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: MUSCLE_GROUPS, example: 'chest' })
  @IsNotEmpty()
  @IsIn(MUSCLE_GROUPS)
  muscleGroup: string;

  @ApiPropertyOptional({ enum: EQUIPMENT_TYPES, example: 'barbell' })
  @IsOptional()
  @IsIn(EQUIPMENT_TYPES)
  equipment?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
