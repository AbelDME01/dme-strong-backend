import { Test, TestingModule } from '@nestjs/testing';
import { RoutinesController } from './routines.controller';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto, UpdateRoutineDto } from './dto/routine.dto';

const mockUser = {
  userId: 'user-123',
  email: 'test@dme.com',
  role: 'authenticated',
};
const ROUTINE_ID = 'routine-abc';

const mockRoutinesService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('RoutinesController', () => {
  let controller: RoutinesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoutinesController],
      providers: [{ provide: RoutinesService, useValue: mockRoutinesService }],
    }).compile();

    controller = module.get<RoutinesController>(RoutinesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll calls service with userId', () => {
    const result = [{ id: ROUTINE_ID }];
    mockRoutinesService.findAll.mockReturnValue(result);
    expect(controller.findAll(mockUser)).toBe(result);
    expect(mockRoutinesService.findAll).toHaveBeenCalledWith('user-123');
  });

  it('findOne calls service with id and userId', () => {
    const result = { id: ROUTINE_ID };
    mockRoutinesService.findOne.mockReturnValue(result);
    expect(controller.findOne(mockUser, ROUTINE_ID)).toBe(result);
    expect(mockRoutinesService.findOne).toHaveBeenCalledWith(
      ROUTINE_ID,
      'user-123',
    );
  });

  it('create passes the dto (including exercises) to the service', () => {
    const dto: CreateRoutineDto = {
      name: 'Push Day',
      exercises: [{ exerciseId: 'ex-uuid', targetSets: 4, targetReps: 10 }],
    };
    const result = { id: ROUTINE_ID, ...dto };
    mockRoutinesService.create.mockReturnValue(result);
    expect(controller.create(mockUser, dto)).toBe(result);
    expect(mockRoutinesService.create).toHaveBeenCalledWith('user-123', dto);
  });

  it('update passes the dto to the service', () => {
    const dto: UpdateRoutineDto = { name: 'Push v2' };
    const result = { id: ROUTINE_ID, ...dto };
    mockRoutinesService.update.mockReturnValue(result);
    expect(controller.update(mockUser, ROUTINE_ID, dto)).toBe(result);
    expect(mockRoutinesService.update).toHaveBeenCalledWith(
      ROUTINE_ID,
      'user-123',
      dto,
    );
  });

  it('remove calls service with id and userId', () => {
    const result = { message: 'Routine deleted' };
    mockRoutinesService.remove.mockReturnValue(result);
    expect(controller.remove(mockUser, ROUTINE_ID)).toBe(result);
    expect(mockRoutinesService.remove).toHaveBeenCalledWith(
      ROUTINE_ID,
      'user-123',
    );
  });
});
