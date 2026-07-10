import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './HomeFeed.module.css'

const PAGE = 5

export default function HomeFeed() {
  const [items, setItems] = useState([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef(null)

  async function load(from) {
    if (loading) return
    setLoading(true)
    const { data } = await supabase
      .from('homepages')
      .select('*, profiles(name, username)')
      .order('updated_at', { ascending: false })
      .range(from, from + PAGE - 1)

    const rows = data ?? []
    setItems(prev => from === 0 ? rows : [...prev, ...rows])
    setHasMore(rows.length === PAGE)
    setOffset(from + rows.length)
    setLoading(false)
  }

  useEffect(() => { load(0) }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading) load(offset) },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, offset])

  return (
    <div className={styles.feed}>
      {items.length === 0 && !loading && (
        <p className={styles.empty}>아직 꾸민 홈피가 없어요.</p>
      )}
      {items.map(item => (
        <Link to={`/home/${item.profiles?.username}`} key={item.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.avatar}>
              {item.profiles?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className={styles.name}>{item.profiles?.name}</p>
              <p className={styles.username}>@{item.profiles?.username}</p>
            </div>
          </div>
          <div
            className={styles.preview}
            style={item.bg_image
              ? { backgroundColor: item.bg_color, backgroundImage: `url(${item.bg_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: item.bg_color }
            }
          >
            {item.elements?.length === 0 && (
              <p className={styles.previewEmpty}>홈피를 꾸미는 중...</p>
            )}
            {item.elements?.map(el => (
              <div
                key={el.id}
                style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%`, height: `${el.height}%` }}
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
                {el.type === 'bubble' && (
                  <div
                    className={`hp-bubble hp-tail-${el.style?.tailDir ?? 'bl'}`}
                    style={{
                      '--bubble-bg': el.style?.bgColor ?? '#ffffff',
                      '--bubble-border': el.style?.borderColor ?? '#111111',
                      backgroundColor: el.style?.bgColor ?? '#ffffff',
                      border: `2px solid ${el.style?.borderColor ?? '#111111'}`,
                      color: el.style?.color ?? '#111111',
                      fontSize: el.style?.fontSize ? `${el.style.fontSize}px` : undefined,
                      fontWeight: el.style?.fontWeight,
                      fontStyle: el.style?.fontStyle,
                      fontFamily: el.style?.fontFamily,
                      textAlign: el.style?.textAlign ?? 'center',
                    }}
                  >
                    <p>{el.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.updated}>
              {new Date(item.updated_at).toLocaleDateString('ko-KR')} 업데이트
            </span>
          </div>
        </Link>
      ))}
      <div ref={sentinelRef} className={styles.sentinel}>
        {loading && <p className={styles.loading}>불러오는 중...</p>}
      </div>
    </div>
  )
}
