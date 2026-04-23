import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { QueryExerciseDto } from './dto/query-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExercisesService } from './exercises.service';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('exercises')
@ApiBearerAuth()
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  @ApiOperation({ summary: 'List exercises (public + own), with optional filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of exercises' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryExerciseDto,
  ) {
    return this.exercisesService.findAll(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single exercise by ID' })
  @ApiResponse({ status: 200, description: 'Exercise returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.exercisesService.findOne(id, user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new exercise' })
  @ApiResponse({ status: 201, description: 'Exercise created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExerciseDto,
  ) {
    return this.exercisesService.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an exercise (creator only)' })
  @ApiResponse({ status: 200, description: 'Exercise updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the creator' })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExerciseDto,
  ) {
    return this.exercisesService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an exercise (creator only)' })
  @ApiResponse({ status: 200, description: 'Exercise deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the creator' })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.exercisesService.remove(id, user.userId);
  }
}
