import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateSetDto } from './dto/create-set.dto';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { QueryWorkoutDto } from './dto/query-workout.dto';
import { UpdateSetDto } from './dto/update-set.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';

@Injectable()
export class WorkoutsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getAdminClient();
  }

  async findAll(userId: string, query: QueryWorkoutDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = this.client
      .from('workouts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .range(from, to);

    if (query.routineId) q = q.eq('routine_id', query.routineId);
    if (query.from) q = q.gte('started_at', query.from);
    if (query.to) q = q.lte('started_at', query.to);

    const { data, error, count } = await q;
    if (error) throw new InternalServerErrorException(error.message);

    return {
      data,
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const { data: workout, error } = await this.client
      .from('workouts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!workout) throw new NotFoundException('Workout not found');

    const { data: sets, error: setsError } = await this.client
      .from('workout_sets')
      .select('*, exercise:exercises(id, name, muscle_group)')
      .eq('workout_id', id)
      .order('set_number', { ascending: true });

    if (setsError) throw new InternalServerErrorException(setsError.message);

    // Align with the frontend Workout model and DB table name (`workout_sets`).
    return { ...workout, workout_sets: sets ?? [] };
  }

  async create(userId: string, dto: CreateWorkoutDto) {
    const { data, error } = await this.client
      .from('workouts')
      .insert({
        user_id: userId,
        name: dto.name,
        notes: dto.notes ?? null,
        routine_id: dto.routineId ?? null,
        started_at: dto.startedAt ?? new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async update(id: string, userId: string, dto: UpdateWorkoutDto) {
    await this.assertOwnership(id, userId);

    const payload: Record<string, unknown> = {};
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.notes !== undefined) payload.notes = dto.notes;
    if (dto.finishedAt !== undefined) payload.finished_at = dto.finishedAt;
    if (dto.durationSeconds !== undefined)
      payload.duration_seconds = dto.durationSeconds;

    const { data, error } = await this.client
      .from('workouts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async remove(id: string, userId: string) {
    await this.assertOwnership(id, userId);
    const { error } = await this.client.from('workouts').delete().eq('id', id);
    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Workout deleted successfully' };
  }

  async addSet(workoutId: string, userId: string, dto: CreateSetDto) {
    await this.assertOwnership(workoutId, userId);

    const { data, error } = await this.client
      .from('workout_sets')
      .insert({
        workout_id: workoutId,
        exercise_id: dto.exerciseId,
        set_number: dto.setNumber ?? 1,
        reps: dto.reps ?? null,
        weight_kg: dto.weightKg ?? null,
        duration_seconds: dto.durationSeconds ?? null,
        distance_meters: dto.distanceMeters ?? null,
        rpe: dto.rpe ?? null,
        notes: dto.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async updateSet(
    setId: string,
    workoutId: string,
    userId: string,
    dto: UpdateSetDto,
  ) {
    await this.assertOwnership(workoutId, userId);

    const payload: Record<string, unknown> = {};
    if (dto.reps !== undefined) payload.reps = dto.reps;
    if (dto.weightKg !== undefined) payload.weight_kg = dto.weightKg;
    if (dto.durationSeconds !== undefined)
      payload.duration_seconds = dto.durationSeconds;
    if (dto.distanceMeters !== undefined)
      payload.distance_meters = dto.distanceMeters;
    if (dto.rpe !== undefined) payload.rpe = dto.rpe;
    if (dto.notes !== undefined) payload.notes = dto.notes;
    if (dto.setNumber !== undefined) payload.set_number = dto.setNumber;

    const { data, error } = await this.client
      .from('workout_sets')
      .update(payload)
      .eq('id', setId)
      .eq('workout_id', workoutId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Set not found');
    return data;
  }

  async removeSet(setId: string, workoutId: string, userId: string) {
    await this.assertOwnership(workoutId, userId);
    const { error } = await this.client
      .from('workout_sets')
      .delete()
      .eq('id', setId)
      .eq('workout_id', workoutId);

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Set deleted successfully' };
  }

  private async assertOwnership(workoutId: string, userId: string) {
    const { data, error } = await this.client
      .from('workouts')
      .select('id, user_id')
      .eq('id', workoutId)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Workout not found');
    if (data.user_id !== userId) throw new ForbiddenException('Access denied');
  }
}
