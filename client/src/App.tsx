import { Routes, Route } from 'react-router-dom'
import AddPhotocardOverlay from './components/AddPhotocardOverlay'
import { AddPhotocardProvider } from './contexts/AddPhotocardContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Search from './pages/Search'
import Group from './pages/Group'
import Member from './pages/Member'
import Submissions from './pages/Submissions'

function App() {
  return (
    <AddPhotocardProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<Search />} />
        <Route path="/group/:groupId" element={<Group />} />
        <Route path="/group/:groupId/member/:memberId" element={<Member />} />
        <Route path="/submissions" element={<Submissions />} />
      </Routes>
      <AddPhotocardOverlay />
    </AddPhotocardProvider>
  )
}

export default App
