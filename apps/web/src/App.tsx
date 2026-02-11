import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { StorageProvider } from './providers/StorageProvider';
import { AuthProvider } from './providers/AuthProvider';
import { SyncProvider } from './providers/SyncProvider';
import { NotificationBannerProvider } from './providers/NotificationBannerProvider';
import NavBar from './components/NavBar';
import ChatPage from './pages/ChatPage';
import { HomePage } from './pages/HomePage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
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
      </AuthProvider>
    </Provider>
  );
}

export default App;
