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
import { CreateSetDto } from './dto/create-set.dto';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { QueryWorkoutDto } from './dto/query-workout.dto';
import { UpdateSetDto } from './dto/update-set.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { WorkoutsService } from './workouts.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('workouts')
@ApiBearerAuth()
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get()
  @ApiOperation({ summary: 'List workout sessions with optional filters' })
  @ApiResponse({ status: 200, description: 'Paginated workout list' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryWorkoutDto) {
    return this.workoutsService.findAll(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workout with its sets' })
  @ApiResponse({ status: 200, description: 'Workout with sets' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.workoutsService.findOne(id, user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new workout session' })
  @ApiResponse({ status: 201, description: 'Workout created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkoutDto) {
    return this.workoutsService.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a workout (e.g. mark as finished)' })
  @ApiResponse({ status: 200, description: 'Workout updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkoutDto,
  ) {
    return this.workoutsService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workout and all its sets' })
  @ApiResponse({ status: 200, description: 'Workout deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.workoutsService.remove(id, user.userId);
  }

  @Post(':id/sets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a set to a workout' })
  @ApiResponse({ status: 201, description: 'Set added' })
  addSet(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) workoutId: string,
    @Body() dto: CreateSetDto,
  ) {
    return this.workoutsService.addSet(workoutId, user.userId, dto);
  }

  @Patch(':id/sets/:setId')
  @ApiOperation({ summary: 'Update a set within a workout' })
  @ApiResponse({ status: 200, description: 'Set updated' })
  updateSet(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) workoutId: string,
    @Param('setId', ParseUUIDPipe) setId: string,
    @Body() dto: UpdateSetDto,
  ) {
    return this.workoutsService.updateSet(setId, workoutId, user.userId, dto);
  }

  @Delete(':id/sets/:setId')
  @ApiOperation({ summary: 'Remove a set from a workout' })
  @ApiResponse({ status: 200, description: 'Set deleted' })
  removeSet(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) workoutId: string,
    @Param('setId', ParseUUIDPipe) setId: string,
  ) {
    return this.workoutsService.removeSet(setId, workoutId, user.userId);
  }
}
