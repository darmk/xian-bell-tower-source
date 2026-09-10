import { Check, MessageCircleMore, ScanLine } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { followGateConfig } from './follow-gate-config';
import { publicAsset } from './public-asset';

function wasGranted() {
  try {
    return localStorage.getItem(followGateConfig.storageKey) === 'granted';
  } catch {
    return false;
  }
}

/**
 * Keeps the 3D application unmounted until the visitor elects to continue.
 * localStorage is shared by every path on the same origin, so future projects
 * can reuse the same storageKey to share this lightweight access state.
 */
export default function FollowGate({ children }: { children: ReactNode }) {
  const [granted, setGranted] = useState(() => !followGateConfig.enabled || wasGranted());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === followGateConfig.storageKey && event.newValue === 'granted') setGranted(true);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function enterExperience() {
    try {
      localStorage.setItem(followGateConfig.storageKey, 'granted');
    } catch {
      // Privacy modes may block storage. Keep the visitor in the current session.
    }
    setGranted(true);
  }

  if (granted) return <>{children}</>;

  return <main className="follow-gate" aria-labelledby="follow-gate-title">
    <section className="follow-gate-card">
      <div className="follow-gate-seal" aria-hidden="true"><MessageCircleMore size={28} strokeWidth={1.35} /></div>
      <p className="follow-gate-eyebrow">{followGateConfig.eyebrow}</p>
      <h1 id="follow-gate-title">{followGateConfig.title}</h1>
      <p className="follow-gate-copy">{followGateConfig.description}</p>

      <div className="follow-gate-qr-wrap">
        <img
          className="follow-gate-qr"
          src={publicAsset(followGateConfig.qrCodePath)}
          alt={`“${followGateConfig.accountName}”公众号二维码`}
          width="860"
          height="860"
        />
      </div>
      <p className="follow-gate-scan"><ScanLine size={17} strokeWidth={1.45} /> 请使用微信扫一扫</p>

      <button className="follow-gate-enter" type="button" onClick={enterExperience}>
        <span>{followGateConfig.confirmLabel}</span><Check size={20} strokeWidth={1.8} />
      </button>
      <p className="follow-gate-helper">{followGateConfig.helperText}</p>
    </section>
  </main>;
}
