import type { User } from 'firebase/auth';
import type { AsyncState } from '../lib/asyncState';
import type { FeedPhoto } from '../lib/feed';
import { PhotoCard } from './PhotoCard';

interface Props {
  readonly feed: AsyncState<FeedPhoto[]>;
  readonly user: User | null | undefined;
  readonly now: Date;
  readonly onOpen: (photo: FeedPhoto) => void;
}

export function FeedView({ feed, user, now, onOpen }: Props) {
  switch (feed.status) {
    case 'idle':
    case 'loading':
      return <div className="view feed"><p className="hint">Loading rainbows…</p></div>;
    case 'error':
      return <div className="view feed"><p className="error">Could not load the feed: {feed.message}</p></div>;
    case 'ok':
      return (
        <div className="view feed">
          <h2>Rainbows around the world · last 24 h</h2>
          {feed.value.length === 0 && <p className="hint">No rainbows yet today. Be the first to share one!</p>}
          {feed.value.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} user={user} now={now} onOpen={onOpen} />
          ))}
        </div>
      );
  }
}
