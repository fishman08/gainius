import { useAuth } from '../providers/AuthProvider';

export function useUserId(): string {
  const { user } = useAuth();
  return user?.id ?? 'local-user';
}
