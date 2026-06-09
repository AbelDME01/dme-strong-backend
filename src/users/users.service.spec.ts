import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseService } from '../supabase/supabase.service';

const USER_ID = 'user-123';

const makeQueryBuilder = () => {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  };
  qb.then = jest.fn((resolve) => resolve({ data: null, error: null }));
  return qb;
};

describe('UsersService', () => {
  let service: UsersService;
  let adminClient: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = makeQueryBuilder();
    adminClient = {
      from: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(adminClient),
            getAnonClient: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // -----------------------------------------------------------------------
  // getProfile
  // -----------------------------------------------------------------------
  describe('getProfile', () => {
    it('returns the user profile when found', async () => {
      const profile = { user_id: USER_ID, full_name: 'Test User' };
      queryBuilder.maybeSingle.mockResolvedValue({
        data: profile,
        error: null,
      });

      const result = await service.getProfile(USER_ID);

      expect(adminClient.from).toHaveBeenCalledWith('user_profiles');
      expect(queryBuilder.eq).toHaveBeenCalledWith('user_id', USER_ID);
      expect(result).toEqual(profile);
    });

    it('throws NotFoundException when profile does not exist', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.getProfile(USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws InternalServerErrorException on Supabase error', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      await expect(service.getProfile(USER_ID)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // -----------------------------------------------------------------------
  // createOrUpdateProfile
  // -----------------------------------------------------------------------
  describe('createOrUpdateProfile', () => {
    it('upserts profile with correctly mapped fields', async () => {
      const profile = { user_id: USER_ID, full_name: 'Test User' };
      queryBuilder.single.mockResolvedValue({ data: profile, error: null });

      const dto = {
        fullName: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
        heightCm: 180,
        birthDate: '1990-01-01',
      };

      const result = await service.createOrUpdateProfile(USER_ID, dto);

      expect(queryBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: USER_ID,
          full_name: 'Test User',
          avatar_url: 'https://example.com/avatar.png',
          height_cm: 180,
          birth_date: '1990-01-01',
        }),
        { onConflict: 'user_id' },
      );
      expect(result).toEqual(profile);
    });

    it('does not include undefined fields in the upsert payload', async () => {
      const profile = { user_id: USER_ID };
      queryBuilder.single.mockResolvedValue({ data: profile, error: null });

      await service.createOrUpdateProfile(USER_ID, { fullName: 'Only Name' });

      const upsertCall = queryBuilder.upsert.mock.calls[0][0];
      expect(upsertCall).toHaveProperty('full_name', 'Only Name');
      expect(upsertCall).not.toHaveProperty('avatar_url');
      expect(upsertCall).not.toHaveProperty('height_cm');
      expect(upsertCall).not.toHaveProperty('birth_date');
    });

    it('throws InternalServerErrorException on Supabase error', async () => {
      queryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'upsert failed' },
      });

      await expect(
        service.createOrUpdateProfile(USER_ID, { fullName: 'Name' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
