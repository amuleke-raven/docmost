import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  changeMemberRole,
  createDirectUser,
  getInvitationById,
  getPendingInvitations,
  getWorkspaceMembers,
  createInvitation,
  resendInvitation,
  revokeInvitation,
  getWorkspace,
  getWorkspacePublicData,
  getAppVersion,
  deleteWorkspaceMember,
  resetMemberPassword,
  suspendWorkspaceMember,
  unsuspendWorkspaceMember,
} from "@/features/workspace/services/workspace-service";
import { IPagination, QueryParams } from "@/lib/types.ts";
import { notifications } from "@mantine/notifications";
import {
  ICreateDirectUser,
  ICreateInvite,
  IInvitation,
  IPublicWorkspace,
  IVersion,
  IWorkspace,
} from "@/features/workspace/types/workspace.types.ts";
import { IUser } from "@/features/user/types/user.types.ts";
import { useTranslation } from "react-i18next";

export function useWorkspaceQuery(): UseQueryResult<IWorkspace, Error> {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: () => getWorkspace(),
  });
}

export function useWorkspacePublicDataQuery(): UseQueryResult<
  IPublicWorkspace,
  Error
> {
  return useQuery({
    queryKey: ["workspace-public"],
    queryFn: () => getWorkspacePublicData(),
  });
}

export function useWorkspaceMembersQuery(
  params?: QueryParams,
): UseQueryResult<IPagination<IUser>, Error> {
  return useQuery({
    queryKey: ["workspaceMembers", params],
    queryFn: () => getWorkspaceMembers(params),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteWorkspaceMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    {
      userId: string;
    }
  >({
    mutationFn: (data) => deleteWorkspaceMember(data),
    onSuccess: (data, variables) => {
      notifications.show({ message: "Member deleted successfully" });
      queryClient.invalidateQueries({
        queryKey: ["workspaceMembers"],
      });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}

export function useChangeMemberRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, any>({
    mutationFn: (data) => changeMemberRole(data),
    onSuccess: (data, variables) => {
      notifications.show({ message: "Member role updated successfully" });
      queryClient.refetchQueries({
        queryKey: ["workspaceMembers"],
      });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}

export function useWorkspaceInvitationsQuery(
  params?: QueryParams,
): UseQueryResult<IPagination<IInvitation>, Error> {
  return useQuery({
    queryKey: ["invitations", params],
    queryFn: () => getPendingInvitations(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateInvitationMutation() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation<void, Error, ICreateInvite>({
    mutationFn: (data) => createInvitation(data),
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Invitation sent") });
      queryClient.refetchQueries({
        queryKey: ["invitations"],
      });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}

export function useResendInvitationMutation() {
  return useMutation<
    void,
    Error,
    {
      invitationId: string;
    }
  >({
    mutationFn: (data) => resendInvitation(data),
    onSuccess: (data, variables) => {
      notifications.show({ message: "Invitation resent" });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}

export function useRevokeInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    {
      invitationId: string;
    }
  >({
    mutationFn: (data) => revokeInvitation(data),
    onSuccess: (data, variables) => {
      notifications.show({ message: "Invitation revoked" });
      queryClient.invalidateQueries({
        queryKey: ["invitations"],
      });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}

export function useGetInvitationQuery(
  invitationId: string,
): UseQueryResult<IInvitation, Error> {
  return useQuery({
    queryKey: ["invitations", invitationId],
    queryFn: () => getInvitationById({ invitationId }),
    enabled: !!invitationId,
  });
}

export function useCreateDirectUserMutation() {
  const queryClient = useQueryClient();
  return useMutation<IUser, Error, ICreateDirectUser>({
    mutationFn: (data) => createDirectUser(data),
    onSuccess: () => {
      notifications.show({ message: "User created successfully" });
      queryClient.invalidateQueries({ queryKey: ["workspaceMembers"] });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}

export function useSuspendWorkspaceMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { userId: string }>({
    mutationFn: (data) => suspendWorkspaceMember(data),
    onSuccess: () => {
      notifications.show({ message: "Member suspended successfully" });
      queryClient.invalidateQueries({ queryKey: ["workspaceMembers"] });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}

export function useUnsuspendWorkspaceMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { userId: string }>({
    mutationFn: (data) => unsuspendWorkspaceMember(data),
    onSuccess: () => {
      notifications.show({ message: "Member unsuspended successfully" });
      queryClient.invalidateQueries({ queryKey: ["workspaceMembers"] });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}

export function useResetMemberPasswordMutation() {
  return useMutation<void, Error, { userId: string; newPassword: string }>({
    mutationFn: (data) => resetMemberPassword(data),
    onSuccess: () => {
      notifications.show({ message: "Member password updated successfully" });
    },
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ message: errorMessage, color: "red" });
    },
  });
}

export function useAppVersion(
  isEnabled: boolean,
): UseQueryResult<IVersion, Error> {
  return useQuery({
    queryKey: ["version"],
    queryFn: () => getAppVersion(),
    staleTime: 60 * 60 * 1000, // 1 hr
    enabled: isEnabled,
    refetchOnMount: true,
  });
}
