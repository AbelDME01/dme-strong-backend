import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateRoutineDto,
  RoutineExerciseInputDto,
  UpdateRoutineDto,
} from './dto/routine.dto';

@Injectable()
export class RoutinesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getAdminClient();
  }

  private mapExerciseRows(
    routineId: string,
    exercises: RoutineExerciseInputDto[],
  ) {
    return exercises.map((ex, index) => ({
      routine_id: routineId,
      exercise_id: ex.exerciseId,
      order_index: ex.orderIndex ?? index,
      target_sets: ex.targetSets ?? null,
      target_reps: ex.targetReps ?? null,
      target_weight: ex.targetWeight ?? null,
      rest_seconds: ex.restSeconds ?? null,
    }));
  }

  private async replaceExercises(
    routineId: string,
    exercises: RoutineExerciseInputDto[],
  ) {
    const { error: deleteError } = await this.client
      .from('routine_exercises')
      .delete()
      .eq('routine_id', routineId);
    if (deleteError)
      throw new InternalServerErrorException(deleteError.message);

    if (exercises.length === 0) return;

    const { error: insertError } = await this.client
      .from('routine_exercises')
      .insert(this.mapExerciseRows(routineId, exercises));
    if (insertError)
      throw new InternalServerErrorException(insertError.message);
  }

  async findAll(userId: string) {
    const { data, error } = await this.client
      .from('routines')
      .select('*, routine_exercises(*, exercise:exercises(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await this.client
      .from('routines')
      .select('*, routine_exercises(*, exercise:exercises(*))')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Routine not found');
    return data;
  }

  async create(userId: string, dto: CreateRoutineDto) {
    const { data, error } = await this.client
      .from('routines')
      .insert({
        user_id: userId,
        name: dto.name,
        description: dto.description ?? null,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    if (dto.exercises && dto.exercises.length > 0) {
      await this.replaceExercises(data.id, dto.exercises);
    }

    return this.findOne(data.id, userId);
  }

  async update(id: string, userId: string, dto: UpdateRoutineDto) {
    const routine = await this.findOne(id, userId);
    if (routine.user_id !== userId) throw new ForbiddenException();

    const { exercises, ...routineFields } = dto;

    if (Object.keys(routineFields).length > 0) {
      const { error } = await this.client
        .from('routines')
        .update({ ...routineFields, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new InternalServerErrorException(error.message);
    }

    if (exercises !== undefined) {
      await this.replaceExercises(id, exercises);
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    const routine = await this.findOne(id, userId);
    if (routine.user_id !== userId) throw new ForbiddenException();

    const { error } = await this.client.from('routines').delete().eq('id', id);
    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Routine deleted' };
  }
}
