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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateMeasurementDto,
  QueryMeasurementDto,
  UpdateMeasurementDto,
} from './dto/measurement.dto';
import { MeasurementsService } from './measurements.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('measurements')
@ApiBearerAuth()
@Controller('measurements')
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  @Get()
  @ApiOperation({ summary: 'List body measurements (paginated, newest first)' })
  @ApiResponse({ status: 200, description: 'Paginated measurement list' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryMeasurementDto) {
    return this.measurementsService.findAll(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single measurement entry' })
  @ApiResponse({ status: 200, description: 'Measurement found' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.measurementsService.findOne(id, user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Log a new body measurement' })
  @ApiResponse({ status: 201, description: 'Measurement created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMeasurementDto) {
    return this.measurementsService.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a measurement entry' })
  @ApiResponse({ status: 200, description: 'Measurement updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeasurementDto,
  ) {
    return this.measurementsService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a measurement entry' })
  @ApiResponse({ status: 200, description: 'Measurement deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.measurementsService.remove(id, user.userId);
  }
}
