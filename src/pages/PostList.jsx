import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import styles from './PostList.module.css'

export default function PostList() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    supabase
      .from('posts')
      .select('id, title, category, created_at, profiles(name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setPosts(data ?? []); setLoading(false) })
  }, [])

  const { session } = useAuth()
  const categories = [...new Set(posts.map(p => p.category).filter(Boolean))]
  const filtered = selected ? posts.filter(p => p.category === selected) : posts

  if (loading) return <p className={styles.empty}>불러오는 중...</p>

  return (
    <div>
      <div className={styles.toolbar}>
        <h2 className={styles.pageTitle}>게시글</h2>
        {session && <Link to="/posts/new" className={styles.writeBtn}>글쓰기</Link>}
      </div>

      {categories.length > 0 && (
        <div className={styles.chips}>
          <button
            className={`${styles.chip} ${!selected ? styles.chipActive : ''}`}
            onClick={() => setSelected(null)}
          >전체</button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.chip} ${selected === cat ? styles.chipActive : ''}`}
              onClick={() => setSelected(s => s === cat ? null : cat)}
            >#{cat}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className={styles.empty}>게시글이 없어요.</p>
      ) : (
        <ul className={styles.list}>
          {filtered.map(post => (
            <li key={post.id} className={styles.item}>
              <Link to={`/posts/${post.id}`} className={styles.link}>

                <div className={styles.top}>
                  <span className={styles.title}>{post.title}</span>
                  {post.category && <span className={styles.tag}>#{post.category}</span>}
                </div>
                <span className={styles.meta}>
                  {post.profiles?.name} · {new Date(post.created_at).toLocaleDateString('ko-KR')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
