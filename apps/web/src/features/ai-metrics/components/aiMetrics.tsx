import { AlertTriangle, Brain, Coins, MessageSquare, Users, Waypoints } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { type ComponentType, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetAiMetrics } from '@/queries';
import type {
  AiMetricsGroupBy,
  AiMetricsPreset,
  AiMetricsUserSort,
} from '@/queries/useGetAiMetrics';

const PRESETS: AiMetricsPreset[] = ['7d', '30d', '90d', 'custom'];
const GROUP_BY_VALUES: AiMetricsGroupBy[] = ['day', 'week'];
const USER_SORTS: AiMetricsUserSort[] = [
  'costDesc',
  'requestsDesc',
  'tokensDesc',
  'conversationsDesc',
];
const FEATURE_SORTS = ['costDesc', 'requestsDesc', 'tokensDesc', 'activeUsersDesc'] as const;
type UserSort = (typeof USER_SORTS)[number];
type FeatureSort = (typeof FEATURE_SORTS)[number];

function isPreset(value: string): value is AiMetricsPreset {
  return PRESETS.includes(value as AiMetricsPreset);
}

function isGroupBy(value: string): value is AiMetricsGroupBy {
  return GROUP_BY_VALUES.includes(value as AiMetricsGroupBy);
}

function isUserSort(value: string): value is UserSort {
  return USER_SORTS.includes(value as UserSort);
}

function isFeatureSort(value: string): value is FeatureSort {
  return FEATURE_SORTS.includes(value as FeatureSort);
}

