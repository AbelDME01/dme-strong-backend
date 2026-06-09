import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { QueryRecordDto, UpsertRecordDto } from './dto/upsert-record.dto';
import { RecordsService } from './records.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@ApiTags('records')
@ApiBearerAuth()
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all personal records for the current user' })
  @ApiResponse({ status: 200, description: 'List of personal records' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryRecordDto) {
    return this.recordsService.findAll(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single personal record' })
  @ApiResponse({ status: 200, description: 'Record found' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recordsService.findOne(id, user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create or update a personal record (upsert by exercise + type)',
  })
  @ApiResponse({ status: 200, description: 'Record upserted' })
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertRecordDto) {
    return this.recordsService.upsert(user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a personal record' })
  @ApiResponse({ status: 200, description: 'Record deleted' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recordsService.remove(id, user.userId);
  }
}
