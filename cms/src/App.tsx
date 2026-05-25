import { Navigate, Route, Routes } from 'react-router-dom';
import { isAuthenticated, getUserRole } from './lib/auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CoachesList from './features/coaches/CoachesList';
import CoachForm from './features/coaches/CoachForm';
import PlayersList from './features/players/PlayersList';
import PlayerForm from './features/players/PlayerForm';
import TeamsList from './features/teams/TeamsList';
import TeamForm from './features/teams/TeamForm';
import HeroSlidesList from './features/hero-slides/HeroSlidesList';
import HeroSlideForm from './features/hero-slides/HeroSlideForm';
import MediaLibrary from './features/media/MediaLibrary';
import UsersPage from './features/users/UsersPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  if (getUserRole() !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/coaches" element={<CoachesList />} />
                <Route path="/coaches/new" element={<CoachForm />} />
                <Route path="/coaches/:id" element={<CoachForm />} />
                <Route path="/players" element={<PlayersList />} />
                <Route path="/players/new" element={<PlayerForm />} />
                <Route path="/players/:id" element={<PlayerForm />} />
                <Route path="/teams" element={<TeamsList />} />
                <Route path="/teams/new" element={<TeamForm />} />
                <Route path="/teams/:id" element={<TeamForm />} />
                <Route path="/hero-slides" element={<HeroSlidesList />} />
                <Route path="/hero-slides/new" element={<HeroSlideForm />} />
                <Route path="/hero-slides/:id" element={<HeroSlideForm />} />
                <Route path="/media" element={<MediaLibrary />} />
                <Route path="/users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