export function parseDateInput(value: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateInput(date?: Date | string) {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatDayLabel(input: Date | string) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="font-bold text-2xl">{value}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(item => (
          <Card key={item} className="gap-4">
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-28" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Admin dashboard page showing mocked AI usage metrics for the mobile application.
 *
 * @param props - Authenticated session context required to fetch protected admin metrics.
 */
export default function AiMetrics({
  session,
}: {
  session: { isAuthenticated: boolean; userId: string } | null;
}) {
  const { t } = useTranslation();
  const [queryParams, setQueryParams] = useQueryStates({
    preset: parseAsString.withDefault('30d'),
    groupBy: parseAsString.withDefault('day'),
    from: parseAsString.withDefault(''),
    to: parseAsString.withDefault(''),
    limit: parseAsInteger.withDefault(10),
    userSort: parseAsString.withDefault('costDesc'),
    featureSort: parseAsString.withDefault('costDesc'),
  });

  const preset = isPreset(queryParams.preset) ? queryParams.preset : '30d';
  const groupBy = isGroupBy(queryParams.groupBy) ? queryParams.groupBy : 'day';
  const limit = [5, 10, 20].includes(queryParams.limit) ? queryParams.limit : 10;
  const userSort = isUserSort(queryParams.userSort) ? queryParams.userSort : 'costDesc';
  const featureSort = isFeatureSort(queryParams.featureSort) ? queryParams.featureSort : 'costDesc';
  const isCustomPreset = preset === 'custom';

  const from = isCustomPreset ? parseDateInput(queryParams.from) : undefined;
  const to = isCustomPreset ? parseDateInput(queryParams.to) : undefined;
  const isWaitingForCustomRange = isCustomPreset && (!from || !to);

  const { data, isLoading, error, isFetching, refetch } = useGetAiMetrics({
    preset,
    groupBy,
    limit,
    userSort,
    from,
    to,
    enabled: !!session?.isAuthenticated && !isWaitingForCustomRange,
  });

  useEffect(() => {
    if (error) {
      toast.error(
        t('aiMetrics.loadError', 'Failed to load AI metrics: {{message}}', {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }, [error, t]);

  const maxTrendCost = data?.trend.length
    ? Math.max(...data.trend.map(point => point.costUsd), 1)
    : 1;
  const sortedUsers = useMemo(() => data?.byUser ?? [], [data]);
  const sortedFeatures = useMemo(() => {
    if (!data) return [];
    const rows = [...data.byFeature];
    const comparator = (() => {
      if (featureSort === 'requestsDesc')
        return (a: (typeof rows)[number], b: (typeof rows)[number]) => b.requests - a.requests;
      if (featureSort === 'tokensDesc')
        return (a: (typeof rows)[number], b: (typeof rows)[number]) => b.tokens - a.tokens;
      if (featureSort === 'activeUsersDesc') {
        return (a: (typeof rows)[number], b: (typeof rows)[number]) =>
          b.activeUsers - a.activeUsers;
      }
      return (a: (typeof rows)[number], b: (typeof rows)[number]) => b.costUsd - a.costUsd;
    })();
    rows.sort(comparator);
    return rows;
  }, [data, featureSort]);

  if (!session?.isAuthenticated) {
    return null;
  }

  const hasLoadError = !!error && !data;
  const loadErrorMessage =
    error instanceof Error ? error.message : t('aiMetrics.error.unknown', 'Unknown error');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle>{t('aiMetrics.title', 'AI Metrics')}</CardTitle>
            <CardDescription>
              {t(
                'aiMetrics.description',
                'Measure AI API consumption by user and by mobile feature.',
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t('aiMetrics.mockedData', 'Mocked backend data')}</Badge>
            {isFetching ? (
              <Badge variant="outline">{t('aiMetrics.refreshing', 'Refreshing')}</Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map(value => (
              <Button
                key={value}
                variant={preset === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  void setQueryParams(
                    value === 'custom' ? { preset: value } : { preset: value, from: '', to: '' },
                  );
                }}
              >
                {value === '7d'
                  ? t('aiMetrics.filters.sevenDays', '7 Days')
                  : value === '30d'
                    ? t('aiMetrics.filters.thirtyDays', '30 Days')
                    : value === '90d'
                      ? t('aiMetrics.filters.ninetyDays', '90 Days')
                      : t('aiMetrics.filters.custom', 'Custom')}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                {t('aiMetrics.filters.groupBy', 'Group by')}
              </p>
              <Select
                value={groupBy}
                onValueChange={value => {
                  if (!isGroupBy(value)) return;
                  void setQueryParams({ groupBy: value });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{t('aiMetrics.filters.day', 'Day')}</SelectItem>
                  <SelectItem value="week">{t('aiMetrics.filters.week', 'Week')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                {t('aiMetrics.filters.topUsers', 'Top users')}
              </p>
              <Select
                value={String(limit)}
                onValueChange={value => {
                  const parsed = Number(value);
                  if (!Number.isFinite(parsed)) return;
                  void setQueryParams({ limit: parsed });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isCustomPreset ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {t('aiMetrics.filters.from', 'From')}
                  </p>
                  <Input
                    type="date"
                    aria-label={t('aiMetrics.filters.from', 'From')}
                    value={queryParams.from}
                    max={queryParams.to || undefined}
                    onChange={event => {
                      void setQueryParams({ preset: 'custom', from: event.target.value });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {t('aiMetrics.filters.to', 'To')}
                  </p>
                  <Input
                    type="date"
                    aria-label={t('aiMetrics.filters.to', 'To')}
                    value={queryParams.to}
                    min={queryParams.from || undefined}
                    onChange={event => {
                      void setQueryParams({ preset: 'custom', to: event.target.value });
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!queryParams.from && !queryParams.to}
                  onClick={() => {
                    void setQueryParams({ preset: 'custom', from: '', to: '' });
                  }}
                >
                  {t('aiMetrics.filters.resetDates', 'Reset dates')}
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {isWaitingForCustomRange ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('aiMetrics.customRange.title', 'Custom range pending')}</CardTitle>
            <CardDescription>
              {t(
                'aiMetrics.customRange.description',
                'Choose a valid start and end date to load custom metrics.',
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : isLoading && !data ? (
        <LoadingState />
      ) : hasLoadError ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('aiMetrics.error.title', 'Unable to load AI metrics')}</CardTitle>
            <CardDescription>
              {t('aiMetrics.error.description', 'Try again. Reason: {{message}}', {
                message: loadErrorMessage,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => {
                void refetch();
              }}
            >
              {t('aiMetrics.error.retry', 'Retry')}
            </Button>
          </CardContent>
        </Card>
      ) : !data ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              title={t('aiMetrics.summary.totalCost', 'Total Cost')}
              value={formatCurrency(data.summary.totalCostUsd)}
              description={t('aiMetrics.summary.totalCostDesc', 'Estimated OpenAI spend')}
              icon={Coins}
            />
            <MetricCard
              title={t('aiMetrics.summary.totalTokens', 'Total Tokens')}
              value={formatNumber(data.summary.totalTokens)}
              description={t('aiMetrics.summary.totalTokensDesc', 'Prompt + completion tokens')}
              icon={Brain}
            />
            <MetricCard
              title={t('aiMetrics.summary.totalRequests', 'Total Requests')}
              value={formatNumber(data.summary.totalRequests)}
              description={t('aiMetrics.summary.totalRequestsDesc', 'API calls on selected period')}
              icon={Waypoints}
            />
            <MetricCard
              title={t('aiMetrics.summary.totalConversations', 'Conversations')}
              value={formatNumber(data.summary.totalConversations)}
              description={t('aiMetrics.summary.totalConversationsDesc', 'Mobile AI conversations')}
              icon={MessageSquare}
            />
            <MetricCard
              title={t('aiMetrics.summary.activeUsers', 'Active Users')}
              value={formatNumber(data.summary.activeUsers)}
              description={t('aiMetrics.summary.activeUsersDesc', 'Unique users using AI features')}
              icon={Users}
            />
            <MetricCard
              title={t('aiMetrics.summary.errorRate', 'Error Rate')}
              value={formatPercent(data.summary.errorRate)}
              description={t('aiMetrics.summary.errorRateDesc', 'Failed requests ratio')}
              icon={AlertTriangle}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('aiMetrics.trend.title', 'Usage Trend')}</CardTitle>
                <CardDescription>
                  {t('aiMetrics.trend.description', 'Evolution of AI costs over time')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.trend.length ? (
                  data.trend.map(point => {
                    const width = `${Math.max(4, (point.costUsd / maxTrendCost) * 100)}%`;
                    return (
                      <div key={point.date.toString()} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {formatDayLabel(point.date)}
                          </span>
                          <span className="font-medium">{formatCurrency(point.costUsd)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-primary" style={{ width }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t('aiMetrics.empty.trend', 'No trend data for this period.')}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <CardTitle>{t('aiMetrics.byFeature.title', 'By Mobile Feature')}</CardTitle>
                  <CardDescription>
                    {t(
                      'aiMetrics.byFeature.description',
                      'API usage and costs by mobile capability',
                    )}
                  </CardDescription>
                </div>
                <div className="w-full max-w-52 space-y-2">
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    {t('aiMetrics.sort.label', 'Sort by')}
                  </p>
                  <Select
                    value={featureSort}
                    onValueChange={value => {
                      if (!isFeatureSort(value)) return;
                      void setQueryParams({ featureSort: value });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="costDesc">
                        {t('aiMetrics.sort.feature.costDesc', 'Cost (high to low)')}
                      </SelectItem>
                      <SelectItem value="requestsDesc">
                        {t('aiMetrics.sort.feature.requestsDesc', 'Requests (high to low)')}
                      </SelectItem>
                      <SelectItem value="tokensDesc">
                        {t('aiMetrics.sort.feature.tokensDesc', 'Tokens (high to low)')}
                      </SelectItem>
                      <SelectItem value="activeUsersDesc">
                        {t('aiMetrics.sort.feature.activeUsersDesc', 'Active users (high to low)')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('aiMetrics.byFeature.feature', 'Feature')}</TableHead>
                      <TableHead>{t('aiMetrics.byFeature.requests', 'Requests')}</TableHead>
                      <TableHead>{t('aiMetrics.byFeature.tokens', 'Tokens')}</TableHead>
                      <TableHead>{t('aiMetrics.byFeature.cost', 'Cost')}</TableHead>
                      <TableHead>{t('aiMetrics.byFeature.activeUsers', 'Active Users')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedFeatures.length ? (
                      sortedFeatures.map(item => (
                        <TableRow key={item.feature}>
                          <TableCell className="font-medium">{item.feature}</TableCell>
                          <TableCell>{formatNumber(item.requests)}</TableCell>
                          <TableCell>{formatNumber(item.tokens)}</TableCell>
                          <TableCell>{formatCurrency(item.costUsd)}</TableCell>
                          <TableCell>{formatNumber(item.activeUsers)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          {t('aiMetrics.empty.byFeature', 'No feature usage data for this period.')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <CardTitle>{t('aiMetrics.byUser.title', 'By User')}</CardTitle>
                <CardDescription>
                  {t(
                    'aiMetrics.byUser.description',
                    'Top users consuming AI APIs in the mobile app',
                  )}
                </CardDescription>
              </div>
              <div className="w-full max-w-52 space-y-2">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  {t('aiMetrics.sort.label', 'Sort by')}
                </p>
                <Select
                  value={userSort}
                  onValueChange={value => {
                    if (!isUserSort(value)) return;
                    void setQueryParams({ userSort: value });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="costDesc">
                      {t('aiMetrics.sort.user.costDesc', 'Cost (high to low)')}
                    </SelectItem>
                    <SelectItem value="requestsDesc">
                      {t('aiMetrics.sort.user.requestsDesc', 'Requests (high to low)')}
                    </SelectItem>
                    <SelectItem value="tokensDesc">
                      {t('aiMetrics.sort.user.tokensDesc', 'Tokens (high to low)')}
                    </SelectItem>
                    <SelectItem value="conversationsDesc">
                      {t('aiMetrics.sort.user.conversationsDesc', 'Conversations (high to low)')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('aiMetrics.byUser.user', 'User')}</TableHead>
                    <TableHead>{t('aiMetrics.byUser.requests', 'Requests')}</TableHead>
                    <TableHead>{t('aiMetrics.byUser.tokens', 'Tokens')}</TableHead>
                    <TableHead>{t('aiMetrics.byUser.conversations', 'Conversations')}</TableHead>
                    <TableHead>{t('aiMetrics.byUser.cost', 'Cost')}</TableHead>
                    <TableHead>{t('aiMetrics.byUser.errorRate', 'Error Rate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.length ? (
                    sortedUsers.map(item => (
                      <TableRow key={item.userId}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.userName}</span>
                            <span className="text-muted-foreground text-xs">{item.userEmail}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatNumber(item.requests)}</TableCell>
                        <TableCell>{formatNumber(item.tokens)}</TableCell>
                        <TableCell>{formatNumber(item.conversations)}</TableCell>
                        <TableCell>{formatCurrency(item.costUsd)}</TableCell>
                        <TableCell>{formatPercent(item.errorRate)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        {t('aiMetrics.empty.byUser', 'No user usage data for this period.')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-xs">
                {t(
                  'aiMetrics.generatedAt',
                  'Data available through {{date}} (mock backend data for this first iteration).',
                  {
                    date: formatDateInput(data.generatedAt),
                  },
                )}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
