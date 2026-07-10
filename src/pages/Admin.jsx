import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import styles from './Admin.module.css'

const MENUS = [
  { key: 'users', label: '회원 관리' },
  { key: 'categories', label: '카테고리 관리' },
]

export default function Admin() {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'users'

  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [newPost, setNewPost] = useState('')
  const [newGallery, setNewGallery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session === undefined) return
    if (!session) { navigate('/login'); return }
    if (!profile) return
    if (profile.role !== 'admin') { navigate('/'); return }

    Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('categories').select('*').order('name'),
    ]).then(([{ data: u }, { data: c }]) => {
      setUsers(u ?? [])
      setCategories(c ?? [])
      setLoading(false)
    })
  }, [session, profile])

  async function toggleRole(user) {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    await supabase.from('profiles').update({ role: newRole }).eq('id', user.id)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
  }

  async function addCategory(type, name) {
    if (!name.trim()) return
    const { data } = await supabase.from('categories').insert({ name: name.trim(), type }).select().single()
    if (data) setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    type === 'post' ? setNewPost('') : setNewGallery('')
  }

  async function deleteCategory(id) {
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const postCats = categories.filter(c => c.type === 'post')
  const galleryCats = categories.filter(c => c.type === 'gallery')

  if (loading) return <p className={styles.status}>불러오는 중...</p>

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarTitle}>관리자</p>
        <nav>
          {MENUS.map(m => (
            <button
              key={m.key}
              className={`${styles.menuItem} ${tab === m.key ? styles.active : ''}`}
              onClick={() => setSearchParams({ tab: m.key })}
            >
              {m.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className={styles.content}>
        {tab === 'users' && (
          <>
            <h2 className={styles.heading}>회원 관리</h2>
            <ul className={styles.list}>
              {users.map(u => (
                <li key={u.id} className={styles.item}>
                  <div className={styles.info}>
                    <span className={styles.name}>{u.name}</span>
                    <span className={styles.username}>@{u.username}</span>
                  </div>
                  <div className={styles.right}>
                    <span className={`${styles.badge} ${u.role === 'admin' ? styles.badgeAdmin : styles.badgeUser}`}>
                      {u.role === 'admin' ? '관리자' : '일반'}
                    </span>
                    {u.id !== profile.id && (
                      <button onClick={() => toggleRole(u)} className={styles.roleBtn}>
                        {u.role === 'admin' ? '일반으로' : '관리자로'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === 'categories' && (
          <div className={styles.catSections}>
            {[
              { type: 'post', label: '게시판 카테고리', list: postCats, val: newPost, set: setNewPost },
              { type: 'gallery', label: '갤러리 카테고리', list: galleryCats, val: newGallery, set: setNewGallery },
            ].map(({ type, label, list, val, set }) => (
              <div key={type}>
                <h2 className={styles.heading}>{label}</h2>
                <form onSubmit={e => { e.preventDefault(); addCategory(type, val) }} className={styles.catForm}>
                  <input value={val} onChange={e => set(e.target.value)} placeholder="카테고리 이름" className={styles.catInput} />
                  <button type="submit" className={styles.catAddBtn}>추가</button>
                </form>
                <ul className={styles.list}>
                  {list.length === 0 && <p className={styles.status}>등록된 카테고리가 없어요.</p>}
                  {list.map(c => (
                    <li key={c.id} className={styles.item}>
                      <span className={styles.name}>#{c.name}</span>
                      <button onClick={() => deleteCategory(c.id)} className={styles.deleteBtn}>삭제</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
