import { useEffect, useMemo, useState } from 'react';
import { visiblePhotos, type FeedPhoto } from '../lib/feed';
import { subscribeToFeed } from '../services/photos';
import { errorMessage, type AsyncState } from '../lib/asyncState';

/** Live feed of visible photos (last 24 h, not hidden by reports). */
export function usePhotoFeed(now: Date): AsyncState<FeedPhoto[]> {
  const [state, setState] = useState<AsyncState<FeedPhoto[]>>({ status: 'loading' });

  useEffect(
    () =>
      subscribeToFeed(
        (photos) => setState({ status: 'ok', value: photos }),
        (error) => setState({ status: 'error', message: errorMessage(error) }),
      ),
    [],
  );

  return useMemo(
    () => (state.status === 'ok' ? { status: 'ok', value: visiblePhotos(state.value, now) } : state),
    [state, now],
  );
}
