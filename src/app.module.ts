import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { ExercisesModule } from './exercises/exercises.module';
import { RecordsModule } from './records/records.module';
import { MeasurementsModule } from './measurements/measurements.module';

@Module({
  imports: [
    // Config (global — must be first)
    AppConfigModule,

    // Rate limiting (global)
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),

    // Supabase (global)
    SupabaseModule,

    // Domain modules
    AuthModule,
    UsersModule,
    WorkoutsModule,
    ExercisesModule,
    RecordsModule,
    MeasurementsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ThrottlerGuard registered globally via DI so it has access to the storage provider
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
