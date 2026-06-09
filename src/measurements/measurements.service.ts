import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateMeasurementDto,
  QueryMeasurementDto,
  UpdateMeasurementDto,
} from './dto/measurement.dto';

@Injectable()
export class MeasurementsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getAdminClient();
  }

  async findAll(userId: string, query: QueryMeasurementDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = this.client
      .from('measurements')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .range(from, to);

    if (query.from) q = q.gte('measured_at', query.from);
    if (query.to) q = q.lte('measured_at', query.to);

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
    const { data, error } = await this.client
      .from('measurements')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Measurement not found');
    return data;
  }

  async create(userId: string, dto: CreateMeasurementDto) {
    const { data, error } = await this.client
      .from('measurements')
      .insert({
        user_id: userId,
        measured_at: dto.measuredAt ?? new Date().toISOString(),
        weight_kg: dto.weightKg ?? null,
        body_fat_percentage: dto.bodyFatPercentage ?? null,
        muscle_mass_kg: dto.muscleMassKg ?? null,
        chest_cm: dto.chestCm ?? null,
        waist_cm: dto.waistCm ?? null,
        hips_cm: dto.hipsCm ?? null,
        arm_cm: dto.armCm ?? null,
        thigh_cm: dto.thighCm ?? null,
        notes: dto.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async update(id: string, userId: string, dto: UpdateMeasurementDto) {
    await this.assertOwnership(id, userId);

    const payload: Record<string, unknown> = {};
    if (dto.measuredAt !== undefined) payload.measured_at = dto.measuredAt;
    if (dto.weightKg !== undefined) payload.weight_kg = dto.weightKg;
    if (dto.bodyFatPercentage !== undefined)
      payload.body_fat_percentage = dto.bodyFatPercentage;
    if (dto.muscleMassKg !== undefined)
      payload.muscle_mass_kg = dto.muscleMassKg;
    if (dto.chestCm !== undefined) payload.chest_cm = dto.chestCm;
    if (dto.waistCm !== undefined) payload.waist_cm = dto.waistCm;
    if (dto.hipsCm !== undefined) payload.hips_cm = dto.hipsCm;
    if (dto.armCm !== undefined) payload.arm_cm = dto.armCm;
    if (dto.thighCm !== undefined) payload.thigh_cm = dto.thighCm;
    if (dto.notes !== undefined) payload.notes = dto.notes;

    const { data, error } = await this.client
      .from('measurements')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async remove(id: string, userId: string) {
    await this.assertOwnership(id, userId);
    const { error } = await this.client
      .from('measurements')
      .delete()
      .eq('id', id);
    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Measurement deleted successfully' };
  }

  private async assertOwnership(id: string, userId: string) {
    const { data, error } = await this.client
      .from('measurements')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Measurement not found');
  }
}
