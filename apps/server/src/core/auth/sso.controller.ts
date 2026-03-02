import { Controller, Get, Logger, Post, Query, Req, Res } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Issuer, Client, generators } from 'openid-client';
import { AuthService } from './services/auth.service';

@Controller('sso')
export class SsoController {
  private readonly logger = new Logger(SsoController.name);
  private clientCache: Client | null = null;

  constructor(private authService: AuthService) {}

  private async getOidcClient(): Promise<Client> {
    if (this.clientCache) return this.clientCache;

    const metadataUrl =
      process.env.AZURE_AD_ISSUER ||
      `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`;

    const issuer = await Issuer.discover(metadataUrl);
    this.clientCache = new issuer.Client({
      client_id: process.env.AZURE_AD_CLIENT_ID!,
      client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
      redirect_uris: [process.env.AZURE_AD_CALLBACK_URL!],
      response_types: ['code'],
    });

    return this.clientCache;
  }

  /**
   * Initiate Azure AD / Entra ID login via OIDC authorization code flow.
   * The workspaceId is forwarded as the `state` parameter so the callback
   * can associate the resulting user with the correct workspace.
   */
  @Get('azure/login')
  async login(
    @Query('workspaceId') workspaceId: string,
    @Res() res: FastifyReply,
  ) {
    try {
      const client = await this.getOidcClient();
      const state = workspaceId || generators.state();

      const authUrl = client.authorizationUrl({
        scope: 'openid profile email',
        response_mode: 'form_post',
        state,
      });

      return res.redirect(authUrl);
    } catch (err) {
      this.logger.error('azure login redirect failed', err);
      return res.redirect('/login');
    }
  }

  /**
   * Callback endpoint that Azure AD POSTs to after the user authenticates.
   * Exchanges the authorization code for tokens, extracts identity claims,
   * then issues a Docmost JWT cookie before redirecting to the client.
   */
  @Post('azure/callback')
  async callback(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    try {
      const client = await this.getOidcClient();

      // Azure sends the auth code and state in the POST body (form_post mode)
      const params = req.body as Record<string, string>;
      const workspaceId = params.state as string;

      const tokenSet = await client.callback(
        process.env.AZURE_AD_CALLBACK_URL!,
        params,
        { state: workspaceId },
      );

      const claims = tokenSet.claims();
      const email = (claims.email || claims.preferred_username) as string;
      const name = (claims.name || email) as string;

      if (!email) {
        this.logger.warn('azure callback: no email in OIDC claims');
        return res.redirect('/login');
      }

      const user = await this.authService.findOrCreateUserFromAzureProfile(
        { _json: { email }, displayName: name },
        workspaceId,
      );

      const authToken = await this.authService.generateTokenForUser(
        user,
        workspaceId,
      );

      res.setCookie('authToken', authToken, {
        httpOnly: true,
        path: '/',
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      });

      return res.redirect('/');
    } catch (err) {
      this.logger.error('azure callback failed', err);
      return res.redirect('/login');
    }
  }
}
