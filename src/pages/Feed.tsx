import { useState, useEffect, useRef } from 'react';
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

interface GpxStats {
  distance: number;  // km
  duration: number;  // minutes
  elevGain: number;  // meters
  pace: string;      // "m:ss/km"
}

function compressImage(file: File, maxWidth = 900, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseGPX(text: string): GpxStats | null {
  try {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const pts = Array.from(doc.querySelectorAll('trkpt'));
    if (pts.length < 2) return null;

    let dist = 0;
    let elevGain = 0;
    const times: Date[] = [];

    for (let i = 1; i < pts.length; i++) {
      const lat1 = parseFloat(pts[i - 1].getAttribute('lat') || '0');
      const lon1 = parseFloat(pts[i - 1].getAttribute('lon') || '0');
      const lat2 = parseFloat(pts[i].getAttribute('lat') || '0');
      const lon2 = parseFloat(pts[i].getAttribute('lon') || '0');
      dist += haversine(lat1, lon1, lat2, lon2);

      const e1 = parseFloat(pts[i - 1].querySelector('ele')?.textContent || '0');
      const e2 = parseFloat(pts[i].querySelector('ele')?.textContent || '0');
      if (e2 > e1) elevGain += e2 - e1;
    }

    pts.forEach(pt => {
      const t = pt.querySelector('time')?.textContent;
      if (t) times.push(new Date(t));
    });

    const duration =
      times.length >= 2
        ? (times[times.length - 1].getTime() - times[0].getTime()) / 1000 / 60
        : 0;

    const pace = dist > 0 && duration > 0 ? duration / dist : 0;
    const paceStr =
      pace > 0
        ? `${Math.floor(pace)}:${String(Math.round((pace % 1) * 60)).padStart(2, '0')}/km`
        : '—';

    return {
      distance: Math.round(dist * 100) / 100,
      duration: Math.round(duration),
      elevGain: Math.round(elevGain),
      pace: paceStr,
    };
  } catch {
    return null;
  }
}

export default function Feed() {
  const { currentUser } = useUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [tag, setTag] = useState('Geral');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [gpxStats, setGpxStats] = useState<GpxStats | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onValue(ref(db, 'feed'), snap => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setGpxStats(null);
    setPreview(null);

    if (f.name.endsWith('.gpx')) {
      setTag('Corrida');
      const reader = new FileReader();
      reader.onload = ev => {
        const stats = parseGPX(ev.target?.result as string);
        setGpxStats(stats);
      };
      reader.readAsText(f);
    } else if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setGpxStats(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handlePost = async () => {
    if (!msg.trim() && !file) return;
    setUploading(true);

    try {
      let imageUrl: string | undefined;

      if (file && file.type.startsWith('image/')) {
        imageUrl = await compressImage(file);
      }

      addFeedPost({
        userId: currentUser.id,
        msg: msg.trim(),
        tag,
        ts: Date.now(),
        reactions: {},
        ...(imageUrl ? { imageUrl } : {}),
        ...(gpxStats ? { gpx: gpxStats } : {}),
      });

      setMsg('');
      clearFile();
      toast.success('Post publicado!', { duration: 1500 });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao publicar. Tente novamente.');
    } finally {
      setUploading(false);
    }
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

  const canPost = (!!msg.trim() || !!file) && !uploading;

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

        {/* Image preview */}
        {preview && (
          <div className="relative mb-3 rounded-lg overflow-hidden">
            <img src={preview} alt="preview" className="max-h-48 w-full object-cover rounded-lg" />
            <button
              onClick={clearFile}
              className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        )}

        {/* GPX preview */}
        {gpxStats && (
          <div className="mb-3 rounded-lg p-3 flex items-center gap-3 text-sm" style={{ backgroundColor: '#3b82f620', border: '1px solid #3b82f640' }}>
            <span className="text-xl">🏃</span>
            <div className="flex gap-4 flex-wrap text-xs">
              <span><strong>{gpxStats.distance} km</strong></span>
              <span>{gpxStats.duration} min</span>
              <span>⛰ {gpxStats.elevGain} m</span>
              <span>⏱ {gpxStats.pace}</span>
            </div>
            <button onClick={clearFile} className="ml-auto text-muted-foreground hover:text-destructive text-xs">✕</button>
          </div>
        )}

        {/* File attachment name (non-image, non-gpx) */}
        {file && !preview && !gpxStats && (
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>📎 {file.name}</span>
            <button onClick={clearFile} className="hover:text-destructive">✕</button>
          </div>
        )}

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
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {/* Attach button */}
            <button
              onClick={() => fileRef.current?.click()}
              className="text-muted-foreground hover:text-foreground transition-colors text-lg"
              title="Foto ou arquivo GPX (Strava)"
            >
              📎
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.gpx"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={handlePost}
              disabled={!canPost}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
            >
              {uploading ? '...' : 'Postar'}
            </button>
          </div>
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
                  {post.msg && (
                    <p className="text-sm text-secondary-foreground mb-2 whitespace-pre-wrap">{post.msg}</p>
                  )}

                  {/* Image attachment */}
                  {post.imageUrl && (
                    <div className="mb-2 rounded-lg overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt="foto"
                        className="w-full max-h-72 object-cover rounded-lg cursor-pointer"
                        onClick={() => window.open(post.imageUrl, '_blank')}
                      />
                    </div>
                  )}

                  {/* GPX stats card */}
                  {post.gpx && (
                    <div className="mb-2 rounded-lg p-3 flex items-center gap-3" style={{ backgroundColor: '#3b82f615', border: '1px solid #3b82f630' }}>
                      <span className="text-2xl">🏃</span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                        <span className="text-muted-foreground">Distância</span>
                        <span className="font-semibold text-foreground">{post.gpx.distance} km</span>
                        <span className="text-muted-foreground">Duração</span>
                        <span className="font-semibold text-foreground">{post.gpx.duration} min</span>
                        <span className="text-muted-foreground">Elevação</span>
                        <span className="font-semibold text-foreground">{post.gpx.elevGain} m</span>
                        <span className="text-muted-foreground">Pace</span>
                        <span className="font-semibold text-foreground">{post.gpx.pace}</span>
                      </div>
                    </div>
                  )}

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
