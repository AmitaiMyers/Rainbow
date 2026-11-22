import { useEffect, useState } from 'react';
import { errorMessage, type AsyncState } from '../lib/asyncState';
import type { FeedPhoto } from '../lib/feed';
import { timeAgo } from '../lib/time';
import { loadFullImage } from '../services/photos';

interface Props {
  readonly photo: FeedPhoto;
  readonly now: Date;
  readonly onClose: () => void;
}

export function PhotoViewer({ photo, now, onClose }: Props) {
  const [image, setImage] = useState<AsyncState<string>>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setImage({ status: 'loading' });
    loadFullImage(photo.id).then(
      (value) => !cancelled && setImage({ status: 'ok', value }),
      (error: unknown) => !cancelled && setImage({ status: 'error', message: errorMessage(error) }),
    );
    return () => {
      cancelled = true;
    };
  }, [photo.id]);

  return (
    <div className="viewer" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="viewer-body" onClick={(e) => e.stopPropagation()}>
        <button className="viewer-close" onClick={onClose} aria-label="Close">✕</button>
        {image.status === 'ok' ? (
          <img src={image.value} alt="Rainbow" />
        ) : (
          <img src={photo.thumb} alt="Rainbow (loading full size)" className="blurred" />
        )}
        {image.status === 'error' && <p className="error">{image.message}</p>}
        <p>
          <strong>{photo.authorName}</strong> · {timeAgo(photo.createdAt, now)} · {photo.lat.toFixed(2)},{' '}
          {photo.lon.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
