import type { User } from 'firebase/auth';
import { useState } from 'react';
import { errorMessage, type AsyncState } from '../lib/asyncState';
import type { FeedPhoto } from '../lib/feed';
import { timeAgo } from '../lib/time';
import { deletePhoto, reportPhoto } from '../services/photos';

interface Props {
  readonly photo: FeedPhoto;
  readonly user: User | null | undefined;
  readonly now: Date;
  readonly onOpen: (photo: FeedPhoto) => void;
}

export function PhotoCard({ photo, user, now, onOpen }: Props) {
  const [action, setAction] = useState<AsyncState<string>>({ status: 'idle' });
  const isOwner = user != null && user.uid === photo.uid;

  const perform = (task: () => Promise<void>, done: string) => {
    setAction({ status: 'loading' });
    task().then(
      () => setAction({ status: 'ok', value: done }),
      (error: unknown) => setAction({ status: 'error', message: errorMessage(error) }),
    );
  };

  const onReport = (reporter: User) => {
    if (!window.confirm('Report this photo as inappropriate or not a rainbow?')) return;
    perform(() => reportPhoto(photo.id, reporter.uid), 'Thanks — reported.');
  };

  const onDelete = () => {
    if (!window.confirm('Delete your photo?')) return;
    perform(() => deletePhoto(photo.id), 'Deleted.');
  };

  return (
    <article className="card photo-card">
      <button className="thumb" onClick={() => onOpen(photo)} aria-label="Open photo">
        <img src={photo.thumb} alt="Rainbow" />
      </button>
      <div className="photo-meta">
        <div className="author">
          {photo.authorPhoto !== '' && <img className="avatar" src={photo.authorPhoto} alt="" referrerPolicy="no-referrer" />}
          <strong>{photo.authorName}</strong>
        </div>
        <div className="muted">
          {timeAgo(photo.createdAt, now)} · {photo.lat.toFixed(2)}, {photo.lon.toFixed(2)}
        </div>
        <div className="actions">
          {isOwner && (
            <button className="button small ghost" disabled={action.status === 'loading'} onClick={onDelete}>
              Delete
            </button>
          )}
          {user != null && !isOwner && (
            <button className="button small ghost" disabled={action.status === 'loading'} onClick={() => onReport(user)}>
              Report
            </button>
          )}
        </div>
        {action.status === 'ok' && <div className="success small">{action.value}</div>}
        {action.status === 'error' && <div className="error small">{action.message}</div>}
      </div>
    </article>
  );
}
