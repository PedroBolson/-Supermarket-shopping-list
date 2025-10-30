import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts'
import { ThemeProvider } from './contexts/theme-context'
import { ProtectedRoute } from './routes'
import { FullScreenLoader } from './components/feedback'

const AuthPage = lazy(async () => {
  const module = await import('./features/auth')
  return { default: module.AuthPage }
})

const AppShell = lazy(async () => {
  const module = await import('./features/layout')
  return { default: module.AppShell }
})

const ListsPage = lazy(async () => {
  const module = await import('./features/lists')
  return { default: module.ListsPage }
})

const ProfilePage = lazy(async () => {
  const module = await import('./features/profile')
  return { default: module.ProfilePage }
})

const AccountPage = lazy(async () => {
  const module = await import('./features/account/AccountPage')
  return { default: module.AccountPage }
})

const AcceptInvitePage = lazy(async () => {
  const module = await import('./features/invitations/AcceptInvitePage')
  return { default: module.AcceptInvitePage }
})

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<FullScreenLoader message="Preparando a experiência" />}>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/invite" element={<AcceptInvitePage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<AppShell />}>
                  <Route index element={<ListsPage />} />
                  <Route path="account" element={<AccountPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
