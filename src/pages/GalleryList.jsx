import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import styles from './GalleryList.module.css'

export default function GalleryList() {
  const { session } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    supabase
      .from('gallery')
      .select('id, title, image_url, category, created_at, profiles(name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setItems(data ?? []); setLoading(false) })
  }, [])

  const categories = [...new Set(items.map(p => p.category).filter(Boolean))]
  const filtered = selected ? items.filter(p => p.category === selected) : items

  if (loading) return <p className={styles.empty}>불러오는 중...</p>

  return (
    <div>
      <div className={styles.toolbar}>
        <h2 className={styles.pageTitle}>갤러리</h2>
        {session && <Link to="/gallery/new" className={styles.writeBtn}>업로드</Link>}
      </div>

      {categories.length > 0 && (
        <div className={styles.chips}>
          <button className={`${styles.chip} ${!selected ? styles.chipActive : ''}`} onClick={() => setSelected(null)}>전체</button>
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
        <p className={styles.empty}>게시물이 없어요.</p>
      ) : (
        <ul className={styles.grid}>
          {filtered.map(item => (
            <li key={item.id}>
              <Link to={`/gallery/${item.id}`} className={styles.card}>
                <div className={styles.thumb}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.title} className={styles.img} />
                    : <div className={styles.noImg} />}
                </div>
                <div className={styles.info}>
                  {item.category && <span className={styles.tag}>#{item.category}</span>}
                  <p className={styles.title}>{item.title}</p>
                  <p className={styles.meta}>{item.profiles?.name} · {new Date(item.created_at).toLocaleDateString('ko-KR')}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
