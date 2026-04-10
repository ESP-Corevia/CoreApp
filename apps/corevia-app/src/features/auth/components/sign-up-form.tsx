import { useForm } from '@tanstack/react-form';
import { Stethoscope, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { trpcClient } from '@/providers/trpc';

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const form = useForm({
    defaultValues: { name: '', email: '', password: '', role: 'patient' as 'patient' | 'doctor' },
    onSubmit: async ({ value }) => {
      // Step 1: Sign up (gets default role 'patient')
      await authClient.signUp.email(
        { email: value.email, password: value.password, name: value.name },
        {
          onSuccess: async () => {
            // Step 2: If doctor was selected, update role via tRPC
            if (value.role === 'doctor') {
              try {
                await trpcClient.user.setInitialRole.mutate({ role: 'doctor' });
              } catch {
                toast.error('Failed to set role. Please contact support.');
              }
            }
            toast.success(t('auth.signUp.success'));
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
        name: z.string().min(2, t('auth.signUp.errors.nameMin')),
        email: z.email(t('auth.signUp.errors.invalidEmail')),
        password: z
          .string()
          .min(8, t('auth.signUp.errors.shortPassword'))
          .max(100, t('auth.signUp.errors.longPassword')),
        role: z.enum(['patient', 'doctor']),
      }),
    },
  });

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="font-bold text-3xl tracking-tight">{t('auth.signUp.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('auth.signUp.subtitle')}</p>
      </div>

      <form
        onSubmit={async e => {
          e.preventDefault();
          await form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="role">
          {field => (
            <div className="space-y-2">
              <Label>{t('auth.signUp.role')}</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => field.handleChange('patient')}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                    field.state.value === 'patient'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50',
                  )}
                >
                  <User className="h-6 w-6" />
                  <span className="font-medium text-sm">{t('auth.signUp.rolePatient')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => field.handleChange('doctor')}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                    field.state.value === 'doctor'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50',
                  )}
                >
                  <Stethoscope className="h-6 w-6" />
                  <span className="font-medium text-sm">{t('auth.signUp.roleDoctor')}</span>
                </button>
              </div>
            </div>
          )}
        </form.Field>

        <form.Field name="name">
          {field => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>{t('auth.signUp.name')}</Label>
              <Input
                id={field.name}
                name={field.name}
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

        <form.Field name="email">
          {field => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>{t('auth.signUp.email')}</Label>
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
              <Label htmlFor={field.name}>{t('auth.signUp.password')}</Label>
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
              {state.isSubmitting ? t('auth.signUp.submitting') : t('auth.signUp.submit')}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="text-center">
        <Button variant="link" onClick={onSwitchToSignIn}>
          {t('auth.signUp.switchToSignIn')}
        </Button>
      </div>
    </div>
  );
}
