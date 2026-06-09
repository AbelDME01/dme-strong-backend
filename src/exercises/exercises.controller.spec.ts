import { Test, TestingModule } from '@nestjs/testing';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { QueryExerciseDto } from './dto/query-exercise.dto';

const mockUser = {
  userId: 'user-123',
  email: 'test@dme.com',
  role: 'authenticated',
};
const EXERCISE_ID = 'exercise-abc';

const mockExercisesService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ExercisesController', () => {
  let controller: ExercisesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExercisesController],
      providers: [
        { provide: ExercisesService, useValue: mockExercisesService },
      ],
    }).compile();

    controller = module.get<ExercisesController>(ExercisesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('calls service.findAll with userId and query', async () => {
      const query: QueryExerciseDto = {};
      const result = { data: [], total: 0 };
      mockExercisesService.findAll.mockResolvedValue(result);

      expect(await controller.findAll(mockUser, query)).toBe(result);
      expect(mockExercisesService.findAll).toHaveBeenCalledWith(
        'user-123',
        query,
      );
    });
  });

  describe('findOne', () => {
    it('calls service.findOne with id and userId', async () => {
      const result = { id: EXERCISE_ID, name: 'Press de Banca' };
      mockExercisesService.findOne.mockResolvedValue(result);

      expect(await controller.findOne(mockUser, EXERCISE_ID)).toBe(result);
      expect(mockExercisesService.findOne).toHaveBeenCalledWith(
        EXERCISE_ID,
        'user-123',
      );
    });
  });

  describe('create', () => {
    it('calls service.create with userId and dto', async () => {
      const dto: CreateExerciseDto = {
        name: 'Sentadilla',
        muscleGroup: 'Piernas',
        isPublic: true,
      };
      const result = { id: EXERCISE_ID, ...dto };
      mockExercisesService.create.mockResolvedValue(result);

      expect(await controller.create(mockUser, dto)).toBe(result);
      expect(mockExercisesService.create).toHaveBeenCalledWith('user-123', dto);
    });
  });

  describe('update', () => {
    it('calls service.update with id, userId and dto', async () => {
      const dto: UpdateExerciseDto = { name: 'Sentadilla Búlgara' };
      const result = { id: EXERCISE_ID, name: 'Sentadilla Búlgara' };
      mockExercisesService.update.mockResolvedValue(result);

      expect(await controller.update(mockUser, EXERCISE_ID, dto)).toBe(result);
      expect(mockExercisesService.update).toHaveBeenCalledWith(
        EXERCISE_ID,
        'user-123',
        dto,
      );
    });
  });

  describe('remove', () => {
    it('calls service.remove with id and userId', async () => {
      const result = { message: 'Exercise deleted' };
      mockExercisesService.remove.mockResolvedValue(result);

      expect(await controller.remove(mockUser, EXERCISE_ID)).toBe(result);
      expect(mockExercisesService.remove).toHaveBeenCalledWith(
        EXERCISE_ID,
        'user-123',
      );
    });
  });
});
