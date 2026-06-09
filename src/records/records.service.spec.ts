import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RecordsService } from './records.service';
import { SupabaseService } from '../supabase/supabase.service';

const USER_ID = 'user-123';
const RECORD_ID = 'record-abc';
const EXERCISE_ID = 'exercise-xyz';

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
  // Allow the query builder itself to be awaited (for findAll pattern)
  qb.then = jest.fn((resolve) => resolve({ data: [], error: null }));
  return qb;
};

describe('RecordsService', () => {
  let service: RecordsService;
  let adminClient: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = makeQueryBuilder();
    adminClient = {
      from: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordsService,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(adminClient),
            getAnonClient: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecordsService>(RecordsService);
  });

  // -----------------------------------------------------------------------
  // findAll
  // -----------------------------------------------------------------------
  describe('findAll', () => {
    it('returns records for the user with exercise joins', async () => {
      const records = [
        {
          id: RECORD_ID,
          user_id: USER_ID,
          exercises: { name: 'Bench', muscle_group: 'chest' },
        },
      ];
      queryBuilder.then = jest.fn((resolve) =>
        resolve({ data: records, error: null }),
      );

      const result = await service.findAll(USER_ID, {});

      expect(adminClient.from).toHaveBeenCalledWith('records');
      expect(queryBuilder.select).toHaveBeenCalledWith(
        '*, exercises(name, muscle_group)',
      );
      expect(queryBuilder.eq).toHaveBeenCalledWith('user_id', USER_ID);
      expect(result).toEqual(records);
    });

    it('applies exerciseId filter when provided', async () => {
      queryBuilder.then = jest.fn((resolve) =>
        resolve({ data: [], error: null }),
      );

      await service.findAll(USER_ID, { exerciseId: EXERCISE_ID });

      expect(queryBuilder.eq).toHaveBeenCalledWith('exercise_id', EXERCISE_ID);
    });

    it('throws InternalServerErrorException on Supabase error', async () => {
      queryBuilder.then = jest.fn((resolve) =>
        resolve({ data: null, error: { message: 'DB error' } }),
      );

      await expect(service.findAll(USER_ID, {})).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // -----------------------------------------------------------------------
  // upsert
  // -----------------------------------------------------------------------
  describe('upsert', () => {
    it('upserts with correct onConflict and fields', async () => {
      const record = { id: RECORD_ID, user_id: USER_ID };
      queryBuilder.single.mockResolvedValue({ data: record, error: null });

      const dto = {
        exerciseId: EXERCISE_ID,
        recordType: 'max_weight' as any,
        value: 100,
        unit: 'kg',
      };

      const result = await service.upsert(USER_ID, dto);

      expect(queryBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: USER_ID,
          exercise_id: EXERCISE_ID,
          record_type: 'max_weight',
          value: 100,
          unit: 'kg',
        }),
        { onConflict: 'user_id,exercise_id,record_type' },
      );
      expect(result).toEqual(record);
    });

    it('throws InternalServerErrorException on Supabase error', async () => {
      queryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'upsert failed' },
      });

      await expect(
        service.upsert(USER_ID, {
          exerciseId: EXERCISE_ID,
          recordType: 'max_weight' as any,
          value: 100,
          unit: 'kg',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // -----------------------------------------------------------------------
  // remove
  // -----------------------------------------------------------------------
  describe('remove', () => {
    it('throws NotFoundException when record does not exist', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.remove(RECORD_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes record when it exists', async () => {
      queryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: RECORD_ID },
        error: null,
      });
      // delete().eq() resolved via then
      queryBuilder.then = jest.fn((resolve) => resolve({ error: null }));

      const result = await service.remove(RECORD_ID, USER_ID);

      expect(queryBuilder.delete).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Record deleted successfully' });
    });

    it('throws InternalServerErrorException on Supabase delete error', async () => {
      queryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: RECORD_ID },
        error: null,
      });
      queryBuilder.then = jest.fn((resolve) =>
        resolve({ error: { message: 'delete failed' } }),
      );

      await expect(service.remove(RECORD_ID, USER_ID)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
