import { Navigate, Route, Routes } from 'react-router-dom'
import GuestRoute from './components/GuestRoute'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CurrentGamePage from './pages/CurrentGamePage'
import HistoryPage from './pages/HistoryPage'
import PlayersPage from './pages/PlayersPage'
import RulesPage from './pages/RulesPage'
import EasterEggToast from './components/EasterEggToast'
import RandomEasterEggBanner from './components/RandomEasterEggBanner'

function App() {
  return (
    <>
      <Routes>
        <Route path="/rules" element={<RulesPage />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/game" element={<CurrentGamePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/players" element={<PlayersPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <EasterEggToast />
      <RandomEasterEggBanner />
    </>
  )
}

export default App
