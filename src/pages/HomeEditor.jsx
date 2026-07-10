import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STICKER_CATEGORIES, IMAGE_STICKERS, BACKGROUNDS } from '../lib/editorAssets'
import styles from './HomeEditor.module.css'

const uid = () => Math.random().toString(36).slice(2)

const FONTS = [
  { label: '기본', value: 'inherit' },
  { label: '명조', value: "'Noto Serif KR', serif" },
  { label: '블랙', value: "'Black Han Sans', sans-serif" },
  { label: '귀여운', value: "'Jua', sans-serif" },
  { label: '손글씨', value: "'Gaegu', cursive" },
  { label: '코드', value: 'monospace' },
]

export default function HomeEditor() {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const draggingRef = useRef(null)
  const resizingRef = useRef(null)

  const [elements, setElements] = useState([])
  const [bgColor, setBgColor] = useState('#f7f7f5')
  const [bgImage, setBgImage] = useState(null)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [panel, setPanel] = useState(null)       // 'sticker' | 'bg' | null
  const [stickerCat, setStickerCat] = useState(0)
  const [saving, setSaving] = useState(false)
  const [homepageId, setHomepageId] = useState(null)
  const [uploading, setUploading] = useState(false)

  const selectedEl = elements.find(el => el.id === selected) ?? null
  const isText     = selectedEl?.type === 'text'
  const isBubble   = selectedEl?.type === 'bubble'
  const isImage    = selectedEl?.type === 'image'
  const isTextLike = isText || isBubble

  useEffect(() => {
    if (session === undefined) return
    if (!session) { navigate('/login'); return }
    supabase.from('homepages').select('*').eq('user_id', session.user.id).single()
      .then(({ data }) => {
        if (!data) return
        setHomepageId(data.id)
        setElements(data.elements ?? [])
        setBgColor(data.bg_color ?? '#f7f7f5')
        setBgImage(data.bg_image ?? null)
      })
  }, [session])

  useEffect(() => {
    function coords(e) {
      return e.touches ? e.touches[0] : e
    }
    function onMove(e) {
      if (!draggingRef.current && !resizingRef.current) return
      if (e.cancelable) e.preventDefault() // 드래그 중 스크롤 방지
      const { clientX, clientY } = coords(e)
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      if (draggingRef.current) {
        const d = draggingRef.current
        const dx = (clientX - d.startX) / rect.width * 100
        const dy = (clientY - d.startY) / rect.height * 100
        setElements(prev => prev.map(el => el.id !== d.id ? el : {
          ...el,
          x: Math.max(0, Math.min(100 - el.width, d.origX + dx)),
          y: Math.max(0, Math.min(100 - el.height, d.origY + dy)),
        }))
      }
      if (resizingRef.current) {
        const r = resizingRef.current
        const dx = (clientX - r.startX) / rect.width * 100
        const dy = (clientY - r.startY) / rect.height * 100
        setElements(prev => prev.map(el => el.id !== r.id ? el : {
          ...el,
          width: Math.max(5, r.origW + dx),
          height: Math.max(5, r.origH + dy),
        }))
      }
    }
    function onUp() { draggingRef.current = null; resizingRef.current = null }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
    }
  }, [])

  function updateEl(id, patch) {
    setElements(prev => prev.map(el => el.id !== id ? el : { ...el, ...patch }))
  }
  function updateStyle(id, patch) {
    setElements(prev => prev.map(el => el.id !== id ? el : { ...el, style: { ...el.style, ...patch } }))
  }

  function onElementMouseDown(e, el) {
    if (editing === el.id) return
    e.preventDefault(); e.stopPropagation()
    setSelected(el.id)
    const p = e.touches ? e.touches[0] : e
    draggingRef.current = { id: el.id, startX: p.clientX, startY: p.clientY, origX: el.x, origY: el.y }
  }
  function onResizeMouseDown(e, el) {
    e.preventDefault(); e.stopPropagation()
    const p = e.touches ? e.touches[0] : e
    resizingRef.current = { id: el.id, startX: p.clientX, startY: p.clientY, origW: el.width, origH: el.height }
  }
  function onCanvasClick(e) {
    if (e.target === e.currentTarget) { setSelected(null); setEditing(null); setPanel(null) }
  }

  async function addImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `homepage/${session.user.id}/${uid()}.${ext}`
    const { error } = await supabase.storage.from('gallery').upload(path, file)
    if (error) { alert(error.message); setUploading(false); return }
    const url = supabase.storage.from('gallery').getPublicUrl(path).data.publicUrl
    const id = uid()
    setElements(prev => [...prev, { id, type: 'image', x: 10, y: 10, width: 35, height: 35, content: url, style: { opacity: 1, objectFit: 'cover' } }])
    setSelected(id)
    e.target.value = ''
    setUploading(false)
  }

  function addBubble() {
    const id = uid()
    setElements(prev => [...prev, {
      id, type: 'bubble', x: 20, y: 20, width: 48, height: 20,
      content: '말풍선',
      style: { fontSize: 14, fontWeight: 'normal', fontStyle: 'normal', color: '#111111', textAlign: 'center', fontFamily: 'inherit', bgColor: '#ffffff', borderColor: '#111111', tailDir: 'bl', opacity: 1 },
    }])
    setSelected(id)
    setTimeout(() => setEditing(id), 30)
  }

  function addText() {
    const id = uid()
    setElements(prev => [...prev, {
      id, type: 'text', x: 20, y: 20, width: 50, height: 12,
      content: '텍스트를 입력하세요',
      style: { fontSize: 16, fontWeight: 'normal', fontStyle: 'normal', color: '#111111', textAlign: 'left', fontFamily: 'inherit', opacity: 1 },
    }])
    setSelected(id)
    setTimeout(() => setEditing(id), 30)
  }

  function addSticker(content) {
    const id = uid()
    setElements(prev => [...prev, {
      id, type: 'sticker', x: 35, y: 35, width: 15, height: 15,
      content, style: { opacity: 1 },
    }])
    setSelected(id)
    setPanel(null)
  }

  function deleteSelected() {
    if (!selectedEl) return
    setElements(prev => prev.filter(el => el.id !== selected))
    setSelected(null); setEditing(null)
  }
  function bringForward() {
    setElements(prev => {
      const i = prev.findIndex(el => el.id === selected)
      if (i >= prev.length - 1) return prev
      const next = [...prev];[next[i], next[i + 1]] = [next[i + 1], next[i]]; return next
    })
  }
  function sendBackward() {
    setElements(prev => {
      const i = prev.findIndex(el => el.id === selected)
      if (i <= 0) return prev
      const next = [...prev];[next[i - 1], next[i]] = [next[i], next[i - 1]]; return next
    })
  }
  function duplicate() {
    if (!selectedEl) return
    const id = uid()
    setElements(prev => [...prev, { ...selectedEl, id, x: selectedEl.x + 3, y: selectedEl.y + 3 }])
    setSelected(id)
  }

  async function save() {
    setSaving(true)
    const payload = { user_id: session.user.id, elements, bg_color: bgColor, bg_image: bgImage, updated_at: new Date().toISOString() }
    if (homepageId) {
      await supabase.from('homepages').update(payload).eq('id', homepageId)
    } else {
      const { data } = await supabase.from('homepages').insert(payload).select().single()
      if (data) setHomepageId(data.id)
    }
    setSaving(false)
    navigate(`/home/${profile.username}`)
  }

  const togglePanel = (name) => setPanel(p => p === name ? null : name)

  return (
    <div className={styles.wrap}>

      {/* ── 속성 바 ── */}
      <div className={styles.propBar}>
        <button className={styles.propBtn} onClick={bringForward} disabled={!selectedEl} title="앞으로">↑</button>
        <button className={styles.propBtn} onClick={sendBackward} disabled={!selectedEl} title="뒤로">↓</button>
        <button className={styles.propBtn} onClick={duplicate} disabled={!selectedEl}>복제</button>
        <div className={styles.sep} />

        <select className={styles.propSelect} value={selectedEl?.style?.fontFamily ?? 'inherit'} onChange={e => updateStyle(selected, { fontFamily: e.target.value })} disabled={!isTextLike}>
          {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <input type="number" min={8} max={200} className={styles.propNumber} value={selectedEl?.style?.fontSize ?? 16} onChange={e => updateStyle(selected, { fontSize: Number(e.target.value) })} disabled={!isTextLike} />
        <button className={`${styles.propBtn} ${styles.bold} ${selectedEl?.style?.fontWeight === 'bold' ? styles.propActive : ''}`} onClick={() => updateStyle(selected, { fontWeight: selectedEl?.style?.fontWeight === 'bold' ? 'normal' : 'bold' })} disabled={!isTextLike}>B</button>
        <button className={`${styles.propBtn} ${styles.italic} ${selectedEl?.style?.fontStyle === 'italic' ? styles.propActive : ''}`} onClick={() => updateStyle(selected, { fontStyle: selectedEl?.style?.fontStyle === 'italic' ? 'normal' : 'italic' })} disabled={!isTextLike}>I</button>
        <div className={styles.sep} />

        {['left', 'center', 'right'].map(align => (
          <button key={align} className={`${styles.propBtn} ${selectedEl?.style?.textAlign === align ? styles.propActive : ''}`} onClick={() => updateStyle(selected, { textAlign: align })} disabled={!isTextLike}>
            {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
          </button>
        ))}
        <div className={styles.sep} />

        <label className={`${styles.colorLabel} ${!isTextLike ? styles.propDisabled : ''}`} title="글자색">
          <span className={styles.colorA} style={{ color: selectedEl?.style?.color ?? '#111' }}>A</span>
          <input type="color" value={selectedEl?.style?.color ?? '#111111'} onChange={e => updateStyle(selected, { color: e.target.value })} className={styles.colorInput} disabled={!isTextLike} />
        </label>
        <div className={styles.sep} />

        {/* 말풍선 전용 */}
        {isBubble && (
          <>
            <label className={styles.colorLabel} title="배경색">
              <span>배경</span>
              <input type="color" value={selectedEl?.style?.bgColor ?? '#ffffff'} onChange={e => updateStyle(selected, { bgColor: e.target.value })} className={styles.colorInput} />
            </label>
            <label className={styles.colorLabel} title="테두리색">
              <span>선</span>
              <input type="color" value={selectedEl?.style?.borderColor ?? '#111111'} onChange={e => updateStyle(selected, { borderColor: e.target.value })} className={styles.colorInput} />
            </label>
            <div className={styles.sep} />
            {[['bl','↙'],['br','↘'],['tl','↖'],['tr','↗']].map(([dir, icon]) => (
              <button key={dir} className={`${styles.propBtn} ${selectedEl?.style?.tailDir === dir ? styles.propActive : ''}`} onClick={() => updateStyle(selected, { tailDir: dir })} title={`꼬리 ${dir}`}>{icon}</button>
            ))}
            <div className={styles.sep} />
          </>
        )}

        <button className={`${styles.propBtn} ${(selectedEl?.style?.objectFit ?? 'cover') === 'contain' ? styles.propActive : ''}`} onClick={() => updateStyle(selected, { objectFit: (selectedEl?.style?.objectFit ?? 'cover') === 'cover' ? 'contain' : 'cover' })} disabled={!isImage}>Fit</button>
        <div className={styles.sep} />

        <label className={`${styles.opacityWrap} ${!selectedEl ? styles.propDisabled : ''}`}>
          <span>투명도</span>
          <input type="range" min={0.1} max={1} step={0.05} className={styles.propRange} value={selectedEl?.style?.opacity ?? 1} onChange={e => updateStyle(selected, { opacity: Number(e.target.value) })} disabled={!selectedEl} />
          <span className={styles.opacityVal}>{Math.round((selectedEl?.style?.opacity ?? 1) * 100)}%</span>
        </label>

        <div className={styles.spacer} />
        <button onClick={deleteSelected} className={styles.btnDanger} disabled={!selectedEl}>삭제</button>
      </div>

      {/* ── 메인 툴바 ── */}
      <div className={styles.toolbar}>
        <button onClick={addText} className={styles.btn}>텍스트</button>
        <button onClick={addBubble} className={styles.btn}>말풍선</button>
        <label className={styles.btn}>
          {uploading ? '업로드 중...' : '이미지'}
          <input type="file" accept="image/*" onChange={addImage} disabled={uploading} style={{ display: 'none' }} />
        </label>
        <button className={`${styles.btn} ${panel === 'sticker' ? styles.btnActive : ''}`} onClick={() => togglePanel('sticker')}>
          스티커 {panel === 'sticker' ? '▲' : '▼'}
        </button>
        <button className={`${styles.btnGhost} ${panel === 'bg' ? styles.btnGhostActive : ''}`} onClick={() => togglePanel('bg')}>
          배경 {panel === 'bg' ? '▲' : '▼'}
        </button>
        <div className={styles.spacer} />
        <button onClick={() => navigate(`/home/${profile?.username}`)} className={styles.btnGhost}>취소</button>
        <button onClick={save} disabled={saving} className={styles.btn}>{saving ? '저장 중...' : '저장'}</button>
      </div>

      {/* ── 스티커 패널 ── */}
      {panel === 'sticker' && (
        <div className={styles.panel}>
          <div className={styles.panelTabs}>
            {STICKER_CATEGORIES.map((cat, i) => (
              <button key={cat.label} className={`${styles.panelTab} ${stickerCat === i ? styles.panelTabActive : ''}`} onClick={() => setStickerCat(i)}>
                {cat.label}
              </button>
            ))}
            {IMAGE_STICKERS.length > 0 && (
              <button className={`${styles.panelTab} ${stickerCat === STICKER_CATEGORIES.length ? styles.panelTabActive : ''}`} onClick={() => setStickerCat(STICKER_CATEGORIES.length)}>
                이미지
              </button>
            )}
          </div>
          <div className={styles.stickerGrid}>
            {stickerCat < STICKER_CATEGORIES.length
              ? STICKER_CATEGORIES[stickerCat].items.map(emoji => (
                  <button key={emoji} className={styles.stickerItem} onClick={() => addSticker(emoji)}>{emoji}</button>
                ))
              : IMAGE_STICKERS.map(s => (
                  <button key={s.id} className={styles.stickerItem} onClick={() => addSticker(s.src)}>
                    <img src={s.src} alt={s.label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </button>
                ))
            }
          </div>
        </div>
      )}

      {/* ── 배경 패널 ── */}
      {panel === 'bg' && (
        <div className={styles.panel}>
          <div className={styles.bgGrid}>
            {BACKGROUNDS.map(bg => {
              const isActive = bg.src ? bgImage === bg.src : (!bgImage && bgColor === bg.color)
              return (
                <button
                  key={bg.id}
                  className={`${styles.bgItem} ${isActive ? styles.bgItemActive : ''}`}
                  style={{ background: bg.src ? `url(${bg.src}) center/cover` : bg.color }}
                  onClick={() => { setBgColor(bg.color); setBgImage(bg.src ?? null); setPanel(null) }}
                  title={bg.label}
                >
                  <span className={styles.bgLabel}>{bg.label}</span>
                </button>
              )
            })}
            {/* 커스텀 색상 */}
            <label className={`${styles.bgItem} ${styles.bgCustom}`} title="커스텀">
              <span className={styles.bgLabel}>직접</span>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }} />
            </label>
          </div>
        </div>
      )}

      {/* ── 캔버스 ── */}
      <div
        ref={canvasRef}
        className={styles.canvas}
        style={bgImage
          ? { backgroundColor: bgColor, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: bgColor }
        }
        onClick={onCanvasClick}
      >
        {elements.map(el => (
          <div
            key={el.id}
            className={`${styles.element} ${selected === el.id ? styles.selected : ''}`}
            style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.width}%`, height: `${el.height}%`, opacity: el.style?.opacity ?? 1, cursor: editing === el.id ? 'text' : 'grab' }}
            onMouseDown={e => onElementMouseDown(e, el)}
            onTouchStart={e => onElementMouseDown(e, el)}
            onDoubleClick={e => { e.stopPropagation(); if (el.type === 'text' || el.type === 'bubble') setEditing(el.id) }}
          >
            {el.type === 'image' && (
              <img src={el.content} alt="" className={styles.img} style={{ objectFit: el.style?.objectFit ?? 'cover' }} draggable={false} />
            )}

            {el.type === 'sticker' && (
              el.content?.startsWith('/') || el.content?.startsWith('http')
                ? <img src={el.content} alt="" className={styles.img} style={{ objectFit: 'contain' }} draggable={false} />
                : <div className={styles.stickerWrap}><span className={styles.stickerEmoji}>{el.content}</span></div>
            )}

            {el.type === 'text' && (
              editing === el.id ? (
                <textarea
                  autoFocus className={styles.textEdit}
                  value={el.content}
                  onChange={e => updateEl(el.id, { content: e.target.value })}
                  onBlur={() => setEditing(null)}
                  onKeyDown={e => { if (e.key === 'Escape') setEditing(null) }}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                  style={{ fontSize: `${el.style?.fontSize ?? 16}px`, fontWeight: el.style?.fontWeight, fontStyle: el.style?.fontStyle, color: el.style?.color, textAlign: el.style?.textAlign, fontFamily: el.style?.fontFamily }}
                />
              ) : (
                <p
                  className={styles.textContent}
                  style={{ fontSize: `${el.style?.fontSize ?? 16}px`, fontWeight: el.style?.fontWeight, fontStyle: el.style?.fontStyle, color: el.style?.color, textAlign: el.style?.textAlign, fontFamily: el.style?.fontFamily }}
                >{el.content}</p>
              )
            )}

            {el.type === 'bubble' && (
              editing === el.id ? (
                <textarea
                  autoFocus className={styles.bubbleEdit}
                  value={el.content}
                  onChange={e => updateEl(el.id, { content: e.target.value })}
                  onBlur={() => setEditing(null)}
                  onKeyDown={e => { if (e.key === 'Escape') setEditing(null) }}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                  style={{
                    backgroundColor: el.style?.bgColor ?? '#ffffff',
                    border: `2px solid ${el.style?.borderColor ?? '#111111'}`,
                    color: el.style?.color ?? '#111111',
                    fontSize: `${el.style?.fontSize ?? 14}px`,
                    fontWeight: el.style?.fontWeight, fontStyle: el.style?.fontStyle,
                    fontFamily: el.style?.fontFamily, textAlign: el.style?.textAlign ?? 'center',
                  }}
                />
              ) : (
                <div
                  className={`${styles.bubble} ${styles[`tail_${el.style?.tailDir ?? 'bl'}`]}`}
                  style={{
                    '--bubble-bg': el.style?.bgColor ?? '#ffffff',
                    '--bubble-border': el.style?.borderColor ?? '#111111',
                    backgroundColor: el.style?.bgColor ?? '#ffffff',
                    border: `2px solid ${el.style?.borderColor ?? '#111111'}`,
                    color: el.style?.color ?? '#111111',
                    fontSize: `${el.style?.fontSize ?? 14}px`,
                    fontWeight: el.style?.fontWeight, fontStyle: el.style?.fontStyle,
                    fontFamily: el.style?.fontFamily, textAlign: el.style?.textAlign ?? 'center',
                  }}
                >
                  <p className={styles.bubbleText}>{el.content}</p>
                </div>
              )
            )}

            {selected === el.id && editing !== el.id && (
              <div className={styles.resizeHandle} onMouseDown={e => onResizeMouseDown(e, el)} onTouchStart={e => onResizeMouseDown(e, el)} />
            )}
          </div>
        ))}
        {elements.length === 0 && <p className={styles.hint}>텍스트 · 스티커 · 이미지로 꾸며보세요</p>}
      </div>
    </div>
  )
}
