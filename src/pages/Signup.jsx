import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, toAuthEmail } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import styles from './Auth.module.css'

export default function Signup() {
  const navigate = useNavigate()
  const { reloadProfile } = useAuth()
  const [form, setForm] = useState({ name: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function onChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const username = form.username.trim().toLowerCase()
    if (!/^[a-z0-9_]+$/.test(username)) {
      setError('아이디는 영문, 숫자, _ 만 사용할 수 있어요.')
      setLoading(false)
      return
    }

    const { data, error: authErr } = await supabase.auth.signUp({
      email: toAuthEmail(username),
      password: form.password,
    })
    if (authErr) { setError(authErr.message); setLoading(false); return }

    const { error: profileErr } = await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      name: form.name,
      role: 'user',
    })
    if (profileErr) { setError(profileErr.message); setLoading(false); return }

    reloadProfile()
    navigate('/')
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>회원가입</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>이름</label>
          <input name="name" value={form.name} onChange={onChange} required />
        </div>
        <div className={styles.field}>
          <label>아이디</label>
          <input name="username" value={form.username} onChange={onChange} required autoComplete="username" minLength={4} />
        </div>
        <div className={styles.field}>
          <label>비밀번호</label>
          <input name="password" type="password" value={form.password} onChange={onChange} required autoComplete="new-password" minLength={4} />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? '가입 중...' : '회원가입'}
        </button>
      </form>
      <p className={styles.footer}>이미 계정이 있나요? <Link to="/login">로그인</Link></p>
    </div>
  )
}
