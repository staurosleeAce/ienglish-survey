import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { SurveyPage } from './pages/SurveyPage'

const AdminPage = lazy(() => import('./pages/AdminPage'))

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="login-wrap">
          <span className="spinner spinner--dark" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<SurveyPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<SurveyPage />} />
      </Routes>
    </Suspense>
  )
}