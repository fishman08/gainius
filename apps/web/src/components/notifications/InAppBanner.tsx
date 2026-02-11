import { useState, useEffect } from 'react';

export type BannerType = 'info' | 'success' | 'warning';

interface InAppBannerProps {
  title: string;
  body: string;
  type: BannerType;
  onDismiss: () => void;
}

const COLORS: Record<BannerType, { bg: string; border: string; text: string }> = {
  info: { bg: '#E3F2FD', border: '#90CAF9', text: '#1565C0' },
  success: { bg: '#E8F5E9', border: '#A5D6A7', text: '#2E7D32' },
  warning: { bg: '#FFF3E0', border: '#FFCC80', text: '#E65100' },
};

export function InAppBanner({ title, body, type, onDismiss }: InAppBannerProps) {
  const [visible, setVisible] = useState(true);
  const colors = COLORS[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 56,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: '12px 20px',
        maxWidth: 480,
        width: '90%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div>
        <div style={{ fontWeight: 600, color: colors.text, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 14, color: colors.text }}>{body}</div>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          onDismiss();
        }}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontSize: 18,
          color: colors.text,
          padding: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
