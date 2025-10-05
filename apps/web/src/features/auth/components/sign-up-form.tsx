import { useForm } from '@tanstack/react-form';

import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import z from 'zod';

import { authClient } from '@/lib/auth-client';

import Loader from '../../../components/loader';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      name: '',
      firstName: '',
      lastName: '',
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
          // @ts-expect-error
          firstName: value.firstName,
          lastName: value.lastName,
        },
        {
          onSuccess: async () => {
            await navigate('/dashboard');
            toast.success(t('signUp.success', 'Sign up successful'));
          },
          onError: error => {
            toast.error(error.error.message || error.error.statusText);
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, t('signUp.form.name.min', 'Name must be at least 2 characters')),
        email: z.email(t('signUp.form.email.invalid', 'Invalid email address')),
        password: z
          .string()
          .min(8, t('signUp.form.password.min', 'Password must be at least 8 characters')),
        firstName: z
          .string()
          .min(2, t('signUp.form.firstName.min', 'First name must be at least 2 characters')),
        lastName: z
          .string()
          .min(2, t('signUp.form.lastName.min', 'Last name must be at least 2 characters')),
      }),
    },
  });

  if (isPending) {
    return <Loader open />;
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">
        <Trans i18nKey="signUp.title">Create Account</Trans>
      </h1>

      <form
        onSubmit={async e => {
          e.preventDefault();
          e.stopPropagation();
          await form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <form.Field name="name">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="signUp.form.name.label">Name</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="email">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="signUp.form.email.label">Email</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="firstName">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="signUp.form.firstName.label">First Name</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>
        <div>
          <form.Field name="lastName">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="signUp.form.lastName.label">Last Name</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>
        <div>
          <form.Field name="password">
            {field => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  <Trans i18nKey="signUp.form.password.label">Password</Trans>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map(error => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe>
          {state => (
            <Button
              type="submit"
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? (
                <Trans i18nKey="signUp.form.submit.loading">Submitting...</Trans>
              ) : (
                <Trans i18nKey="signUp.form.submit">Sign Up</Trans>
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignIn}
          className="text-indigo-600 hover:text-indigo-800"
        >
          <Trans i18nKey="signUp.switchToSignIn">Already have an account? Sign In</Trans>
        </Button>
      </div>
    </div>
  );
}
