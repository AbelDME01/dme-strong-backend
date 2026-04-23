import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseService } from '../supabase/supabase.service';

const USER_ID = 'user-123';

describe('AuthService', () => {
  let service: AuthService;
  let anonClient: any;
  let adminClient: any;

  beforeEach(async () => {
    anonClient = {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        refreshSession: jest.fn(),
      },
    };

    adminClient = {
      auth: {
        admin: {
          getUserById: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SupabaseService,
          useValue: {
            getAnonClient: jest.fn().mockReturnValue(anonClient),
            getAdminClient: jest.fn().mockReturnValue(adminClient),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // -----------------------------------------------------------------------
  // register
  // -----------------------------------------------------------------------
  describe('register', () => {
    it('calls supabase.auth.signUp with email, password and fullName', async () => {
      const mockData = { user: { id: USER_ID }, session: null };
      anonClient.auth.signUp.mockResolvedValue({ data: mockData, error: null });

      const dto = { email: 'test@test.com', password: 'pass123', fullName: 'Test User' };
      const result = await service.register(dto);

      expect(anonClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'pass123',
        options: { data: { full_name: 'Test User' } },
      });
      expect(result).toEqual(mockData);
    });

    it('throws BadRequestException on Supabase auth error', async () => {
      anonClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already registered' },
      });

      await expect(
        service.register({ email: 'test@test.com', password: 'pass123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -----------------------------------------------------------------------
  // login
  // -----------------------------------------------------------------------
  describe('login', () => {
    it('returns user and session on successful login', async () => {
      const user = { id: USER_ID, email: 'test@test.com' };
      const session = { access_token: 'token123' };
      anonClient.auth.signInWithPassword.mockResolvedValue({
        data: { user, session },
        error: null,
      });

      const result = await service.login({ email: 'test@test.com', password: 'pass123' });

      expect(result).toEqual({ user, session });
    });

    it('throws UnauthorizedException when Supabase returns an error', async () => {
      anonClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // -----------------------------------------------------------------------
  // getMe
  // -----------------------------------------------------------------------
  describe('getMe', () => {
    it('calls adminClient.auth.admin.getUserById and returns user', async () => {
      const user = { id: USER_ID, email: 'test@test.com' };
      adminClient.auth.admin.getUserById.mockResolvedValue({
        data: { user },
        error: null,
      });

      const result = await service.getMe(USER_ID);

      expect(adminClient.auth.admin.getUserById).toHaveBeenCalledWith(USER_ID);
      expect(result).toEqual(user);
    });

    it('throws InternalServerErrorException on Supabase error', async () => {
      adminClient.auth.admin.getUserById.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      await expect(service.getMe(USER_ID)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // -----------------------------------------------------------------------
  // refreshToken
  // -----------------------------------------------------------------------
  describe('refreshToken', () => {
    it('returns user and session on successful refresh', async () => {
      const user = { id: USER_ID };
      const session = { access_token: 'new-token' };
      anonClient.auth.refreshSession.mockResolvedValue({
        data: { user, session },
        error: null,
      });

      const result = await service.refreshToken('refresh-token-abc');

      expect(anonClient.auth.refreshSession).toHaveBeenCalledWith({
        refresh_token: 'refresh-token-abc',
      });
      expect(result).toEqual({ user, session });
    });

    it('throws UnauthorizedException on Supabase error', async () => {
      anonClient.auth.refreshSession.mockResolvedValue({
        data: null,
        error: { message: 'Token expired' },
      });

      await expect(service.refreshToken('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
