import type { User } from 'firebase/auth';
import { useRef, useState, type ChangeEvent } from 'react';
import { errorMessage, type AsyncState } from '../lib/asyncState';
import { shareRainbowPhoto } from '../services/photos';

export function CaptureButton({ user }: { user: User | null | undefined }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<AsyncState<string>>({ status: 'idle' });

  if (user === undefined) return null;
  if (user === null) return <p className="hint">Sign in to share your rainbow photos with the world.</p>;

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0) ?? null;
    event.target.value = '';
    if (file === null) return;
    setUpload({ status: 'loading' });
    shareRainbowPhoto(user, file).then(
      (id) => setUpload({ status: 'ok', value: id }),
      (error: unknown) => setUpload({ status: 'error', message: errorMessage(error) }),
    );
  };

  return (
    <div className="capture">
      <button
        className="button primary big"
        disabled={upload.status === 'loading'}
        onClick={() => inputRef.current?.click()}
      >
        {upload.status === 'loading' ? 'Uploading…' : '📷 I see a rainbow!'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      {upload.status === 'ok' && <p className="success">Shared! Everyone can see your rainbow now.</p>}
      {upload.status === 'error' && <p className="error">{upload.message}</p>}
    </div>
  );
}
