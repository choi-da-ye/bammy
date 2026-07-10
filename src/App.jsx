import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import HomeFeed from './pages/HomeFeed'
import HomeProfile from './pages/HomeProfile'
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
import HomeEditor from './pages/HomeEditor'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomeFeed />} />
            <Route path="/home/edit" element={<HomeEditor />} />
            <Route path="/home/:username" element={<HomeProfile />} />
            <Route path="/gallery" element={<GalleryList />} />
            <Route path="/gallery/new" element={<GalleryForm />} />
            <Route path="/gallery/edit/:id" element={<GalleryForm />} />
            <Route path="/gallery/:id" element={<GalleryDetail />} />
            <Route path="/posts" element={<PostList />} />
            <Route path="/posts/new" element={<PostForm />} />
            <Route path="/posts/edit/:id" element={<PostForm />} />
            <Route path="/posts/:id" element={<PostDetail />} />
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
