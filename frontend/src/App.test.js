import { jest } from '@jest/globals';

jest.unstable_mockModule('react-router-dom', () => ({
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  Navigate: () => null,
  Outlet: () => 'Outlet',
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  Link: ({ children }) => children,
  NavLink: ({ children }) => children,
  useLocation: () => ({ pathname: '/' }),
  BrowserRouter: ({ children }) => children,
}));

jest.unstable_mockModule('./context/AuthContext', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false }),
  AuthProvider: ({ children }) => children,
}));

jest.unstable_mockModule('./pages/Login/Login', () => ({ default: () => 'Login' }));
jest.unstable_mockModule('./pages/SignUp/SignUp', () => ({ default: () => 'SignUp' }));
jest.unstable_mockModule('./pages/Dashboard/Dashboard', () => ({ default: () => 'Dashboard' }));
jest.unstable_mockModule('./pages/NoteEditor/NoteEditor', () => ({ default: () => 'NoteEditor' }));
jest.unstable_mockModule('./pages/Profile/Profile', () => ({ default: () => 'Profile' }));
jest.unstable_mockModule('./pages/Settings/Settings', () => ({ default: () => 'Settings' }));
jest.unstable_mockModule('./pages/Trash/Trash', () => ({ default: () => 'Trash' }));
jest.unstable_mockModule('./pages/VerifyOTP/VerifyOTP', () => ({ default: () => 'VerifyOTP' }));
jest.unstable_mockModule('./pages/ForgotPassword/ForgotPassword', () => ({ default: () => 'ForgotPassword' }));
jest.unstable_mockModule('./pages/ResetPassword/ResetPassword', () => ({ default: () => 'ResetPassword' }));
jest.unstable_mockModule('./pages/NotFound/NotFound', () => ({ default: () => 'NotFound' }));
jest.unstable_mockModule('./components/PrivateRoute/PrivateRoute', () => ({ default: ({ children }) => children }));

const { render } = await import('@testing-library/react');
const { default: App } = await import('./App.jsx');

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeDefined();
  });

  test('renders app container', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});