import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UUID_LIKE_REGEX } from '../common/utils/uuid.util';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { QueryExerciseDto } from './dto/query-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * The userId is interpolated into PostgREST filter syntax, so it must be
   * UUID-shaped to prevent filter injection (defense in depth — the value
   * comes from a validated JWT claim).
   */
  private buildVisibilityFilter(userId: string): string {
    if (!UUID_LIKE_REGEX.test(userId)) {
      throw new UnauthorizedException('Invalid user identifier');
    }
    return `is_public.eq.true,created_by.eq.${userId}`;
  }

  async findAll(userId: string, query: QueryExerciseDto) {
    const client = this.supabaseService.getAdminClient();
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = client
      .from('exercises')
      .select('*', { count: 'exact' })
      .or(this.buildVisibilityFilter(userId))
      .range(from, to)
      .order('created_at', { ascending: false });

    if (query.muscleGroup) {
      q = q.eq('muscle_group', query.muscleGroup);
    }

    if (query.equipment) {
      q = q.eq('equipment', query.equipment);
    }

    if (query.search) {
      q = q.ilike('name', `%${query.search}%`);
    }

    const { data, error, count } = await q;

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

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
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('exercises')
      .select('*')
      .eq('id', id)
      .or(this.buildVisibilityFilter(userId))
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException('Exercise not found');
    }

    return data;
  }

  async create(userId: string, dto: CreateExerciseDto) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('exercises')
      .insert({
        name: dto.name,
        description: dto.description ?? null,
        muscle_group: dto.muscleGroup,
        equipment: dto.equipment ?? null,
        is_public: dto.isPublic ?? true,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async update(id: string, userId: string, dto: UpdateExerciseDto) {
    const client = this.supabaseService.getAdminClient();

    // Verify ownership
    const { data: existing, error: fetchError } = await client
      .from('exercises')
      .select('id, created_by')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      throw new InternalServerErrorException(fetchError.message);
    }

    if (!existing) {
      throw new NotFoundException('Exercise not found');
    }

    if (existing.created_by !== userId) {
      throw new ForbiddenException('You can only update your own exercises');
    }

    const payload: Record<string, unknown> = {};
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.muscleGroup !== undefined) payload.muscle_group = dto.muscleGroup;
    if (dto.equipment !== undefined) payload.equipment = dto.equipment;
    if (dto.isPublic !== undefined) payload.is_public = dto.isPublic;

    const { data, error } = await client
      .from('exercises')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async remove(id: string, userId: string) {
    const client = this.supabaseService.getAdminClient();

    // Verify ownership
    const { data: existing, error: fetchError } = await client
      .from('exercises')
      .select('id, created_by')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      throw new InternalServerErrorException(fetchError.message);
    }

    if (!existing) {
      throw new NotFoundException('Exercise not found');
    }

    if (existing.created_by !== userId) {
      throw new ForbiddenException('You can only delete your own exercises');
    }

    const { error } = await client.from('exercises').delete().eq('id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { message: 'Exercise deleted successfully' };
  }
}
