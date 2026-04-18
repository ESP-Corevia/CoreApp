import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

interface InfiniteListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  emptyIcon?: React.ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
  skeletonCount?: number;
  skeletonHeight?: string;
}

export function InfiniteList<T>({
  items,
  renderItem,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  skeletonCount = 3,
  skeletonHeight = 'h-24',
}: InfiniteListProps<T>) {
  const { t } = useTranslation();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className={`w-full rounded-xl ${skeletonHeight}`} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {emptyIcon && <div className="mb-4 text-muted-foreground">{emptyIcon}</div>}
        <h3 className="font-medium text-lg">{emptyTitle}</h3>
        {emptyDescription && (
          <p className="mt-1 text-muted-foreground text-sm">{emptyDescription}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => renderItem(item, index))}
      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className={`w-full rounded-xl ${skeletonHeight}`} />
          ))}
        </div>
      )}
      {!hasNextPage && items.length > 0 && (
        <p className="py-4 text-center text-muted-foreground text-sm">{t('common.noMore')}</p>
      )}
    </div>
  );
}
