import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { throwIfUpstreamUnavailable } from '../common/utils/supabase-error.util';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async register(dto: RegisterDto) {
    const client = this.supabaseService.getAnonClient();
    const { data, error } = await client.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          full_name: dto.fullName ?? '',
        },
      },
    });

    if (error) {
      throwIfUpstreamUnavailable(error);
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async login(dto: LoginDto) {
    const client = this.supabaseService.getAnonClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throwIfUpstreamUnavailable(error);
      throw new UnauthorizedException(error.message);
    }

    return { user: data.user, session: data.session };
  }

  async getMe(userId: string) {
    const adminClient = this.supabaseService.getAdminClient();
    const { data, error } = await adminClient.auth.admin.getUserById(userId);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data.user;
  }

  async refreshToken(refreshToken: string) {
    const client = this.supabaseService.getAnonClient();
    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throwIfUpstreamUnavailable(error);
      throw new UnauthorizedException(error.message);
    }

    return { user: data.user, session: data.session };
  }
}
