import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getParticipant } from '@/lib/participants';
import { addFeedPost, deleteFeedPost, toggleReaction } from '@/lib/storage';
import { db, ref, onValue } from '@/lib/firebase';
import { timeAgo } from '@/lib/dateUtils';
import { toast } from 'sonner';

const TAGS = ['Geral', 'Treino', 'Corrida', 'Água'];
const TAG_COLORS: Record<string, string> = {
  Geral: '#6b7280',
  Treino: '#f59e0b',
  Corrida: '#3b82f6',
  Água: '#06b6d4',
};

export default function Feed() {
  const { currentUser } = useUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [tag, setTag] = useState('Geral');

  // Subscrição em tempo real ao feed do Firebase
  useEffect(() => {
    const unsub = onValue(ref(db, 'feed'), (snap) => {
      const data = snap.val();
      if (!data) { setPosts([]); return; }
      const list = Object.entries(data)
        .map(([id, val]: [string, any]) => ({ id, ...val }))
        .sort((a, b) => b.ts - a.ts);
      setPosts(list);
    });
    return () => unsub();
  }, []);

  if (!currentUser) return null;

  const handlePost = () => {
    if (!msg.trim()) return;
    addFeedPost({ userId: currentUser.id, msg: msg.trim(), tag, ts: Date.now(), reactions: {} });
    setMsg('');
    toast.success('Post publicado!', { duration: 1500 });
  };

  const handleDelete = (postId: string) => {
    deleteFeedPost(postId);
    toast.success('Post deletado', { duration: 1500 });
  };

  const handleReaction = (postId: string, type: 'fire' | 'like') => {
    const post = posts.find(p => p.id === postId);
    const hasReacted = !!(post?.reactions?.[type]?.[currentUser.id]);
    toggleReaction(postId, type, currentUser.id, hasReacted);
  };

  return (
    <div className="pb-24 px-4 max-w-[680px] mx-auto">
      <h2 className="text-lg font-bold py-4 text-foreground">Feed</h2>

      {/* Compose */}
      <div className="surface-1 rounded-xl p-4 border border-border mb-4">
        <textarea
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Compartilhe algo com o grupo..."
          className="w-full bg-transparent text-foreground text-sm resize-none outline-none placeholder:text-muted-foreground mb-3"
          rows={2}
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {TAGS.map(t => (
              <button
                key={t}
                onClick={() => setTag(t)}
                className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                style={{
                  backgroundColor: tag === t ? TAG_COLORS[t] + '30' : 'transparent',
                  color: tag === t ? TAG_COLORS[t] : 'hsl(240 5% 55%)',
                  border: `1px solid ${tag === t ? TAG_COLORS[t] + '50' : 'hsl(240 14% 16%)'}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={handlePost}
            disabled={!msg.trim()}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground disabled:opacity-40 transition-opacity ml-2 shrink-0"
          >
            Postar
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-3">
        {posts.map(post => {
          const author = getParticipant(post.userId);
          if (!author) return null;
          const fireCount = post.reactions?.fire ? Object.keys(post.reactions.fire).length : 0;
          const likeCount = post.reactions?.like ? Object.keys(post.reactions.like).length : 0;
          const hasFired = !!post.reactions?.fire?.[currentUser.id];
          const hasLiked = !!post.reactions?.like?.[currentUser.id];

          return (
            <div key={post.id} className="surface-1 rounded-xl p-4 border border-border animate-fade-in">
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: author.color + '20', color: author.color }}
                >
                  {author.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-foreground">{author.name}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(post.ts)}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: TAG_COLORS[post.tag] + '20', color: TAG_COLORS[post.tag] }}
                    >
                      {post.tag}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-foreground mb-2 whitespace-pre-wrap">{post.msg}</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleReaction(post.id, 'fire')}
                      className={`text-sm flex items-center gap-1 transition-transform active:scale-110 ${hasFired ? 'opacity-100' : 'opacity-50'}`}
                    >
                      🔥 {fireCount > 0 && <span className="text-xs text-muted-foreground">{fireCount}</span>}
                    </button>
                    <button
                      onClick={() => handleReaction(post.id, 'like')}
                      className={`text-sm flex items-center gap-1 transition-transform active:scale-110 ${hasLiked ? 'opacity-100' : 'opacity-50'}`}
                    >
                      👏 {likeCount > 0 && <span className="text-xs text-muted-foreground">{likeCount}</span>}
                    </button>
                    {post.userId === currentUser.id && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="ml-auto text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Deletar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {posts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum post ainda. Seja o primeiro! 💪
          </div>
        )}
      </div>
    </div>
  );
}
