import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import styles from './PostDetail.module.css'

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.from('posts').select('*, profiles(name)').eq('id', id).single()
      .then(({ data }) => { setPost(data); setLoading(false) })
    loadComments()
  }, [id])

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(name)')
      .eq('post_id', id)
      .order('created_at')
    setComments(data ?? [])
  }

  async function handleComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmitting(true)
    await supabase.from('comments').insert({
      post_id: id,
      user_id: session.user.id,
      content: commentText.trim(),
    })
    setCommentText('')
    setSubmitting(false)
    loadComments()
  }

  async function deleteComment(commentId) {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const isOwner = session && post?.user_id === session.user.id
  const canEdit = isOwner
  const canDelete = profile?.role === 'admin' || isOwner

  if (loading) return <p className={styles.status}>불러오는 중...</p>
  if (!post) return <p className={styles.status}>게시글을 찾을 수 없어요.</p>

  return (
    <article className={styles.article}>
      <h1 className={styles.title}>{post.title}</h1>
      <div className={styles.meta}>
        <span>{post.profiles?.name}</span>
        <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
      </div>
      <div className={styles.content}>{post.content}</div>

      {(canEdit || canDelete) && (
        <div className={styles.actions}>
          {canEdit && <Link to={`/posts/edit/${post.id}`} className={styles.editBtn}>수정</Link>}
          {canDelete && <button onClick={async () => { if (!confirm('정말 삭제할까요?')) return; await supabase.from('posts').delete().eq('id', id); navigate('/') }} className={styles.deleteBtn}>삭제</button>}
        </div>
      )}

      <section className={styles.comments}>
        <h3 className={styles.commentsHeading}>댓글 {comments.length}</h3>
        <ul className={styles.commentList}>
          {comments.map(c => (
            <li key={c.id} className={styles.commentItem}>
              <div className={styles.commentMeta}>
                <span className={styles.commentAuthor}>{c.profiles?.name}</span>
                <span className={styles.commentDate}>{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className={styles.commentContent}>{c.content}</div>
              {(profile?.role === 'admin' || c.user_id === session?.user?.id) && (
                <button onClick={() => deleteComment(c.id)} className={styles.commentDelete}>삭제</button>
              )}
            </li>
          ))}
          {comments.length === 0 && <p className={styles.noComments}>아직 댓글이 없어요.</p>}
        </ul>

        {session ? (
          <form onSubmit={handleComment} className={styles.commentForm}>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요"
              rows={3}
              className={styles.commentInput}
            />
            <button type="submit" disabled={submitting} className={styles.commentSubmit}>
              {submitting ? '등록 중...' : '댓글 등록'}
            </button>
          </form>
        ) : (
          <p className={styles.loginPrompt}><Link to="/login">로그인</Link> 후 댓글을 달 수 있어요.</p>
        )}
      </section>
    </article>
  )
}
