import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AzureAdStrategy } from "./strategies/azure-ad.strategy";
import { SsoController } from "./sso.controller";
import { WorkspaceModule } from '../workspace/workspace.module';
import { SignupService } from './services/signup.service';
import { TokenModule } from './token.module';

@Module({
  imports: [TokenModule, WorkspaceModule],
  controllers: [AuthController, SsoController],
  providers: [AuthService, SignupService, JwtStrategy, AzureAdStrategy],
  exports: [SignupService],
})
export class AuthModule {}
