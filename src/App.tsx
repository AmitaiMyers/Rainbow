import { useState } from 'react';
import { AuthButton } from './components/AuthButton';
import { FeedView } from './components/FeedView';
import { MapView } from './components/MapView';
import { NowView } from './components/NowView';
import { PhotoViewer } from './components/PhotoViewer';
import { useAuth } from './hooks/useAuth';
import { useLocation } from './hooks/useLocation';
import { useNow } from './hooks/useNow';
import { usePhotoFeed } from './hooks/usePhotoFeed';
import { useRainbowWatch } from './hooks/useRainbowWatch';
import type { FeedPhoto } from './lib/feed';

type Tab = 'now' | 'map' | 'feed';

const TABS: readonly { readonly id: Tab; readonly label: string; readonly icon: string }[] = [
  { id: 'now', label: 'Now', icon: '🌈' },
  { id: 'map', label: 'Map', icon: '🗺️' },
  { id: 'feed', label: 'Feed', icon: '📸' },
];

export function App() {
  const [tab, setTab] = useState<Tab>('now');
  const [selected, setSelected] = useState<FeedPhoto | null>(null);
  const user = useAuth();
  const location = useLocation();
  const position = location.state.status === 'ok' ? location.state.position : null;
  // Runs on every tab so alerts keep working while the user browses the map or feed.
  const rainbow = useRainbowWatch(position);
  const now = useNow(60_000);
  const feed = usePhotoFeed(now);

  return (
    <div className="app">
      <header className="topbar">
        <h1>Rainbow Finder</h1>
        <AuthButton user={user} />
      </header>
      <main>
        {tab === 'now' && (
          <NowView location={location.state} onStartLocation={location.start} rainbow={rainbow} user={user} />
        )}
        {tab === 'map' && (
          <MapView photos={feed.status === 'ok' ? feed.value : []} position={position} onSelectPhoto={setSelected} />
        )}
        {tab === 'feed' && <FeedView feed={feed} user={user} now={now} onOpen={setSelected} />}
      </main>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
      {selected !== null && <PhotoViewer photo={selected} now={now} onClose={() => setSelected(null)} />}
    </div>
  );
}
