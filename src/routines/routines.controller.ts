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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateRoutineDto, UpdateRoutineDto } from './dto/routine.dto';
import { RoutinesService } from './routines.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('routines')
@ApiBearerAuth()
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Get()
  @ApiOperation({ summary: 'List user routines' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.routinesService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a routine with exercises' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routinesService.findOne(id, user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a routine' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRoutineDto) {
    return this.routinesService.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a routine' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoutineDto,
  ) {
    return this.routinesService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a routine' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routinesService.remove(id, user.userId);
  }
}
