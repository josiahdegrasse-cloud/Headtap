import { useEffect, useState } from 'react';
import { Music } from 'lucide-react';
export function ConcertImage({src, fallback, artist, eager = false}: {src?: string; fallback?: string; artist: string; eager?: boolean}) {
  const [failed, setFailed] = useState<string[]>([]);
  useEffect(() => setFailed([]), [src, fallback]);
  const image = [src, fallback].find(url => url && !failed.includes(url));
  if (!image) return <div className="h-full w-full bg-gradient-to-br from-orange-900 via-amber-800 to-orange-600 flex flex-col items-center justify-center text-white gap-3"><Music className="h-10 w-10"/><span className="font-semibold text-xl px-6 text-center">{artist}</span></div>;
  return <img src={image} alt={artist} loading={eager ? 'eager' : 'lazy'} decoding="async" width={800} height={450} onError={() => setFailed(previous => [...previous, image])} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />;
}
