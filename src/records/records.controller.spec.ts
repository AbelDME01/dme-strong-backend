import { Test, TestingModule } from '@nestjs/testing';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { QueryRecordDto, UpsertRecordDto } from './dto/upsert-record.dto';

const mockUser = {
  userId: 'user-123',
  email: 'test@dme.com',
  role: 'authenticated',
};
const RECORD_ID = 'record-abc';

const mockRecordsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  upsert: jest.fn(),
  remove: jest.fn(),
};

describe('RecordsController', () => {
  let controller: RecordsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordsController],
      providers: [{ provide: RecordsService, useValue: mockRecordsService }],
    }).compile();

    controller = module.get<RecordsController>(RecordsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('calls service.findAll with userId and query', () => {
      const query: QueryRecordDto = {};
      const result = { data: [], total: 0 };
      mockRecordsService.findAll.mockReturnValue(result);

      expect(controller.findAll(mockUser, query)).toBe(result);
      expect(mockRecordsService.findAll).toHaveBeenCalledWith(
        'user-123',
        query,
      );
    });
  });

  describe('findOne', () => {
    it('calls service.findOne with id and userId', () => {
      const result = { id: RECORD_ID, value: 100 };
      mockRecordsService.findOne.mockReturnValue(result);

      expect(controller.findOne(mockUser, RECORD_ID)).toBe(result);
      expect(mockRecordsService.findOne).toHaveBeenCalledWith(
        RECORD_ID,
        'user-123',
      );
    });
  });

  describe('upsert', () => {
    it('calls service.upsert with userId and dto', () => {
      const dto: UpsertRecordDto = {
        exerciseId: 'ex-uuid',
        recordType: 'max_weight',
        value: 100,
        unit: 'kg',
        achievedAt: '2026-05-01T00:00:00Z',
      };
      const result = { id: RECORD_ID, ...dto };
      mockRecordsService.upsert.mockReturnValue(result);

      expect(controller.upsert(mockUser, dto)).toBe(result);
      expect(mockRecordsService.upsert).toHaveBeenCalledWith('user-123', dto);
    });
  });

  describe('remove', () => {
    it('calls service.remove with id and userId', () => {
      const result = { message: 'Record deleted' };
      mockRecordsService.remove.mockReturnValue(result);

      expect(controller.remove(mockUser, RECORD_ID)).toBe(result);
      expect(mockRecordsService.remove).toHaveBeenCalledWith(
        RECORD_ID,
        'user-123',
      );
    });
  });
});
