import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { StorageProvider } from './providers/StorageProvider';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { SyncProvider } from './providers/SyncProvider';
import { NotificationBannerProvider } from './providers/NotificationBannerProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import NavBar from './components/NavBar';
import { useTheme } from './providers/ThemeProvider';
import ChatPage from './pages/ChatPage';
import { HomePage } from './pages/HomePage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

function AppContent() {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: `3px solid ${theme.colors.surfaceBorder}`,
            borderTopColor: theme.colors.primary,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <StorageProvider>
      <SyncProvider>
        <BrowserRouter>
          <NotificationBannerProvider>
            <NavBar />
            <Routes>
              <Route path="/" element={<ChatPage />} />
              <Route path="/workout" element={<HomePage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </NotificationBannerProvider>
        </BrowserRouter>
      </SyncProvider>
    </StorageProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
