import { AzureAdStrategy } from '../src/core/auth/strategies/azure-ad.strategy';
import { AuthService } from '../src/core/auth/services/auth.service';

describe('AzureAdStrategy', () => {
  let strategy: AzureAdStrategy;
  let authService: Partial<AuthService>;

  beforeEach(() => {
    authService = {
      findOrCreateUserFromAzureProfile: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        workspaceId: 'ws-1',
      }),
    };

    // environment variables must exist for constructor
    process.env.AZURE_AD_CLIENT_ID = 'cid';
    process.env.AZURE_AD_CLIENT_SECRET = 'csecret';
    process.env.AZURE_AD_CALLBACK_URL = 'http://localhost:3000/api/sso/azure/callback';
    process.env.AZURE_AD_TENANT_ID = 'tenant';

    strategy = new AzureAdStrategy(authService as AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('validate should call authService helper and return user', async () => {
    const profile = { _json: { email: 'test@example.com' }, displayName: 'Test' };
    const req: any = { body: { state: 'ws-1' }, query: {} };
    const done = jest.fn();

    await strategy.validate(
      req,
      'issuer',
      'sub',
      profile,
      'token',
      'refresh',
      done,
    );

    expect(authService.findOrCreateUserFromAzureProfile).toHaveBeenCalledWith(
      profile,
      'ws-1',
    );
    expect(done).toHaveBeenCalledWith(null, {
      user: { id: 'user-1', email: 'test@example.com', workspaceId: 'ws-1' },
      workspaceId: 'ws-1',
    });
  });
});
