import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';

export default function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        { email: value.email, password: value.password },
        {
          onSuccess: async () => {
            toast.success(t('auth.signIn.success'));
            await navigate('/', { replace: true });
          },
          onError: error => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email(t('auth.signIn.errors.invalidEmail')),
        password: z
          .string()
          .min(8, t('auth.signIn.errors.shortPassword'))
          .max(100, t('auth.signIn.errors.longPassword')),
      }),
    },
  });

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="font-bold text-3xl tracking-tight">{t('auth.signIn.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('auth.signIn.subtitle')}</p>
      </div>

      <form
        onSubmit={async e => {
          e.preventDefault();
          await form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="email">
          {field => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>{t('auth.signIn.email')}</Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map(error => (
                <p key={error?.message} className="text-destructive text-sm">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {field => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>{t('auth.signIn.password')}</Label>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map(error => (
                <p key={error?.message} className="text-destructive text-sm">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe>
          {state => (
            <Button
              type="submit"
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? t('auth.signIn.submitting') : t('auth.signIn.submit')}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="text-center">
        <Button variant="link" onClick={onSwitchToSignUp}>
          {t('auth.signIn.switchToSignUp')}
        </Button>
      </div>
    </div>
  );
}
