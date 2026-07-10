import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import styles from './HomeProfile.module.css'

export default function HomeProfile() {
  const { username } = useParams()
  const { profile: myProfile } = useAuth()
  const [homepage, setHomepage] = useState(null)
  const [owner, setOwner] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (!profileData) { setLoading(false); return }
      setOwner(profileData)

      const { data: hp } = await supabase
        .from('homepages')
        .select('*')
        .eq('user_id', profileData.id)
        .single()

      setHomepage(hp ?? null)
      setLoading(false)
    }
    load()
  }, [username])

  const isOwner = myProfile?.username === username

  if (loading) return <p className={styles.status}>불러오는 중...</p>
  if (!owner) return <p className={styles.status}>존재하지 않는 사용자예요.</p>

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.avatar}>{owner.name?.[0]?.toUpperCase()}</div>
        <div>
          <p className={styles.name}>{owner.name}</p>
          <p className={styles.username}>@{owner.username}</p>
        </div>
        {isOwner && (
          <Link to="/home/edit" className={styles.editBtn}>홈피 꾸미기</Link>
        )}
      </div>

      <div
        className={styles.canvas}
        style={{ background: homepage?.bg_color ?? '#f7f7f5' }}
      >
        {!homepage || homepage.elements?.length === 0 ? (
          <div className={styles.emptyCanvas}>
            {isOwner
              ? <Link to="/home/edit" className={styles.startBtn}>홈피를 꾸며보세요 →</Link>
              : <p className={styles.emptyMsg}>아직 홈피를 꾸미지 않았어요.</p>
            }
          </div>
        ) : (
          homepage.elements.map(el => (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.width}%`,
                height: `${el.height}%`,
              }}
            >
              {el.type === 'image' && (
                <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: el.style?.objectFit ?? 'cover' }} />
              )}
              {el.type === 'sticker' && (
                el.content?.startsWith('/') || el.content?.startsWith('http')
                  ? <img src={el.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', containerType: 'size' }}>
                      <span style={{ fontSize: 'min(100cqw, 100cqh)', lineHeight: 1 }}>{el.content}</span>
                    </div>
              )}
              {el.type === 'text' && (
                <p style={{
                  margin: 0, padding: '4px 6px', boxSizing: 'border-box',
                  width: '100%', height: '100%', overflow: 'hidden',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.4,
                  color: el.style?.color,
                  fontSize: el.style?.fontSize ? `${el.style.fontSize}px` : undefined,
                  fontWeight: el.style?.fontWeight,
                  fontStyle: el.style?.fontStyle,
                  textAlign: el.style?.textAlign,
                  fontFamily: el.style?.fontFamily,
                }}>
                  {el.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
