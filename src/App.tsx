import { lazy, Suspense } from 'react'
import { Route, Routes, useSearchParams } from 'react-router-dom'
import { SurveyPage } from './pages/SurveyPage'
import { SuperSurveyPage } from './pages/SuperSurveyPage'
import { SUPER_PROJECT_ID } from './data/projects'

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
        <Route path="/" element={<ProjectSurvey />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<SurveyPage />} />
      </Routes>
    </Suspense>
  )
}

function ProjectSurvey() {
  const [params] = useSearchParams()
  const hash = window.location.hash
  const qIndex = hash.indexOf('?')
  const hashParams = new URLSearchParams(qIndex >= 0 ? hash.slice(qIndex + 1) : '')
  const project = hashParams.get('project') ?? params.get('project')

  return project === SUPER_PROJECT_ID ? <SuperSurveyPage /> : <SurveyPage />
}
