import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { QueryWorkoutDto } from './dto/query-workout.dto';
import { CreateSetDto } from './dto/create-set.dto';
import { UpdateSetDto } from './dto/update-set.dto';

const mockUser = {
  userId: 'user-123',
  email: 'test@dme.com',
  role: 'authenticated',
};
const WORKOUT_ID = 'workout-abc';
const SET_ID = 'set-xyz';

const mockWorkoutsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  addSet: jest.fn(),
  updateSet: jest.fn(),
  removeSet: jest.fn(),
};

describe('WorkoutsController', () => {
  let controller: WorkoutsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkoutsController],
      providers: [{ provide: WorkoutsService, useValue: mockWorkoutsService }],
    }).compile();

    controller = module.get<WorkoutsController>(WorkoutsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('calls service.findAll with userId and query', () => {
      const query: QueryWorkoutDto = { page: 1, limit: 20 };
      const result = { data: [], total: 0 };
      mockWorkoutsService.findAll.mockReturnValue(result);

      expect(controller.findAll(mockUser, query)).toBe(result);
      expect(mockWorkoutsService.findAll).toHaveBeenCalledWith(
        'user-123',
        query,
      );
    });
  });

  describe('findOne', () => {
    it('calls service.findOne with id and userId', () => {
      const result = { id: WORKOUT_ID };
      mockWorkoutsService.findOne.mockReturnValue(result);

      expect(controller.findOne(mockUser, WORKOUT_ID)).toBe(result);
      expect(mockWorkoutsService.findOne).toHaveBeenCalledWith(
        WORKOUT_ID,
        'user-123',
      );
    });
  });

  describe('create', () => {
    it('calls service.create with userId and dto', () => {
      const dto: CreateWorkoutDto = { name: 'Push Day' };
      const result = { id: WORKOUT_ID, name: 'Push Day' };
      mockWorkoutsService.create.mockReturnValue(result);

      expect(controller.create(mockUser, dto)).toBe(result);
      expect(mockWorkoutsService.create).toHaveBeenCalledWith('user-123', dto);
    });
  });

  describe('update', () => {
    it('calls service.update with id, userId and dto', () => {
      const dto: UpdateWorkoutDto = { notes: 'Great session' };
      const result = { id: WORKOUT_ID, notes: 'Great session' };
      mockWorkoutsService.update.mockReturnValue(result);

      expect(controller.update(mockUser, WORKOUT_ID, dto)).toBe(result);
      expect(mockWorkoutsService.update).toHaveBeenCalledWith(
        WORKOUT_ID,
        'user-123',
        dto,
      );
    });
  });

  describe('remove', () => {
    it('calls service.remove with id and userId', () => {
      const result = { message: 'Workout deleted' };
      mockWorkoutsService.remove.mockReturnValue(result);

      expect(controller.remove(mockUser, WORKOUT_ID)).toBe(result);
      expect(mockWorkoutsService.remove).toHaveBeenCalledWith(
        WORKOUT_ID,
        'user-123',
      );
    });
  });

  describe('addSet', () => {
    it('calls service.addSet with workoutId, userId and dto', () => {
      const dto: CreateSetDto = {
        exerciseId: 'ex-uuid',
        reps: 10,
        weightKg: 80,
      };
      const result = { id: SET_ID };
      mockWorkoutsService.addSet.mockReturnValue(result);

      expect(controller.addSet(mockUser, WORKOUT_ID, dto)).toBe(result);
      expect(mockWorkoutsService.addSet).toHaveBeenCalledWith(
        WORKOUT_ID,
        'user-123',
        dto,
      );
    });
  });

  describe('updateSet', () => {
    it('calls service.updateSet with setId, workoutId, userId and dto', () => {
      const dto: UpdateSetDto = { reps: 12 };
      const result = { id: SET_ID, reps: 12 };
      mockWorkoutsService.updateSet.mockReturnValue(result);

      expect(controller.updateSet(mockUser, WORKOUT_ID, SET_ID, dto)).toBe(
        result,
      );
      expect(mockWorkoutsService.updateSet).toHaveBeenCalledWith(
        SET_ID,
        WORKOUT_ID,
        'user-123',
        dto,
      );
    });
  });

  describe('removeSet', () => {
    it('calls service.removeSet with setId, workoutId and userId', () => {
      const result = { message: 'Set deleted' };
      mockWorkoutsService.removeSet.mockReturnValue(result);

      expect(controller.removeSet(mockUser, WORKOUT_ID, SET_ID)).toBe(result);
      expect(mockWorkoutsService.removeSet).toHaveBeenCalledWith(
        SET_ID,
        WORKOUT_ID,
        'user-123',
      );
    });
  });
});
