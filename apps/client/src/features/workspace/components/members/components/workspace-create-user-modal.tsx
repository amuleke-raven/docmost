import {
  Box,
  Button,
  Divider,
  Group,
  Modal,
  PasswordInput,
  Select,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { MultiGroupSelect } from "@/features/group/components/multi-group-select.tsx";
import { UserRole } from "@/lib/types.ts";
import { userRoleData } from "@/features/workspace/types/user-role-data.ts";
import { useCreateDirectUserMutation } from "@/features/workspace/queries/workspace-query.ts";

export default function WorkspaceCreateUserModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string | null>(UserRole.MEMBER);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const createDirectUserMutation = useCreateDirectUserMutation();

  function resetForm() {
    setEmail("");
    setName("");
    setPassword("");
    setRole(UserRole.MEMBER);
    setGroupIds([]);
  }

  function handleClose() {
    resetForm();
    close();
  }

  async function handleSubmit() {
    await createDirectUserMutation.mutateAsync({
      email,
      name,
      password,
      role: role.toLowerCase(),
      groupIds,
    });
    handleClose();
  }

  return (
    <>
      <Button variant="default" onClick={open}>
        Create user
      </Button>

      <Modal
        size="550"
        opened={opened}
        onClose={handleClose}
        title="Create new user"
        centered
      >
        <Divider size="xs" mb="xs" />

        <Box maw="500" mx="auto">
          <TextInput
            mt="sm"
            label="Email"
            placeholder="user@example.com"
            variant="filled"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
          />

          <TextInput
            mt="sm"
            label="Name"
            placeholder="Full name"
            variant="filled"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
          />

          <PasswordInput
            mt="sm"
            label="Password"
            description="Minimum 8 characters"
            placeholder="Set a password"
            variant="filled"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
          />

          <Select
            mt="sm"
            label="Role"
            placeholder="Choose a role"
            variant="filled"
            data={userRoleData
              .filter((r) => r.value !== UserRole.OWNER)
              .map((r) => ({ value: r.value, label: r.label }))}
            value={role}
            defaultValue={UserRole.MEMBER}
            allowDeselect={false}
            checkIconPosition="right"
            onChange={setRole}
          />

          <MultiGroupSelect
            mt="sm"
            label="Add to groups"
            description="User will be granted access to spaces the groups can access"
            onChange={setGroupIds}
          />

          <Group justify="flex-end" mt="md">
            <Button
              onClick={handleSubmit}
              loading={createDirectUserMutation.isPending}
              disabled={!email || !name || password.length < 8}
            >
              Create user
            </Button>
          </Group>
        </Box>
      </Modal>
    </>
  );
}
