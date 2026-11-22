import { NOTIFY, RAINBOW } from '../config/rainbow';
import type { RainbowEstimate } from '../lib/rainbowForecast';

function verdict(e: RainbowEstimate): string {
  if (e.sunElevationDeg <= 0) return 'The sun is down — rainbows need sunlight.';
  if (e.sunElevationDeg >= RAINBOW.maxSunElevationDeg) {
    return `The sun is too high (${Math.round(e.sunElevationDeg)}°). Rainbows appear when it is below ${RAINBOW.maxSunElevationDeg}° — try early morning or late afternoon.`;
  }
  if (e.clearFactor === 0) return 'No direct sunshine where you are right now.';
  if (e.rainFactor === 0) return `No rain toward the ${e.lookLabel} — a rainbow needs rain opposite the sun.`;
  if (e.score >= NOTIFY.minScore) return `Good chance! Turn your back to the sun and look ${e.lookLabel}.`;
  return `Some chance — keep an eye on the ${e.lookLabel}.`;
}

export function scoreClass(score: number): string {
  if (score >= NOTIFY.minScore) return 'high';
  if (score >= 30) return 'medium';
  if (score > 0) return 'low';
  return 'none';
}

function formatOptional(value: number | null, unit: string, digits: number): string {
  return value === null ? '—' : `${value.toFixed(digits)} ${unit}`;
}

export function ScoreCard({ estimate }: { estimate: RainbowEstimate }) {
  return (
    <section className={`card score ${scoreClass(estimate.score)}`}>
      <div className="score-top">
        <div className="score-value">{estimate.score}</div>
        <div>
          <div className="score-label">Rainbow chance</div>
          <div className="look">
            <span className="arrow" style={{ transform: `rotate(${estimate.lookBearingDeg}deg)` }}>↑</span>
            Look {estimate.lookLabel} ({Math.round(estimate.lookBearingDeg)}°)
          </div>
        </div>
      </div>
      <div className="meter"><div style={{ width: `${estimate.score}%` }} /></div>
      <p>{verdict(estimate)}</p>
      <dl className="details">
        <dt>Sun height</dt>
        <dd>{estimate.sunElevationDeg.toFixed(1)}°</dd>
        <dt>Sunshine on you</dt>
        <dd>{formatOptional(estimate.directRadiationWm2, 'W/m²', 0)}</dd>
        <dt>Rain opposite the sun</dt>
        <dd>{formatOptional(estimate.maxAntisolarPrecipitationMm, 'mm / 15 min', 2)}</dd>
        <dt>Updated</dt>
        <dd>{estimate.computedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</dd>
      </dl>
    </section>
  );
}
