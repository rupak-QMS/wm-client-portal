import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const colorMap = {
  blue:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20' },
  green:  { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20' },
  amber:  { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

interface Props {
  title:  string;
  value:  number | string;
  icon:   LucideIcon;
  color:  keyof typeof colorMap;
  trend?: 'up' | 'down';
  suffix?: string;
}

export function StatsCard({ title, value, icon: Icon, color, trend, suffix }: Props) {
  const c = colorMap[color];
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold">
              {value}{suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
            </p>
          </div>
          <div className={cn('p-2.5 rounded-xl border', c.bg, c.border)}>
            <Icon className={cn('h-5 w-5', c.text)} />
          </div>
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 mt-3 text-xs font-medium',
            trend === 'up' ? 'text-amber-400' : 'text-green-400'
          )}>
            {trend === 'up'
              ? <TrendingUp className="h-3 w-3" />
              : <TrendingDown className="h-3 w-3" />
            }
            {trend === 'up' ? 'Requires attention' : 'All good'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
