import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import styles from './GalleryForm.module.css'

export default function GalleryForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ title: '', category: '', content: '' })
  const [categories, setCategories] = useState([])
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [currentImageUrl, setCurrentImageUrl] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.from('categories').select('*').eq('type', 'gallery').order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    if (!isEdit) return
    supabase.from('gallery').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (!data) { navigate('/'); return }
        if (data.user_id !== session?.user?.id) { navigate(`/gallery/${id}`); return }
        setForm({ title: data.title, category: data.category ?? '', content: data.content ?? '' })
        setCurrentImageUrl(data.image_url)
        setPreview(data.image_url)
      })
  }, [id, isEdit])

  function onChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function onFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function uploadImage() {
    if (!imageFile) return currentImageUrl
    const ext = imageFile.name.split('.').pop()
    const path = `${session.user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('gallery').upload(path, imageFile)
    if (error) throw error
    return supabase.storage.from('gallery').getPublicUrl(path).data.publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const image_url = await uploadImage()
      const payload = { ...form, image_url }

      if (isEdit) {
        await supabase.from('gallery').update(payload).eq('id', id)
        navigate(`/gallery/${id}`)
      } else {
        const { data, error } = await supabase.from('gallery').insert({ ...payload, user_id: session?.user?.id }).select('id').single()
        if (error) throw error
        navigate(`/gallery/${data.id}`)
      }
    } catch (err) {
      alert(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>{isEdit ? '수정' : '새 게시물'}</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>이미지</label>
          <label className={styles.fileLabel}>
            {preview
              ? <img src={preview} alt="preview" className={styles.preview} />
              : <div className={styles.filePlaceholder}>이미지를 선택하세요</div>}
            <input type="file" accept="image/*" onChange={onFileChange} className={styles.fileInput} />
          </label>
        </div>
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
          <textarea name="content" value={form.content} onChange={onChange} rows={6} />
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
