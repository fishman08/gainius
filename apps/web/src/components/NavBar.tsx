import { NavLink } from 'react-router-dom';

const linkStyle = {
  padding: '12px 20px',
  textDecoration: 'none',
  color: '#fff',
  opacity: 0.7,
  fontWeight: 600 as const,
};

const activeLinkStyle = {
  ...linkStyle,
  opacity: 1,
  borderBottom: '2px solid #fff',
};

export default function NavBar() {
  return (
    <nav
      style={{
        display: 'flex',
        backgroundColor: '#4A90E2',
        padding: '0 16px',
        alignItems: 'center',
      }}
    >
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginRight: 32 }}>Gainius</span>
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
