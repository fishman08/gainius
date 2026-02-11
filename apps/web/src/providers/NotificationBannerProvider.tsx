import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { InAppBanner } from '../components/notifications/InAppBanner';
import type { BannerType } from '../components/notifications/InAppBanner';

interface BannerItem {
  id: number;
  title: string;
  body: string;
  type: BannerType;
}

interface NotificationBannerContextValue {
  showBanner: (title: string, body: string, type: BannerType) => void;
}

const NotificationBannerContext = createContext<NotificationBannerContextValue>({
  showBanner: () => {},
});

export function useNotificationBanner() {
  return useContext(NotificationBannerContext);
}

let nextId = 0;

export function NotificationBannerProvider({ children }: { children: ReactNode }) {
  const [banners, setBanners] = useState<BannerItem[]>([]);

  const showBanner = useCallback((title: string, body: string, type: BannerType) => {
    const id = ++nextId;
    setBanners((prev) => [...prev, { id, title, body, type }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return (
    <NotificationBannerContext.Provider value={{ showBanner }}>
      {children}
      {banners.map((b) => (
        <InAppBanner
          key={b.id}
          title={b.title}
          body={b.body}
          type={b.type}
          onDismiss={() => dismiss(b.id)}
        />
      ))}
    </NotificationBannerContext.Provider>
  );
}
