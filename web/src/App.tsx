import { Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './components/Home'
import WikiPage from './components/WikiPage'

function App() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/*" element={<WikiPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
