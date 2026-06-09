import { Test, TestingModule } from '@nestjs/testing';
import { MeasurementsController } from './measurements.controller';
import { MeasurementsService } from './measurements.service';
import {
  CreateMeasurementDto,
  QueryMeasurementDto,
  UpdateMeasurementDto,
} from './dto/measurement.dto';

const mockUser = {
  userId: 'user-123',
  email: 'test@dme.com',
  role: 'authenticated',
};
const MEASUREMENT_ID = 'measurement-abc';

const mockMeasurementsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('MeasurementsController', () => {
  let controller: MeasurementsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeasurementsController],
      providers: [
        { provide: MeasurementsService, useValue: mockMeasurementsService },
      ],
    }).compile();

    controller = module.get<MeasurementsController>(MeasurementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('calls service.findAll with userId and query', () => {
      const query: QueryMeasurementDto = {};
      const result = { data: [], total: 0 };
      mockMeasurementsService.findAll.mockReturnValue(result);

      expect(controller.findAll(mockUser, query)).toBe(result);
      expect(mockMeasurementsService.findAll).toHaveBeenCalledWith(
        'user-123',
        query,
      );
    });
  });

  describe('findOne', () => {
    it('calls service.findOne with id and userId', () => {
      const result = { id: MEASUREMENT_ID, weight_kg: 80.5 };
      mockMeasurementsService.findOne.mockReturnValue(result);

      expect(controller.findOne(mockUser, MEASUREMENT_ID)).toBe(result);
      expect(mockMeasurementsService.findOne).toHaveBeenCalledWith(
        MEASUREMENT_ID,
        'user-123',
      );
    });
  });

  describe('create', () => {
    it('calls service.create with userId and dto', () => {
      const dto: CreateMeasurementDto = {
        weightKg: 80.5,
        bodyFatPercentage: 18.0,
      };
      const result = { id: MEASUREMENT_ID, ...dto };
      mockMeasurementsService.create.mockReturnValue(result);

      expect(controller.create(mockUser, dto)).toBe(result);
      expect(mockMeasurementsService.create).toHaveBeenCalledWith(
        'user-123',
        dto,
      );
    });
  });

  describe('update', () => {
    it('calls service.update with id, userId and dto', () => {
      const dto: UpdateMeasurementDto = { weightKg: 79.0 };
      const result = { id: MEASUREMENT_ID, weight_kg: 79.0 };
      mockMeasurementsService.update.mockReturnValue(result);

      expect(controller.update(mockUser, MEASUREMENT_ID, dto)).toBe(result);
      expect(mockMeasurementsService.update).toHaveBeenCalledWith(
        MEASUREMENT_ID,
        'user-123',
        dto,
      );
    });
  });

  describe('remove', () => {
    it('calls service.remove with id and userId', () => {
      const result = { message: 'Measurement deleted' };
      mockMeasurementsService.remove.mockReturnValue(result);

      expect(controller.remove(mockUser, MEASUREMENT_ID)).toBe(result);
      expect(mockMeasurementsService.remove).toHaveBeenCalledWith(
        MEASUREMENT_ID,
        'user-123',
      );
    });
  });
});
