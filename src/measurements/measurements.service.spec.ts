import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MeasurementsService } from './measurements.service';
import { SupabaseService } from '../supabase/supabase.service';

const USER_ID = 'user-123';
const MEASUREMENT_ID = 'measurement-abc';

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
  qb.then = jest.fn((resolve) => resolve({ data: [], error: null, count: 0 }));
  return qb;
};

describe('MeasurementsService', () => {
  let service: MeasurementsService;
  let adminClient: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = makeQueryBuilder();
    adminClient = {
      from: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeasurementsService,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(adminClient),
            getAnonClient: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MeasurementsService>(MeasurementsService);
  });

  // -----------------------------------------------------------------------
  // findAll
  // -----------------------------------------------------------------------
  describe('findAll', () => {
    it('returns paginated measurements ordered by date DESC', async () => {
      const measurements = [
        { id: MEASUREMENT_ID, user_id: USER_ID, measured_at: '2024-01-01' },
      ];
      queryBuilder.then = jest.fn((resolve) =>
        resolve({ data: measurements, error: null, count: 1 }),
      );

      const result = await service.findAll(USER_ID, {});

      expect(adminClient.from).toHaveBeenCalledWith('measurements');
      expect(queryBuilder.order).toHaveBeenCalledWith('measured_at', {
        ascending: false,
      });
      expect(result.data).toEqual(measurements);
      expect(result.meta.total).toBe(1);
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
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('maps camelCase DTO to snake_case DB fields', async () => {
      const created = { id: MEASUREMENT_ID, user_id: USER_ID };
      queryBuilder.single.mockResolvedValue({ data: created, error: null });

      const dto = {
        weightKg: 75.5,
        bodyFatPercentage: 15.2,
        muscleMassKg: 60,
        chestCm: 100,
        waistCm: 80,
        hipsCm: 95,
        armCm: 35,
        thighCm: 55,
        notes: 'Morning measurement',
      };

      const result = await service.create(USER_ID, dto);

      expect(queryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: USER_ID,
          weight_kg: 75.5,
          body_fat_percentage: 15.2,
          muscle_mass_kg: 60,
          chest_cm: 100,
          waist_cm: 80,
          hips_cm: 95,
          arm_cm: 35,
          thigh_cm: 55,
          notes: 'Morning measurement',
        }),
      );
      expect(result).toEqual(created);
    });

    it('throws InternalServerErrorException on Supabase error', async () => {
      queryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'insert failed' },
      });

      await expect(service.create(USER_ID, { weightKg: 70 })).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('throws NotFoundException when measurement does not exist', async () => {
      // assertOwnership maybeSingle returns null
      queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(
        service.update(MEASUREMENT_ID, USER_ID, { weightKg: 80 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates only defined fields', async () => {
      const updated = { id: MEASUREMENT_ID, weight_kg: 80 };

      // assertOwnership
      queryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: MEASUREMENT_ID },
        error: null,
      });
      queryBuilder.single.mockResolvedValueOnce({ data: updated, error: null });

      const result = await service.update(MEASUREMENT_ID, USER_ID, {
        weightKg: 80,
      });

      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ weight_kg: 80 }),
      );
      expect(result).toEqual(updated);
    });

    it('throws InternalServerErrorException on assertOwnership error', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      await expect(
        service.update(MEASUREMENT_ID, USER_ID, { weightKg: 80 }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // -----------------------------------------------------------------------
  // remove
  // -----------------------------------------------------------------------
  describe('remove', () => {
    it('throws NotFoundException when measurement does not exist', async () => {
      queryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.remove(MEASUREMENT_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the measurement when it exists', async () => {
      queryBuilder.maybeSingle.mockResolvedValueOnce({
        data: { id: MEASUREMENT_ID },
        error: null,
      });
      queryBuilder.then = jest.fn((resolve) => resolve({ error: null }));

      const result = await service.remove(MEASUREMENT_ID, USER_ID);

      expect(queryBuilder.delete).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Measurement deleted successfully' });
    });
  });
});
