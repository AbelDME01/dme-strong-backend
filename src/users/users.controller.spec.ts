import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const mockUser = {
  userId: 'user-123',
  email: 'test@dme.com',
  role: 'authenticated',
};

const mockUsersService = {
  getProfile: jest.fn(),
  createOrUpdateProfile: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('calls service.getProfile with userId from CurrentUser', async () => {
      const result = {
        id: 'profile-1',
        user_id: 'user-123',
        full_name: 'Test User',
      };
      mockUsersService.getProfile.mockResolvedValue(result);

      expect(await controller.getProfile(mockUser)).toBe(result);
      expect(mockUsersService.getProfile).toHaveBeenCalledWith('user-123');
    });
  });

  describe('updateProfile', () => {
    it('calls service.createOrUpdateProfile with userId and dto', async () => {
      const dto: UpdateProfileDto = {
        fullName: 'Abel Del Moral',
        heightCm: 180,
      };
      const result = { id: 'profile-1', full_name: 'Abel Del Moral' };
      mockUsersService.createOrUpdateProfile.mockResolvedValue(result);

      expect(await controller.updateProfile(mockUser, dto)).toBe(result);
      expect(mockUsersService.createOrUpdateProfile).toHaveBeenCalledWith(
        'user-123',
        dto,
      );
    });
  });
});
