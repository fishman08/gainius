import { NavLink } from 'react-router-dom';
import { MessageSquare, Dumbbell, TrendingUp, Settings } from 'lucide-react';
import { useTheme } from '../providers/ThemeProvider';

export default function NavBar() {
  const { theme } = useTheme();

  const linkStyle: React.CSSProperties = {
    padding: '12px 20px',
    textDecoration: 'none',
    color: theme.colors.navBarText,
    opacity: 0.65,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  const activeLinkStyle: React.CSSProperties = {
    ...linkStyle,
    opacity: 1,
    borderBottom: `3px solid ${theme.colors.navBarActive}`,
  };

  return (
    <nav
      style={{
        display: 'flex',
        backgroundColor: theme.colors.navBar,
        padding: '0 16px',
        alignItems: 'center',
      }}
    >
      <span
        style={{
          color: theme.colors.navBarActive,
          fontWeight: 700,
          fontSize: 20,
          marginRight: 32,
          fontFamily: "'Barlow Condensed', sans-serif",
        }}
      >
        Gainius
      </span>
      <NavLink to="/" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)} end>
        <MessageSquare size={18} />
        Chat
      </NavLink>
      <NavLink to="/workout" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}>
        <Dumbbell size={18} />
        Workout
      </NavLink>
      <NavLink to="/progress" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}>
        <TrendingUp size={18} />
        Progress
      </NavLink>
      <NavLink to="/settings" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}>
        <Settings size={18} />
        Settings
      </NavLink>
    </nav>
  );
}
