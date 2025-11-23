import { useState } from 'react';

import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';

import { Eye, EyeOff, Plus } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';

export function CreateUserDialog() {
  const { t } = useTranslation();
  const trpc = useTrpc();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const createUserSchema = z.object({
    email: z.email(t('profile.emailInvalid', 'Invalid email address')),
    firstName: z
      .string()
      .min(3, t('profile.firstNameMin', 'First name must be at least 3 characters')),
    lastName: z
      .string()
      .min(3, t('profile.lastNameMin', 'Last name must be at least 3 characters')),
    name: z.string().min(3, t('profile.nameMin', 'Name must be at least 3 characters')),
    password: z
      .string()
      .min(8, t('profile.passwordMin', 'Password must be at least 8 characters'))
      .max(100, t('profile.passwordMax', 'Password must be at most 100 characters')),
    role: z.enum(['admin', 'user']),
  });
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      name: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'user' as 'admin' | 'user',
    },
    validators: {
      onChange: createUserSchema,
      onSubmit: createUserSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.admin.createUser({
          email: value.email,
          password: value.password,
          name: value.name,
          data: { firstName: value.firstName, lastName: value.lastName },
          role: value.role,
        });

        toast.success(t('userCreateModal.userCreated', 'User created successfully'));
        void queryClient.invalidateQueries(trpc.admin.listUsers.queryFilter());
        setOpen(false);
        form.reset();
      } catch (error) {
        toast.error(
          t('userCreateModal.userCreateError', 'Failed to create user: {{message}}', {
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        );
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          <Trans i18nKey="userCreateModal.createUser">Create User</Trans>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Trans i18nKey="userCreateModal.createNewUser">Create New User</Trans>
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={async e => {
            e.preventDefault();
            e.stopPropagation();
            await form.handleSubmit();
          }}
          className="space-y-4 py-4"
        >
          <form.Field name="name">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="profile.name">Name</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder={t('profile.nameLabel', 'Enter your name')}
                />
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
          <form.Field name="firstName">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="profile.firstName">First Name</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder={t('profile.firstNameLabel', 'Enter your first name')}
                />
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
          <form.Field name="lastName">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="profile.lastName">Last Name</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder={t('profile.lastNameLabel', 'Enter your last name')}
                />
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="email">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="userCreateModal.email">Email</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  placeholder={t('userCreateModal.emailLabel', 'Enter your email')}
                />
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="password">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="userCreateModal.passwordLabel">Password</Trans>
                </Label>
                <div className="relative">
                  <Input
                    id={field.name}
                    name={field.name}
                    type={showPassword ? 'text' : 'password'}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t('userCreateModal.passwordPlaceholder', 'Enter your password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-destructive text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="role">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="userCreateModal.role">Role</Trans>
                </Label>
                <Select
                  value={field.state.value}
                  onValueChange={value => field.handleChange(value as 'admin' | 'user')}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-destructive text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={state => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    form.reset();
                  }}
                  disabled={isSubmitting}
                >
                  <Trans i18nKey="userCreateModal.cancel">Cancel</Trans>
                </Button>
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting
                    ? t('userCreateModal.creating', 'Creating...')
                    : t('userCreateModal.createUser', 'Create User')}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
