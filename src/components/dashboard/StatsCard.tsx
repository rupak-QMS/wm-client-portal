import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const colorMap = {
  blue:   { bg: 'rgba(59,130,246,0.1)',  text: 'rgb(96,165,250)',  border: 'rgba(59,130,246,0.2)'  },
  green:  { bg: 'rgba(34,197,94,0.1)',   text: 'rgb(74,222,128)',  border: 'rgba(34,197,94,0.2)'   },
  amber:  { bg: 'rgba(245,158,11,0.1)',  text: 'rgb(251,191,36)',  border: 'rgba(245,158,11,0.2)'  },
  purple: { bg: 'rgba(168,85,247,0.1)',  text: 'rgb(192,132,252)', border: 'rgba(168,85,247,0.2)'  },
};

interface Props {
  title:   string;
  value:   number | string;
  icon:    LucideIcon;
  color:   keyof typeof colorMap;
  trend?:  'up' | 'down';
  suffix?: string;
}

export function StatsCard({ title, value, icon: Icon, color, trend, suffix }: Props) {
  const c = colorMap[color];
  return (
    <Card className="border-border/50 hover:border-border/80 transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-3xl font-bold mt-2 text-foreground">
              {value}
              {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
            </p>
          </div>
          <div className="p-2.5 rounded-xl flex-shrink-0"
            style={{ background: c.bg, border: `1px solid ${c.border}` }}>
            <Icon className="h-5 w-5" style={{ color: c.text }} />
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
