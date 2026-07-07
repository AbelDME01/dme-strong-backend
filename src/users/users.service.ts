import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getProfile(userId: string) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    // Auto-provision empty profile for new users so the frontend never gets a 404.
    if (!data) {
      const { data: created, error: createError } = await client
        .from('user_profiles')
        .insert({ user_id: userId })
        .select()
        .single();
      if (createError)
        throw new InternalServerErrorException(createError.message);
      return created;
    }

    return data;
  }

  async createOrUpdateProfile(userId: string, dto: UpdateProfileDto) {
    const client = this.supabaseService.getAdminClient();

    const payload: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (dto.fullName !== undefined) payload.full_name = dto.fullName;
    if (dto.avatarUrl !== undefined) payload.avatar_url = dto.avatarUrl;
    if (dto.heightCm !== undefined) payload.height_cm = dto.heightCm;
    if (dto.birthDate !== undefined) payload.birth_date = dto.birthDate;

    const { data, error } = await client
      .from('user_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }
}
