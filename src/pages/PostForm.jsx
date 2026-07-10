import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import styles from './PostForm.module.css'

export default function PostForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ title: '', category: '', content: '' })
  const [categories, setCategories] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.from('categories').select('*').eq('type', 'post').order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    if (!isEdit) return
    supabase.from('posts').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (!data) { navigate('/'); return }
        if (data.user_id !== session?.user?.id) { navigate(`/posts/${id}`); return }
        setForm({ title: data.title, category: data.category ?? '', content: data.content })
      })
  }, [id, isEdit, profile])

  function onChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    if (isEdit) {
      await supabase.from('posts').update(form).eq('id', id)
      navigate(`/posts/${id}`)
    } else {
      const { data, error } = await supabase.from('posts').insert({ ...form, user_id: session?.user?.id }).select('id').single()
      if (error) { alert(error.message); setSubmitting(false); return }
      navigate(`/posts/${data.id}`)
    }
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>{isEdit ? '게시글 수정' : '새 게시글'}</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>제목</label>
          <input name="title" value={form.title} onChange={onChange} required />
        </div>
        <div className={styles.field}>
          <label>카테고리</label>
          <select name="category" value={form.category} onChange={onChange} className={styles.select}>
            <option value="">선택 안 함</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label>내용</label>
          <textarea name="content" value={form.content} onChange={onChange} rows={10} required />
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={() => navigate(-1)} className={styles.cancelBtn}>취소</button>
          <button type="submit" disabled={submitting} className={styles.submitBtn}>
            {submitting ? '저장 중...' : isEdit ? '수정 완료' : '등록'}
          </button>
        </div>
      </form>
    </div>
  )
}
