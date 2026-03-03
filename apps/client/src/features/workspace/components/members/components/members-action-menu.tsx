import { Menu, ActionIcon, Text, Modal, PasswordInput, Button, Stack } from "@mantine/core";
import React, { useState } from "react";
import { IconDots, IconKey, IconTrash } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import {
  useDeleteWorkspaceMemberMutation,
  useResetMemberPasswordMutation,
} from "@/features/workspace/queries/workspace-query.ts";
import { useTranslation } from "react-i18next";
import useUserRole from "@/hooks/use-user-role.tsx";

interface Props {
  userId: string;
}
export default function MemberActionMenu({ userId }: Props) {
  const { t } = useTranslation();
  const deleteWorkspaceMemberMutation = useDeleteWorkspaceMemberMutation();
  const resetMutation = useResetMemberPasswordMutation();
  const { isAdmin } = useUserRole();
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

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
