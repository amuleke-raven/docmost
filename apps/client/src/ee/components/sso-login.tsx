import { useState } from "react";
import { useWorkspacePublicDataQuery } from "@/features/workspace/queries/workspace-query.ts";
import { Button, Divider, Stack } from "@mantine/core";
import { IconLock, IconServer } from "@tabler/icons-react";
import { IAuthProvider } from "@/ee/security/types/security.types.ts";
import { buildSsoLoginUrl } from "@/ee/security/sso.utils.ts";
import { SSO_PROVIDER } from "@/ee/security/contants.ts";
import { GoogleIcon } from "@/components/icons/google-icon.tsx";
import { isCloud } from "@/lib/config.ts";
import { LdapLoginModal } from "@/ee/components/ldap-login-modal.tsx";

export default function SsoLogin() {
  const { data, isLoading } = useWorkspacePublicDataQuery();
  const [ldapModalOpened, setLdapModalOpened] = useState(false);
  const [selectedLdapProvider, setSelectedLdapProvider] = useState<IAuthProvider | null>(null);

  if (!data?.authProviders || data?.authProviders?.length === 0) {
    return null;
  }

  const handleSsoLogin = (provider: IAuthProvider) => {
    if (provider.type === SSO_PROVIDER.LDAP) {
      // Open modal for LDAP instead of redirecting
      setSelectedLdapProvider(provider);
      setLdapModalOpened(true);
    } else {
      // Redirect for other SSO providers
      window.location.href = buildSsoLoginUrl({
        providerId: provider.id,
        type: provider.type,
        workspaceId: data.id,
      });
    }
  };

  const getProviderIcon = (provider: IAuthProvider) => {
    if (provider.type === SSO_PROVIDER.GOOGLE) {
      return <GoogleIcon size={16} />;
    } else if (provider.type === SSO_PROVIDER.LDAP) {
      return <IconServer size={16} />;
    } else if (
      provider.type === SSO_PROVIDER.OIDC &&
      provider.name?.toLowerCase().includes('azure')
    ) {
      // simple azure logo (use lock as fallback)
      return (
        <img
          src="/icons/azure-icon.svg"
          alt="Azure"
          style={{ width: 16, height: 16 }}
        />
      );
    } else {
      return <IconLock size={16} />;
    }
  };

  return (
    <>
      {selectedLdapProvider && (
        <LdapLoginModal
          opened={ldapModalOpened}
          onClose={() => {
            setLdapModalOpened(false);
            setSelectedLdapProvider(null);
          }}
          provider={selectedLdapProvider}
          workspaceId={data.id}
        />
      )}

      {(isCloud() || data.hasLicenseKey) && (
        <>
          <Stack align="stretch" justify="center" gap="sm">
            {data.authProviders.map((provider) => (
              <div key={provider.id}>
                <Button
                  onClick={() => handleSsoLogin(provider)}
                  leftSection={getProviderIcon(provider)}
                  variant="default"
                  fullWidth
                >
                  {provider.name}
                </Button>
              </div>
            ))}
      {/* support global azure login if configured via env */}
      {process.env.REACT_APP_AZURE_ENABLED === 'true' && (
        <div>
          <Button
            onClick={() =>
              window.location.href = `${window.location.origin}/api/sso/azure/login`;
            }
            leftSection={
              <img
                src="/icons/azure-icon.svg"
                alt="Azure"
                style={{ width: 16, height: 16 }}
              />
            }
            variant="default"
            fullWidth
          >
            Sign in with Microsoft
          </Button>
        </div>
      )}
          </Stack>

          {!data.enforceSso && (
            <Divider my="xs" label="OR" labelPosition="center" />
          )}
        </>
      )}
    </>
  );
}
