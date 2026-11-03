import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { RegisteredGuard, SessionGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { GoogleService } from './google.service';
import { OtpService } from './otp.service';
import { SessionService } from './session.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    SessionService,
    GoogleService,
    SessionGuard,
    RegisteredGuard,
  ],
  exports: [SessionService, SessionGuard, RegisteredGuard],
})
export class IdentityModule {}
