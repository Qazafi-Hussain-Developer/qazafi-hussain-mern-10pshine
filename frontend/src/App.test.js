import { jest } from '@jest/globals';

jest.unstable_mockModule('react-router-dom', () => ({
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  Navigate: () => null,
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  Link: ({ children }) => children,
  NavLink: ({ children }) => children,
  useLocation: () => ({ pathname: '/' }),
}));

jest.unstable_mockModule('./context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, loading: false }),
}));

jest.unstable_mockModule('./pages/Login/Login', () => ({ default: () => 'Login' }));
jest.unstable_mockModule('./pages/SignUp/SignUp', () => ({ default: () => 'SignUp' }));
jest.unstable_mockModule('./pages/Dashboard/Dashboard', () => ({ default: () => 'Dashboard' }));
jest.unstable_mockModule('./pages/NoteEditor/NoteEditor', () => ({ default: () => 'NoteEditor' }));
jest.unstable_mockModule('./pages/Profile/Profile', () => ({ default: () => 'Profile' }));
jest.unstable_mockModule('./pages/Settings/Settings', () => ({ default: () => 'Settings' }));
jest.unstable_mockModule('./pages/Trash/Trash', () => ({ default: () => 'Trash' }));

const { render } = await import('@testing-library/react');
const { default: App } = await import('./App.jsx');

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeDefined();
  });
});