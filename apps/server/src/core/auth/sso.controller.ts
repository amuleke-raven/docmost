import { Controller, Get, Post, Req, Res, Query } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import * as passport from 'passport';
import { FastifyReply, FastifyRequest } from 'fastify';

@Controller('sso')
export class SsoController {
  constructor(private authService: AuthService) {}

  /**
   * Initiate Azure AD login.  The workspaceId may be supplied as a
   * query parameter; it is forwarded to the provider via the `state`
   * parameter so that the callback can associate the resulting user
   * with the correct workspace.
   */
  @Get('azure/login')
  login(
    @Query('workspaceId') workspaceId: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const options: any = {};
    if (workspaceId) {
      options.state = workspaceId;
    }

    return passport.authenticate('azure-ad', options)(
      req as any,
      res as any,
    );
  }

  /**
   * Callback endpoint that Azure AD will POST to after the user
   * authenticates.  We delegate to Passport and then issue the regular
   * Docmost JWT cookie before redirecting to the client.
   */
  @Post('azure/callback')
  async callback(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return new Promise<void>((resolve) => {
      passport.authenticate('azure-ad', async (err, result, info) => {
        if (err || !result) {
          // failure - simply redirect to login page
          return res.redirect('/login');
        }

        const { user, workspaceId } = result as any;
        // generate a jwt for the user without requiring a password
        const authToken = await this.authService.generateTokenForUser(user, workspaceId);

        res.setCookie('authToken', authToken, {
          httpOnly: true,
          path: '/',
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        });

        // after successful login redirect back to client
        res.redirect('/');
        resolve();
      })(req as any, res as any);
    });
  }
}
