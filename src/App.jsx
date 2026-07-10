import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import GalleryList from './pages/GalleryList'
import GalleryDetail from './pages/GalleryDetail'
import GalleryForm from './pages/GalleryForm'
import PostList from './pages/PostList'
import PostDetail from './pages/PostDetail'
import PostForm from './pages/PostForm'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Admin from './pages/Admin'
import MyPage from './pages/MyPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<GalleryList />} />
            <Route path="/gallery/:id" element={<GalleryDetail />} />
            <Route path="/gallery/new" element={<GalleryForm />} />
            <Route path="/gallery/edit/:id" element={<GalleryForm />} />
            <Route path="/posts" element={<PostList />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/posts/new" element={<PostForm />} />
            <Route path="/posts/edit/:id" element={<PostForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/mypage" element={<MyPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}
