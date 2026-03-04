import { Menu, ActionIcon, Text, Modal, PasswordInput, Button, Stack } from "@mantine/core";
import React, { useState } from "react";
import { IconDots, IconKey, IconTrash, IconBan, IconCircleCheck } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import {
  useDeleteWorkspaceMemberMutation,
  useResetMemberPasswordMutation,
  useSuspendWorkspaceMemberMutation,
  useUnsuspendWorkspaceMemberMutation,
} from "@/features/workspace/queries/workspace-query.ts";
import { useTranslation } from "react-i18next";
import useUserRole from "@/hooks/use-user-role.tsx";
import { useAtom } from "jotai";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom.ts";
import { UserRole } from "@/lib/types.ts";

interface Props {
  userId: string;
  memberRole: string;
  deactivatedAt: Date | null;
}
export default function MemberActionMenu({ userId, memberRole, deactivatedAt }: Props) {
  const { t } = useTranslation();
  const deleteWorkspaceMemberMutation = useDeleteWorkspaceMemberMutation();
  const resetMutation = useResetMemberPasswordMutation();
  const suspendMutation = useSuspendWorkspaceMemberMutation();
  const unsuspendMutation = useUnsuspendWorkspaceMemberMutation();
  const { isAdmin, isOwner } = useUserRole();
  const [currentUser] = useAtom(currentUserAtom);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const isSelf = currentUser?.user?.id === userId;
  const targetIsAdminOrOwner =
    memberRole === UserRole.ADMIN || memberRole === UserRole.OWNER;
  const canManageSuspend =
    isAdmin && !isSelf && (isOwner || !targetIsAdminOrOwner);

  const onRevoke = async () => {
    await deleteWorkspaceMemberMutation.mutateAsync({ userId });
  };

  const openRevokeModal = () =>
    modals.openConfirmModal({
      title: t("Delete member"),
      children: (
        <Text size="sm">
          {t(
            "Are you sure you want to delete this workspace member? This action is irreversible.",
          )}
        </Text>
      ),
      centered: true,
      labels: { confirm: t("Delete"), cancel: t("Don't") },
      confirmProps: { color: "red" },
      onConfirm: onRevoke,
    });

  const openSuspendModal = () =>
    modals.openConfirmModal({
      title: t("Suspend member"),
      children: (
        <Text size="sm">
          {t(
            "Are you sure you want to suspend this member? They will not be able to log in until unsuspended.",
          )}
        </Text>
      ),
      centered: true,
      labels: { confirm: t("Suspend"), cancel: t("Cancel") },
      confirmProps: { color: "orange" },
      onConfirm: () => suspendMutation.mutate({ userId }),
    });

  const handleResetPassword = async () => {
    await resetMutation.mutateAsync({ userId, newPassword });
    setResetModalOpen(false);
    setNewPassword("");
  };

  return (
    <>
      <Modal
        opened={resetModalOpen}
        onClose={() => {
          setResetModalOpen(false);
          setNewPassword("");
        }}
        title={t("Reset member password")}
        centered
      >
        <Stack>
          <PasswordInput
            label={t("New password")}
            placeholder={t("Enter new password")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
            minLength={8}
          />
          <Button
            onClick={handleResetPassword}
            loading={resetMutation.isPending}
            disabled={newPassword.length < 8}
          >
            {t("Reset password")}
          </Button>
        </Stack>
      </Modal>

      <Menu
        shadow="xl"
        position="bottom-end"
        offset={20}
        width={200}
        withArrow
        arrowPosition="center"
      >
        <Menu.Target>
          <ActionIcon variant="subtle" c="gray">
            <IconDots size={20} stroke={2} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            onClick={() => setResetModalOpen(true)}
            leftSection={<IconKey size={16} />}
            disabled={!isAdmin}
          >
            {t("Reset password")}
          </Menu.Item>

          {canManageSuspend && !deactivatedAt && (
            <Menu.Item
              c="orange"
              onClick={openSuspendModal}
              leftSection={<IconBan size={16} />}
            >
              {t("Suspend member")}
            </Menu.Item>
          )}

          {canManageSuspend && deactivatedAt && (
            <Menu.Item
              c="green"
              onClick={() => unsuspendMutation.mutate({ userId })}
              leftSection={<IconCircleCheck size={16} />}
            >
              {t("Unsuspend member")}
            </Menu.Item>
          )}

          <Menu.Divider />
          <Menu.Item
            c="red"
            onClick={openRevokeModal}
            leftSection={<IconTrash size={16} />}
            disabled={!isAdmin}
          >
            {t("Delete member")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
}
