import { useState } from 'react';

import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';

import { Calendar, Lock, Mail, Shield, User as UserIcon } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import LoaderDialog from '@/components/loader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import UserAvatar from '@/components/userAvatar';
import { authClient } from '@/lib/auth-client';
import { useTrpc } from '@/providers/trpc';

export default function Profile({
  session,
}: {
  session: { isAuthenticated: boolean; userId: string } | null;
}) {
  const { t } = useTranslation();
  const trpc = useTrpc();
  const {
    data: { user } = { user: undefined },
    isLoading,
    refetch,
  } = useQuery({
    ...trpc.user.getMe.queryOptions({}),
    enabled: !!session?.isAuthenticated,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const nameSchema = z.object({
    firstName: z
      .string()
      .min(3, t('profile.firstNameMin', 'First name must be at least 3 characters')),
    lastName: z
      .string()
      .min(3, t('profile.lastNameMin', 'Last name must be at least 3 characters')),
  });
  const emailSchema = z.object({
    email: z.email(t('profile.emailInvalid', 'Invalid email address')),
  });
  const passwordSchema = z
    .object({
      currentPassword: z
        .string()
        .min(8, t('profile.passwordMin', 'Password must be at least 8 characters'))
        .max(100, t('profile.passwordMax', 'Password must be at most 100 characters')),
      newPassword: z
        .string()
        .min(8, t('profile.passwordMin', 'Password must be at least 8 characters'))
        .max(100, t('profile.passwordMax', 'Password must be at most 100 characters')),
      confirmPassword: z
        .string()
        .min(8, t('profile.passwordMin', 'Password must be at least 8 characters'))
        .max(100, t('profile.passwordMax', 'Password must be at most 100 characters')),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: t('profile.passwordMismatch', 'Passwords do not match'),
      path: ['confirmPassword'],
    });
  const profileForm = useForm({
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    },
    validators: {
      onChange: nameSchema,
      onSubmit: nameSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.updateUser({
          firstName: value.firstName,
          lastName: value.lastName,
        });
        setIsEditing(false);
        await refetch();
        toast.success(t('profile.success', 'Profile updated successfully'));
      } catch (error) {
        console.error('Failed to update profile:', error);
        toast.error(t('profile.error', 'Failed to update profile'));
      }
    },
  });

  // Email change form
  const emailForm = useForm({
    defaultValues: {
      email: user?.email ?? '',
    },
    validators: {
      onChange: emailSchema,
      onSubmit: emailSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.changeEmail({
          newEmail: value.email,
        });
        setIsEmailModalOpen(false);
        emailForm.reset();
        await refetch();
        toast.success(
          t('profile.emailUpdated', 'Email updated successfully. Please verify your new email.')
        );
      } catch (error) {
        console.error('Failed to update email:', error);
        toast.error(t('profile.emailUpdateError', 'Failed to update email'));
      }
    },
  });

  // Password change form
  const passwordForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validators: {
      onChange: passwordSchema,
      onSubmit: passwordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
          revokeOtherSessions: true,
        });
        setIsPasswordModalOpen(false);
        passwordForm.reset();
        toast.success(t('profile.passwordUpdated', 'Password updated successfully'));
      } catch (error) {
        console.error('Failed to update password:', error);
        toast.error(
          t(
            'profile.passwordUpdateError',
            'Failed to update password. Check your current password.'
          )
        );
      }
    },
  });

  if (isLoading) {
    return <LoaderDialog />;
  }

  return (
    <div className="bg-background min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Profile Information */}
        <div className="space-y-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <UserIcon className="h-5 w-5" />
              <Trans i18nKey="profile.profileInformation">Profile Information</Trans>
            </h2>
            <p className="text-muted-foreground text-sm">
              <Trans i18nKey="profile.personalDetails">Your personal details</Trans>
            </p>
          </div>

          <div className="space-y-3">
            {/* User Avatar with Initials */}
            <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
              <UserAvatar firstName={user?.firstName ?? ''} lastName={user?.lastName ?? ''} />
              <div className="flex-1">
                <p className="font-medium">{user?.name}</p>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
              </div>
            </div>

            {/* Edit Form */}
            {isEditing ? (
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  e.stopPropagation();
                  await profileForm.handleSubmit();
                }}
                className="space-y-4"
              >
                {/* First Name */}
                <profileForm.Field name="firstName">
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
                </profileForm.Field>

                {/* Last Name */}
                <profileForm.Field name="lastName">
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
                </profileForm.Field>

                {/* Form Actions */}
                <profileForm.Subscribe selector={state => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <div className="grid grid-cols-2 gap-2 pt-4">
                      <Button type="submit" disabled={!canSubmit || isSubmitting}>
                        {isSubmitting ? (
                          <Trans i18nKey="profile.savingChanges">Saving changes...</Trans>
                        ) : (
                          <Trans i18nKey="profile.save">Save</Trans>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={() => {
                          setIsEditing(false);
                          profileForm.reset();
                        }}
                      >
                        <Trans i18nKey="profile.cancel">Cancel</Trans>
                      </Button>
                    </div>
                  )}
                </profileForm.Subscribe>
              </form>
            ) : (
              <div
                aria-label={t('profile.previewLabel', 'Preview Profile Information')}
                className="space-y-3"
              >
                {/* Read-only display */}
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1 rounded-lg border p-4">
                    <p className="font-medium">
                      <Trans i18nKey="profile.firstName">First Name</Trans>
                    </p>
                    <p className="text-muted-foreground text-sm">{user?.firstName}</p>
                  </div>

                  <div className="flex-1 rounded-lg border p-4">
                    <p className="font-medium">
                      <Trans i18nKey="profile.lastName">Last Name</Trans>
                    </p>
                    <p className="text-muted-foreground text-sm">{user?.lastName}</p>
                  </div>
                </div>

                {/* Email (read-only with change button) */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="font-medium">
                        <Trans i18nKey="profile.email">Email</Trans>
                      </p>
                      <p className="text-muted-foreground text-sm">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* User ID (read-only) */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="font-medium">
                        <Trans i18nKey="profile.userId">User ID</Trans>
                      </p>
                      <p className="text-muted-foreground font-mono text-sm">{user?.id}</p>
                    </div>
                  </div>
                </div>

                {/* Created Date (read-only) */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="font-medium">
                        <Trans i18nKey="profile.createdDate">Created Date</Trans>
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Updated Date (read-only) */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="font-medium">
                        <Trans i18nKey="profile.updatedDate">Updated Date</Trans>
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex flex-col gap-2">
            <Button onClick={() => setIsEditing(true)} className="w-full">
              <Trans i18nKey="profile.editProfile">Edit Profile</Trans>
            </Button>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => setIsEmailModalOpen(true)}>
                <Mail className="mr-2 h-4 w-4" />
                <Trans i18nKey="profile.updateEmail">Change Email</Trans>
              </Button>
              <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)}>
                <Lock className="mr-2 h-4 w-4" />
                <Trans i18nKey="profile.updatePassword">Change Password</Trans>
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Account Status */}
        <div className="space-y-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Shield className="h-5 w-5" />
              <Trans i18nKey="profile.accountStatus">Account Status</Trans>
            </h2>
            <p className="text-muted-foreground text-sm">
              <Trans i18nKey="profile.accountStatusSubtitle">
                Your account status and verification
              </Trans>
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">
                  <Trans i18nKey="profile.verificationStatus">Verification Status</Trans>
                </p>
                <p className="text-muted-foreground text-sm">
                  <Trans i18nKey="profile.email">Email</Trans>
                </p>
              </div>
              {user?.emailVerified ? (
                <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  <Trans i18nKey="profile.verified">Verified</Trans>
                </div>
              ) : (
                <div className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                  <Trans i18nKey="profile.notVerified">Not Verified</Trans>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Change Modal */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="profile.emailModal.title">Change Email</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans i18nKey="profile.emailModal.description">
                Enter your new email and current password to proceed
              </Trans>
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async e => {
              e.preventDefault();
              e.stopPropagation();
              await emailForm.handleSubmit();
            }}
            className="space-y-4"
          >
            {/* New Email */}
            <emailForm.Field name="email">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    <Trans i18nKey="profile.emailModal.newEmail">New Email</Trans>
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t('profile.emailModal.newEmailLabel', 'Enter your new email')}
                  />
                  {field.state.meta.errors.map(error => (
                    <p key={error?.message} className="text-red-500">
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </emailForm.Field>

            {/* Form Actions */}
            <emailForm.Subscribe selector={state => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <div className="grid grid-cols-2 gap-2 pt-4">
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? (
                      <Trans i18nKey="profile.emailModal.updating">Updating email...</Trans>
                    ) : (
                      <Trans i18nKey="profile.emailModal.update">Update Email</Trans>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => {
                      setIsEmailModalOpen(false);
                      emailForm.reset();
                    }}
                  >
                    <Trans i18nKey="profile.emailModal.close">Close</Trans>
                  </Button>
                </div>
              )}
            </emailForm.Subscribe>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Change Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="profile.passwordModal.title">Change Password</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans i18nKey="profile.passwordModal.description">
                Enter your current password and a new password to proceed
              </Trans>
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async e => {
              e.preventDefault();
              e.stopPropagation();
              await passwordForm.handleSubmit();
            }}
            className="space-y-4"
          >
            {/* Current Password */}
            <passwordForm.Field name="currentPassword">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    <Trans i18nKey="profile.passwordModal.oldPassword">Current Password</Trans>
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t(
                      'profile.passwordModal.oldPasswordLabel',
                      'Enter your current password'
                    )}
                  />
                  {field.state.meta.errors.map(error => (
                    <p key={error?.message} className="text-red-500">
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </passwordForm.Field>

            {/* New Password */}
            <passwordForm.Field name="newPassword">
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    <Trans i18nKey="profile.passwordModal.newPassword">New Password</Trans>
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t(
                      'profile.passwordModal.newPasswordLabel',
                      'Enter your new password'
                    )}
                  />
                  {field.state.meta.errors.map(error => (
                    <p key={error?.message} className="text-red-500">
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </passwordForm.Field>

            {/* Confirm Password */}
            <passwordForm.Field
              name="confirmPassword"
              validators={{
                onChangeListenTo: ['newPassword'],
              }}
            >
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    <Trans i18nKey="profile.passwordModal.confirmPassword">Confirm Password</Trans>
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder={t(
                      'profile.passwordModal.confirmPasswordLabel',
                      'Confirm your new password'
                    )}
                  />
                  {field.state.meta.errors.map(error => (
                    <p key={error?.message} className="text-red-500">
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </passwordForm.Field>

            {/* Form Actions */}
            <passwordForm.Subscribe selector={state => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <div className="grid grid-cols-2 gap-2 pt-4">
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? (
                      <Trans i18nKey="profile.passwordModal.updating">Updating password...</Trans>
                    ) : (
                      <Trans i18nKey="profile.passwordModal.update">Update Password</Trans>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => {
                      setIsPasswordModalOpen(false);
                      passwordForm.reset();
                    }}
                  >
                    <Trans i18nKey="profile.passwordModal.close">Close</Trans>
                  </Button>
                </div>
              )}
            </passwordForm.Subscribe>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
