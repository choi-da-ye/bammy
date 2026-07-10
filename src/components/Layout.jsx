import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import styles from './Layout.module.css'

export default function Layout({ children }) {
  const { session, profile } = useAuth()
  const navigate = useNavigate()

  async function logout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo}>Bammy</Link>
          <nav className={styles.gnb}>
            <Link to="/" className={styles.gnbLink}>갤러리</Link>
            <Link to="/posts" className={styles.gnbLink}>게시판</Link>
          </nav>
          <div className={styles.nav}>
            {session ? (
              <>
                <Link to="/mypage" className={styles.username}>{profile?.name ?? ''}</Link>
                <button onClick={logout} className={styles.logoutBtn}>로그아웃</button>
</>
            ) : (
              <>
                <Link to="/login" className={styles.loginBtn}>로그인</Link>
                <Link to="/signup" className={styles.writeBtn}>회원가입</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      {profile?.role === 'admin' && (
        <Link to="/admin" className={styles.fab} title="관리자 페이지">⚙</Link>
      )}
    </div>
  )
}
