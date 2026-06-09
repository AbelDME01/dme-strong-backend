import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

const mockUser = {
  userId: 'user-123',
  email: 'test@dme.com',
  role: 'authenticated',
};

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refreshToken: jest.fn(),
  getMe: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('rate limiting', () => {
    // Metadata keys built by @nestjs/throttler's Throttle decorator
    // (THROTTLER_LIMIT/THROTTLER_TTL + throttler name); the constants are not
    // exported from the package index.
    it.each(['register', 'login', 'refresh'] as const)(
      'applies a strict 5/min throttle to %s',
      (method) => {
        const handler = AuthController.prototype[method];
        expect(Reflect.getMetadata('THROTTLER:LIMITdefault', handler)).toBe(5);
        expect(Reflect.getMetadata('THROTTLER:TTLdefault', handler)).toBe(
          60000,
        );
      },
    );
  });

  describe('register', () => {
    it('delegates to authService.register and returns result', async () => {
      const dto: RegisterDto = { email: 'test@dme.com', password: 'Pass123!' };
      const result = { user: { id: 'user-123' }, session: null };
      mockAuthService.register.mockResolvedValue(result);

      expect(await controller.register(dto)).toBe(result);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('delegates to authService.login and returns result', async () => {
      const dto: LoginDto = { email: 'test@dme.com', password: 'Pass123!' };
      const result = {
        user: { id: 'user-123' },
        session: { access_token: 'tok' },
      };
      mockAuthService.login.mockResolvedValue(result);

      expect(await controller.login(dto)).toBe(result);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('refresh', () => {
    it('delegates to authService.refreshToken with the refresh token', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'refresh-tok' };
      const result = { session: { access_token: 'new-tok' } };
      mockAuthService.refreshToken.mockResolvedValue(result);

      expect(await controller.refresh(dto)).toBe(result);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('refresh-tok');
    });
  });

  describe('getMe', () => {
    it('delegates to authService.getMe with userId from CurrentUser', async () => {
      const result = { id: 'user-123', email: 'test@dme.com' };
      mockAuthService.getMe.mockResolvedValue(result);

      expect(await controller.getMe(mockUser)).toBe(result);
      expect(mockAuthService.getMe).toHaveBeenCalledWith('user-123');
    });
  });
});
