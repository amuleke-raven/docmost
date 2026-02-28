import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  OIDCStrategy,
  IOIDCStrategyOptionWithRequest,
} from 'passport-azure-ad';
import { Request } from 'express';
import { AuthService } from '../services/auth.service';

/**
 * Passport strategy for Azure AD / Entra ID using the OAuth2/OIDC
 * authorization code flow.  Configuration is driven entirely by
 * environment variables so the implementation can remain in the core
 * repo; in a real EE build the equivalent strategy is part of the
 * enterprise module and reads settings from the workspace `auth_providers`
 * table.
 */
@Injectable()
export class AzureAdStrategy extends PassportStrategy(
  OIDCStrategy,
  'azure-ad',
) {
  private readonly logger = new Logger(AzureAdStrategy.name);

  constructor(private authService: AuthService) {
    super({
      identityMetadata:
        process.env.AZURE_AD_ISSUER ||
        `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
      clientID: process.env.AZURE_AD_CLIENT_ID,
      responseType: 'code',
      responseMode: 'form_post',
      redirectUrl: process.env.AZURE_AD_CALLBACK_URL,
      allowHttpForRedirectUrl: !!(
        process.env.AZURE_AD_CALLBACK_URL &&
        process.env.AZURE_AD_CALLBACK_URL.startsWith('http:')
      ),
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      scope: ['openid', 'profile', 'email'],
      passReqToCallback: true,
    } as IOIDCStrategyOptionWithRequest);
  }

  async validate(
    req: Request,
    iss: string,
    sub: string,
    profile: any,
    accessToken: string,
    refreshToken: string,
    done: (err: any, user?: any, info?: any) => void,
  ) {
    try {
      // `state` is used to transport workspaceId from the login url to
      // the callback.  Azure sends it back verbatim in the POST body.
      const workspaceId =
        (req.body && req.body.state) || (req.query && req.query.state);

      const user = await this.authService.findOrCreateUserFromAzureProfile(
        profile,
        workspaceId as string,
      );

      // the controller will look at `req.user.user` / `req.user.workspaceId`
      done(null, { user, workspaceId });
    } catch (err) {
      this.logger.error('azure validation failed', err);
      done(err, false);
    }
  }
}
