import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const colorMap = {
  blue:   'bg-blue-50 text-blue-600   dark:bg-blue-950/50 dark:text-blue-400',
  green:  'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400',
  amber:  'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
};

interface Props {
  title: string;
  value: number | string;
  icon:  LucideIcon;
  color: keyof typeof colorMap;
  trend?: 'up' | 'down';
}

export function StatsCard({ title, value, icon: Icon, color, trend }: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={cn('p-3 rounded-xl', colorMap[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <TrendingUp className="h-3 w-3" />
            Requires attention
          </div>
        )}
      </CardContent>
    </Card>
  );
}