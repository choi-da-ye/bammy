import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import styles from './GalleryDetail.module.css'

export default function GalleryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('gallery').select('*, profiles(name)').eq('id', id).single()
      .then(({ data }) => { setItem(data); setLoading(false) })
  }, [id])

  const isOwner = session && item?.user_id === session.user.id
  const canDelete = profile?.role === 'admin' || isOwner

  async function handleDelete() {
    if (!confirm('정말 삭제할까요?')) return
    await supabase.from('gallery').delete().eq('id', id)
    navigate('/')
  }

  if (loading) return <p className={styles.status}>불러오는 중...</p>
  if (!item) return <p className={styles.status}>게시물을 찾을 수 없어요.</p>

  return (
    <article className={styles.article}>
      {item.image_url && (
        <div className={styles.imageWrap}>
          <img src={item.image_url} alt={item.title} className={styles.image} />
        </div>
      )}
      <div className={styles.body}>
        <div className={styles.topMeta}>
          {item.category && <span className={styles.tag}>#{item.category}</span>}
          <span className={styles.meta}>{item.profiles?.name} · {new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
        </div>
        <h1 className={styles.title}>{item.title}</h1>
        {item.content && <div className={styles.content}>{item.content}</div>}
        {(isOwner || canDelete) && (
          <div className={styles.actions}>
            {isOwner && <Link to={`/gallery/edit/${item.id}`} className={styles.editBtn}>수정</Link>}
            {canDelete && <button onClick={handleDelete} className={styles.deleteBtn}>삭제</button>}
          </div>
        )}
      </div>
    </article>
  )
}
