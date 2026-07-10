import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import styles from './MyPage.module.css'

export default function MyPage() {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'posts'

  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session === undefined) return
    if (!session) { navigate('/login'); return }

    const uid = session.user.id
    Promise.all([
      supabase.from('posts').select('id, title, created_at').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('gallery').select('id, title, created_at, image_url').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('comments').select('id, content, created_at, post_id, posts(title)').eq('user_id', uid).order('created_at', { ascending: false }),
    ]).then(([{ data: p }, { data: g }, { data: c }]) => {
      const merged = [
        ...(p ?? []).map(x => ({ ...x, _type: 'post' })),
        ...(g ?? []).map(x => ({ ...x, _type: 'gallery' })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setPosts(merged)
      setComments(c ?? [])
      setLoading(false)
    })
  }, [session])

  if (loading) return <p className={styles.empty}>불러오는 중...</p>

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.avatar}>{profile?.name?.[0]?.toUpperCase()}</div>
        <div>
          <p className={styles.name}>{profile?.name}</p>
          <p className={styles.username}>@{profile?.username}</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'posts' ? styles.tabActive : ''}`} onClick={() => setSearchParams({ tab: 'posts' })}>
          게시글 <span className={styles.count}>{posts.length}</span>
        </button>
        <button className={`${styles.tab} ${tab === 'comments' ? styles.tabActive : ''}`} onClick={() => setSearchParams({ tab: 'comments' })}>
          댓글 <span className={styles.count}>{comments.length}</span>
        </button>
      </div>

      {tab === 'posts' && (
        posts.length === 0 ? <p className={styles.empty}>작성한 게시글이 없어요.</p> : (
          <ul className={styles.list}>
            {posts.map(p => (
              <li key={`${p._type}-${p.id}`} className={styles.item}>
                <Link to={p._type === 'gallery' ? `/gallery/${p.id}` : `/posts/${p.id}`} className={styles.link}>
                  <div className={styles.itemLeft}>
                    {p._type === 'gallery' && p.image_url && (
                      <img src={p.image_url} alt="" className={styles.thumb} />
                    )}
                    <div>
                      <span className={styles.typeBadge}>{p._type === 'gallery' ? '갤러리' : '게시판'}</span>
                      <p className={styles.title}>{p.title}</p>
                    </div>
                  </div>
                  <span className={styles.date}>{new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      )}

      {tab === 'comments' && (
        comments.length === 0 ? <p className={styles.empty}>작성한 댓글이 없어요.</p> : (
          <ul className={styles.list}>
            {comments.map(c => (
              <li key={c.id} className={styles.item}>
                <Link to={`/posts/${c.post_id}`} className={styles.link}>
                  <div>
                    <p className={styles.commentPost}>{c.posts?.title}</p>
                    <p className={styles.commentContent}>{c.content}</p>
                  </div>
                  <span className={styles.date}>{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  )
}
