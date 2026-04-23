import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { QueryRecordDto, UpsertRecordDto } from './dto/upsert-record.dto';

@Injectable()
export class RecordsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getAdminClient();
  }

  async findAll(userId: string, query: QueryRecordDto) {
    let q = this.client
      .from('records')
      .select('*, exercises(name, muscle_group)')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });

    if (query.exerciseId) q = q.eq('exercise_id', query.exerciseId);
    if (query.recordType) q = q.eq('record_type', query.recordType);

    const { data, error } = await q;
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await this.client
      .from('records')
      .select('*, exercises(name, muscle_group)')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Record not found');
    return data;
  }

  async upsert(userId: string, dto: UpsertRecordDto) {
    const { data, error } = await this.client
      .from('records')
      .upsert(
        {
          user_id: userId,
          exercise_id: dto.exerciseId,
          record_type: dto.recordType,
          value: dto.value,
          unit: dto.unit,
          achieved_at: dto.achievedAt ?? new Date().toISOString(),
          workout_id: dto.workoutId ?? null,
        },
        { onConflict: 'user_id,exercise_id,record_type' },
      )
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async remove(id: string, userId: string) {
    const { data: existing } = await this.client
      .from('records')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existing) throw new NotFoundException('Record not found');

    const { error } = await this.client.from('records').delete().eq('id', id);
    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Record deleted successfully' };
  }
}
