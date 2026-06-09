import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { SupabaseService } from '../supabase/supabase.service';

// UUID-shaped: findAll/findOne reject non-UUID userIds (filter injection guard)
const USER_ID = '11111111-2222-3333-4444-555555555555';
const EXERCISE_ID = 'exercise-abc';

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

describe('ExercisesService', () => {
  let service: ExercisesService;
  let adminClient: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = makeQueryBuilder();
    adminClient = {
      from: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExercisesService,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(adminClient),
            getAnonClient: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExercisesService>(ExercisesService);
  });

  // -----------------------------------------------------------------------
  // findAll
  // -----------------------------------------------------------------------
  describe('findAll', () => {
    it('returns a paginated list with meta', async () => {
      queryBuilder.then = jest.fn((resolve) =>
        resolve({ data: [{ id: EXERCISE_ID }], error: null, count: 1 }),
      );

      const result = await service.findAll(USER_ID, {});

      expect(result.data).toEqual([{ id: EXERCISE_ID }]);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(1);
    });

    it('applies muscleGroup filter', async () => {
      queryBuilder.then = jest.fn((resolve) =>
        resolve({ data: [], error: null, count: 0 }),
      );

      await service.findAll(USER_ID, { muscleGroup: 'chest' });

      expect(queryBuilder.eq).toHaveBeenCalledWith('muscle_group', 'chest');
    });

    it('applies search filter', async () => {
      queryBuilder.then = jest.fn((resolve) =>
        resolve({ data: [], error: null, count: 0 }),
      );

      await service.findAll(USER_ID, { search: 'bench' });

      expect(queryBuilder.ilike).toHaveBeenCalledWith('name', '%bench%');
    });

    it('throws InternalServerErrorException on Supabase error', async () => {
      queryBuilder.then = jest.fn((resolve) =>
        resolve({ data: null, error: { message: 'DB error' }, count: null }),
      );

      await expect(service.findAll(USER_ID, {})).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('rejects a non-UUID userId without querying the database', async () => {
      await expect(
        service.findAll('not-a-uuid,role.eq.admin', {}),
      ).rejects.toThrow(UnauthorizedException);

      expect(queryBuilder.or).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // findOne
  // -----------------------------------------------------------------------
  describe('findOne', () => {
    it('returns the exercise when found', async () => {
      const exercise = { id: EXERCISE_ID, name: 'Bench Press' };
      queryBuilder.maybeSingle.mockResolvedValue({
        data: exercise,
        error: null,
      });

      const result = await service.findOne(EXERCISE_ID, USER_ID);

      expect(result).toEqual(exercise);
    });

    it('throws NotFoundException when exercise does not exist', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.findOne(EXERCISE_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws InternalServerErrorException on Supabase error', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      await expect(service.findOne(EXERCISE_ID, USER_ID)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('rejects a non-UUID userId without querying the database', async () => {
      await expect(
        service.findOne(EXERCISE_ID, 'not-a-uuid,role.eq.admin'),
      ).rejects.toThrow(UnauthorizedException);

      expect(queryBuilder.or).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('inserts exercise with correctly mapped fields', async () => {
      const created = { id: EXERCISE_ID, name: 'Squat' };
      queryBuilder.single.mockResolvedValue({ data: created, error: null });

      const dto = { name: 'Squat', muscleGroup: 'legs' as any, isPublic: true };
      const result = await service.create(USER_ID, dto);

      expect(queryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Squat',
          muscle_group: 'legs',
          is_public: true,
          created_by: USER_ID,
        }),
      );
      expect(result).toEqual(created);
    });

    it('throws InternalServerErrorException on Supabase error', async () => {
      queryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'insert failed' },
      });

      await expect(
        service.create(USER_ID, { name: 'X', muscleGroup: 'legs' as any }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('throws ForbiddenException when userId is not the creator', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({
        data: { id: EXERCISE_ID, created_by: 'other-user' },
        error: null,
      });

      await expect(
        service.update(EXERCISE_ID, USER_ID, { name: 'New name' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when exercise does not exist', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(
        service.update(EXERCISE_ID, USER_ID, { name: 'New name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates the exercise when ownership is valid', async () => {
      const updated = { id: EXERCISE_ID, name: 'Updated' };

      // First call: ownership check (maybeSingle)
      queryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: EXERCISE_ID, created_by: USER_ID },
        error: null,
      });
      // Second call: update result (single)
      queryBuilder.single.mockResolvedValueOnce({ data: updated, error: null });

      const result = await service.update(EXERCISE_ID, USER_ID, {
        name: 'Updated',
      });

      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated' }),
      );
      expect(result).toEqual(updated);
    });
  });

  // -----------------------------------------------------------------------
  // remove
  // -----------------------------------------------------------------------
  describe('remove', () => {
    it('throws ForbiddenException when userId is not the creator', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({
        data: { id: EXERCISE_ID, created_by: 'other-user' },
        error: null,
      });

      await expect(service.remove(EXERCISE_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when exercise does not exist', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.remove(EXERCISE_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the exercise when ownership is valid', async () => {
      queryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: EXERCISE_ID, created_by: USER_ID },
        error: null,
      });
      // delete().eq('id', id) is awaited directly via the queryBuilder's then()
      queryBuilder.then = jest.fn((resolve) => resolve({ error: null }));

      const result = await service.remove(EXERCISE_ID, USER_ID);

      expect(queryBuilder.delete).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Exercise deleted successfully' });
    });
  });
});
