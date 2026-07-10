import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, toAuthEmail } from '../lib/supabase'
import styles from './Auth.module.css'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function onChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: toAuthEmail(form.username),
      password: form.password,
    })
    if (error) { setError('아이디 또는 비밀번호가 틀렸어요.'); setLoading(false); return }
    navigate('/')
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>로그인</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>아이디</label>
          <input name="username" value={form.username} onChange={onChange} required autoComplete="username" />
        </div>
        <div className={styles.field}>
          <label>비밀번호</label>
          <input name="password" type="password" value={form.password} onChange={onChange} required autoComplete="current-password" />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      <p className={styles.footer}>계정이 없나요? <Link to="/signup">회원가입</Link></p>
    </div>
  )
}
