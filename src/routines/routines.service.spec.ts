import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { SupabaseService } from '../supabase/supabase.service';

const USER_ID = 'user-123';
const ROUTINE_ID = 'routine-abc';
const EXERCISE_ID = 'exercise-xyz';

const makeQueryBuilder = () => {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  };
  qb.then = jest.fn((resolve) => resolve({ data: [], error: null }));
  return qb;
};

describe('RoutinesService', () => {
  let service: RoutinesService;
  let adminClient: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = makeQueryBuilder();
    adminClient = { from: jest.fn().mockReturnValue(queryBuilder) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutinesService,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(adminClient),
            getAnonClient: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoutinesService>(RoutinesService);
  });

  describe('findAll', () => {
    it('returns routines with the exercises join for the user', async () => {
      const routines = [{ id: ROUTINE_ID, user_id: USER_ID }];
      queryBuilder.then = jest.fn((resolve) =>
        resolve({ data: routines, error: null }),
      );

      const result = await service.findAll(USER_ID);

      expect(adminClient.from).toHaveBeenCalledWith('routines');
      expect(queryBuilder.select).toHaveBeenCalledWith(
        '*, routine_exercises(*, exercise:exercises(*))',
      );
      expect(queryBuilder.eq).toHaveBeenCalledWith('user_id', USER_ID);
      expect(result).toEqual(routines);
    });

    it('throws InternalServerErrorException on Supabase error', async () => {
      queryBuilder.then = jest.fn((resolve) =>
        resolve({ data: null, error: { message: 'DB error' } }),
      );

      await expect(service.findAll(USER_ID)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when routine does not exist', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.findOne(ROUTINE_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the routine when it exists', async () => {
      const routine = {
        id: ROUTINE_ID,
        user_id: USER_ID,
        routine_exercises: [],
      };
      queryBuilder.maybeSingle.mockResolvedValue({
        data: routine,
        error: null,
      });

      const result = await service.findOne(ROUTINE_ID, USER_ID);
      expect(result).toEqual(routine);
    });
  });

  describe('create', () => {
    it('creates a routine without exercises and returns it via findOne', async () => {
      queryBuilder.single.mockResolvedValue({
        data: { id: ROUTINE_ID },
        error: null,
      });
      queryBuilder.maybeSingle.mockResolvedValue({
        data: { id: ROUTINE_ID, user_id: USER_ID, routine_exercises: [] },
        error: null,
      });

      const result = await service.create(USER_ID, { name: 'Push Day' });

      expect(queryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: USER_ID, name: 'Push Day' }),
      );
      expect(result).toMatchObject({ id: ROUTINE_ID });
    });

    it('inserts routine_exercises when exercises are provided', async () => {
      queryBuilder.single.mockResolvedValue({
        data: { id: ROUTINE_ID },
        error: null,
      });
      queryBuilder.maybeSingle.mockResolvedValue({
        data: { id: ROUTINE_ID, user_id: USER_ID },
        error: null,
      });
      // delete().eq() (clear existing) and insert() rows both resolve via then
      queryBuilder.then = jest.fn((resolve) => resolve({ error: null }));

      await service.create(USER_ID, {
        name: 'Push Day',
        exercises: [{ exerciseId: EXERCISE_ID, targetSets: 4, targetReps: 10 }],
      });

      expect(adminClient.from).toHaveBeenCalledWith('routine_exercises');
      const insertedRows = queryBuilder.insert.mock.calls
        .map((c: any[]) => c[0])
        .find((arg: any) => Array.isArray(arg));
      expect(insertedRows).toEqual([
        expect.objectContaining({
          routine_id: ROUTINE_ID,
          exercise_id: EXERCISE_ID,
          target_sets: 4,
          target_reps: 10,
          order_index: 0,
        }),
      ]);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when routine does not exist', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.remove(ROUTINE_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the routine when it exists', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({
        data: { id: ROUTINE_ID, user_id: USER_ID },
        error: null,
      });
      queryBuilder.then = jest.fn((resolve) => resolve({ error: null }));

      const result = await service.remove(ROUTINE_ID, USER_ID);

      expect(queryBuilder.delete).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Routine deleted' });
    });
  });
});
