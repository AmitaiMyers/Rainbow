import type { User } from 'firebase/auth';
import type { AsyncState } from '../lib/asyncState';
import type { LocationState } from '../hooks/useLocation';
import type { RainbowEstimate } from '../lib/rainbowForecast';
import { AlertsButton } from './AlertsButton';
import { CaptureButton } from './CaptureButton';
import { ScoreCard } from './ScoreCard';

interface Props {
  readonly location: LocationState;
  readonly onStartLocation: () => void;
  readonly rainbow: AsyncState<RainbowEstimate>;
  readonly user: User | null | undefined;
}

function LocalRainbow({ location, onStartLocation, rainbow }: Omit<Props, 'user'>) {
  switch (location.status) {
    case 'idle':
      return (
        <section className="card intro">
          <h2>Is there a rainbow near you?</h2>
          <p>We combine the sun's position with live weather around you to estimate the chance of a rainbow.</p>
          <button className="button primary" onClick={onStartLocation}>📍 Use my location</button>
        </section>
      );
    case 'locating':
      return <section className="card">Finding your location…</section>;
    case 'error':
      return (
        <section className="card">
          <p className="error">{location.message}</p>
          <button className="button secondary" onClick={onStartLocation}>Try again</button>
        </section>
      );
    case 'ok':
      if (rainbow.status === 'ok') return <ScoreCard estimate={rainbow.value} />;
      if (rainbow.status === 'error') return <section className="card error">{rainbow.message}</section>;
      return <section className="card">Checking the sky around you…</section>;
  }
}

export function NowView({ location, onStartLocation, rainbow, user }: Props) {
  return (
    <div className="view now">
      <LocalRainbow location={location} onStartLocation={onStartLocation} rainbow={rainbow} />
      {location.status === 'ok' && <AlertsButton />}
      <CaptureButton user={user} />
    </div>
  );
}
