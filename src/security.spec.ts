/**
 * Security integration tests
 *
 * Spins up a minimal NestJS app (with the real JwtAuthGuard and PassportModule)
 * to verify that protected endpoints reject unauthenticated / invalid requests.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { Controller, Get, Body, Post } from '@nestjs/common';
import request from 'supertest';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { Public } from './common/decorators/public.decorator';

const JWT_SECRET = 'test-secret-for-security-tests';

@Controller('test-protected')
class TestProtectedController {
  @Get()
  getProtected() {
    return { message: 'protected data' };
  }
}

@Controller('test-public')
class TestPublicController {
  @Public()
  @Get()
  getPublic() {
    return { message: 'public data' };
  }

  @Public()
  @Post('create')
  createPublic(@Body() body: any) {
    return { received: body };
  }
}

describe('Security (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const configServiceMock = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return JWT_SECRET;
        if (key === 'SUPABASE_URL') return 'https://example.supabase.co';
        throw new Error(`Unknown config key: ${key}`);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [TestProtectedController, TestPublicController],
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // -----------------------------------------------------------------------
  // 401 — no token
  // -----------------------------------------------------------------------
  it('returns 401 when no Authorization header is provided on a protected endpoint', async () => {
    await request(app.getHttpServer()).get('/test-protected').expect(401);
  });

  // -----------------------------------------------------------------------
  // 401 — manipulated / invalid token
  // -----------------------------------------------------------------------
  it('returns 401 when an invalid Bearer token is provided', async () => {
    await request(app.getHttpServer())
      .get('/test-protected')
      .set('Authorization', 'Bearer this.is.not.a.valid.jwt')
      .expect(401);
  });

  it('returns 401 when a tampered (wrong signature) JWT is provided', async () => {
    // A structurally valid JWT signed with a different secret
    const tamperedToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
      '.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjAwMDAwMDAwfQ' +
      '.INVALID_SIGNATURE_TAMPERED';

    await request(app.getHttpServer())
      .get('/test-protected')
      .set('Authorization', `Bearer ${tamperedToken}`)
      .expect(401);
  });

  // -----------------------------------------------------------------------
  // Public endpoints are accessible without a token
  // -----------------------------------------------------------------------
  it('returns 200 on a @Public() endpoint without a token', async () => {
    await request(app.getHttpServer()).get('/test-public').expect(200);
  });

  // -----------------------------------------------------------------------
  // SQL-injection-like characters in query params — should not cause 500
  // -----------------------------------------------------------------------
  it('does not return 500 for SQL-injection-like characters in query params on public endpoint', async () => {
    const res = await request(app.getHttpServer())
      .get("/test-public?name=' OR 1=1 --")
      .expect((r) => {
        expect(r.status).not.toBe(500);
      });
    // The public endpoint just returns its payload — no 500 means input was handled safely
    expect(res.status).toBeLessThan(500);
  });
});
