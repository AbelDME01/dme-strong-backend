import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { RoutinesController } from './routines.controller';
import { RoutinesService } from './routines.service';

@Module({
  imports: [SupabaseModule],
  controllers: [RoutinesController],
  providers: [RoutinesService],
})
export class RoutinesModule {}
