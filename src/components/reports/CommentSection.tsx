'use client';

import { useState }    from 'react';
import { useAddComment } from '@/hooks/useReports';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button }      from '@/components/ui/button';
import { Textarea }    from '@/components/ui/textarea';
import { getInitials, formatTime } from '@/lib/utils';
import { Send }        from 'lucide-react';
import type { Comment } from '@/types';

interface Props {
  reportId: string;
  comments: Comment[];
  currentUserId: string;
}

export function CommentSection({ reportId, comments, currentUserId }: Props) {
  const [text, setText]   = useState('');
  const addComment        = useAddComment(reportId);

  const handleSubmit = () => {
    if (!text.trim()) return;
    addComment.mutate(text.trim(), {
      onSuccess: () => setText(''),
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">
        Comments ({comments.length})
      </h4>

      {comments.length === 0 && (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      )}

      <div className="space-y-3 max-h-48 overflow-y-auto">
        {comments.map(c => (
          <div key={c.id} className="flex gap-2">
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarFallback className="text-xs">
                {getInitials(c.user?.full_name ?? '?')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">{c.user?.full_name}</span>
                <span className="text-xs text-muted-foreground">{formatTime(c.created_at)}</span>
              </div>
              <p className="text-sm">{c.comment}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
          className="flex-1 resize-none"
        />
        <Button size="icon" onClick={handleSubmit}
          disabled={!text.trim() || addComment.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}