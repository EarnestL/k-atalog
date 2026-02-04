import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Search from './pages/Search'
import Group from './pages/Group'
import Member from './pages/Member'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/search" element={<Search />} />
      <Route path="/group/:groupId" element={<Group />} />
      <Route path="/group/:groupId/member/:memberId" element={<Member />} />
    </Routes>
  )
}

export default App
