import { lazy, Suspense, useEffect } from 'react'
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

  useEffect(() => {
    document.title = project === SUPER_PROJECT_ID
      ? '平凡爸媽很 Super｜7 天陪伴・第 1 期'
      : '7 日英語閱讀口說營｜小 i 陪你回顧'
  }, [project])

  return project === SUPER_PROJECT_ID ? <SuperSurveyPage /> : <SurveyPage />
}
