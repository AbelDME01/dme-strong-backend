import { PartialType } from '@nestjs/swagger';
import { CreateSetDto } from './create-set.dto';

export class UpdateSetDto extends PartialType(CreateSetDto) {}
