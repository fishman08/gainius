import { NavLink } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';

export default function NavBar() {
  const { theme } = useTheme();

  const linkStyle = {
    padding: '12px 20px',
    textDecoration: 'none',
    color: theme.colors.navBarText,
    opacity: 0.7,
    fontWeight: 600 as const,
  };

  const activeLinkStyle = {
    ...linkStyle,
    opacity: 1,
    borderBottom: `2px solid ${theme.colors.navBarActive}`,
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
        style={{ color: theme.colors.navBarText, fontWeight: 700, fontSize: 18, marginRight: 32 }}
      >
        Gainius
      </span>
      <NavLink to="/" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)} end>
        Chat
      </NavLink>
      <NavLink to="/workout" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}>
        Workout
      </NavLink>
      <NavLink to="/progress" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}>
        Progress
      </NavLink>
      <NavLink to="/settings" style={({ isActive }) => (isActive ? activeLinkStyle : linkStyle)}>
        Settings
      </NavLink>
    </nav>
  );
}
