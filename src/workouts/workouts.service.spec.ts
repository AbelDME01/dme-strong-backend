import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { SupabaseService } from '../supabase/supabase.service';

const USER_ID = 'user-123';
const WORKOUT_ID = 'workout-abc';
const SET_ID = 'set-xyz';

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
  qb.then = jest.fn((resolve) => resolve({ data: [], error: null, count: 0 }));
  return qb;
};

describe('WorkoutsService', () => {
  let service: WorkoutsService;
  let adminClient: any;
  let queryBuilder: any;
  let supabaseServiceMock: any;

  beforeEach(async () => {
    queryBuilder = makeQueryBuilder();
    adminClient = {
      from: jest.fn().mockReturnValue(queryBuilder),
    };
    supabaseServiceMock = {
      getAdminClient: jest.fn().mockReturnValue(adminClient),
      getAnonClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        {
          provide: SupabaseService,
          useValue: supabaseServiceMock,
        },
      ],
    }).compile();

    service = module.get<WorkoutsService>(WorkoutsService);
  });

  // -----------------------------------------------------------------------
  // findAll
  // -----------------------------------------------------------------------
  describe('findAll', () => {
    it('returns paginated list with meta', async () => {
      const workout = { id: WORKOUT_ID, user_id: USER_ID };
      queryBuilder.then = jest.fn((resolve) =>
        resolve({ data: [workout], error: null, count: 1 }),
      );

      const result = await service.findAll(USER_ID, {});

      expect(result.data).toEqual([workout]);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('throws InternalServerErrorException on Supabase error', async () => {
      queryBuilder.then = jest.fn((resolve) =>
        resolve({ data: null, error: { message: 'DB error' }, count: null }),
      );

      await expect(service.findAll(USER_ID, {})).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // -----------------------------------------------------------------------
  // findOne
  // -----------------------------------------------------------------------
  describe('findOne', () => {
    it('returns workout with its sets', async () => {
      const workout = { id: WORKOUT_ID, user_id: USER_ID, name: 'Leg Day' };
      const sets = [{ id: SET_ID, workout_id: WORKOUT_ID }];

      // First maybeSingle: workout lookup
      queryBuilder.maybeSingle.mockResolvedValueOnce({ data: workout, error: null });
      // Second await: sets list (order resolves via then)
      queryBuilder.then = jest.fn((resolve) =>
        resolve({ data: sets, error: null }),
      );

      const result = await service.findOne(WORKOUT_ID, USER_ID);

      expect(result).toMatchObject({ id: WORKOUT_ID, sets });
    });

    it('throws NotFoundException when workout does not exist', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.findOne(WORKOUT_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws InternalServerErrorException on Supabase error', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      await expect(service.findOne(WORKOUT_ID, USER_ID)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('creates workout with correct fields', async () => {
      const created = { id: WORKOUT_ID, user_id: USER_ID, name: 'Push Day' };
      queryBuilder.single.mockResolvedValue({ data: created, error: null });

      const result = await service.create(USER_ID, { name: 'Push Day' });

      expect(queryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: USER_ID, name: 'Push Day' }),
      );
      expect(result).toEqual(created);
    });

    it('throws InternalServerErrorException on Supabase error', async () => {
      queryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'insert failed' },
      });

      await expect(service.create(USER_ID, { name: 'X' })).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('throws ForbiddenException when userId does not own the workout', async () => {
      // assertOwnership: maybeSingle returns different user_id
      queryBuilder.maybeSingle.mockResolvedValue({
        data: { id: WORKOUT_ID, user_id: 'other-user' },
        error: null,
      });

      await expect(
        service.update(WORKOUT_ID, USER_ID, { name: 'New' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when workout does not exist during update', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(
        service.update(WORKOUT_ID, USER_ID, { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates fields correctly when ownership is valid', async () => {
      const updated = { id: WORKOUT_ID, name: 'Updated' };

      // assertOwnership maybeSingle
      queryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: WORKOUT_ID, user_id: USER_ID },
        error: null,
      });
      // update single
      queryBuilder.single.mockResolvedValueOnce({ data: updated, error: null });

      const result = await service.update(WORKOUT_ID, USER_ID, { name: 'Updated' });

      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated' }),
      );
      expect(result).toEqual(updated);
    });
  });

  // -----------------------------------------------------------------------
  // addSet
  // -----------------------------------------------------------------------
  describe('addSet', () => {
    it('throws ForbiddenException when user does not own the workout', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({
        data: { id: WORKOUT_ID, user_id: 'other-user' },
        error: null,
      });

      await expect(
        service.addSet(WORKOUT_ID, USER_ID, { exerciseId: 'ex-1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('inserts set after verifying ownership', async () => {
      const newSet = { id: SET_ID, workout_id: WORKOUT_ID };

      queryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: WORKOUT_ID, user_id: USER_ID },
        error: null,
      });
      queryBuilder.single.mockResolvedValueOnce({ data: newSet, error: null });

      const result = await service.addSet(WORKOUT_ID, USER_ID, {
        exerciseId: 'ex-1',
        reps: 10,
        weightKg: 80,
      });

      expect(queryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          workout_id: WORKOUT_ID,
          exercise_id: 'ex-1',
          reps: 10,
          weight_kg: 80,
        }),
      );
      expect(result).toEqual(newSet);
    });
  });

  // -----------------------------------------------------------------------
  // removeSet
  // -----------------------------------------------------------------------
  describe('removeSet', () => {
    it('throws ForbiddenException when user does not own the workout', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({
        data: { id: WORKOUT_ID, user_id: 'other-user' },
        error: null,
      });

      await expect(
        service.removeSet(SET_ID, WORKOUT_ID, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deletes the set after verifying ownership', async () => {
      queryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: WORKOUT_ID, user_id: USER_ID },
        error: null,
      });
      // delete().eq().eq() resolves via then
      queryBuilder.then = jest.fn((resolve) => resolve({ error: null }));

      const result = await service.removeSet(SET_ID, WORKOUT_ID, USER_ID);

      expect(queryBuilder.delete).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Set deleted successfully' });
    });
  });
});
