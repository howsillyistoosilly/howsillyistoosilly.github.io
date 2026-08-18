import { memo, useEffect, useState } from 'react'
import { fetchPosts } from '../lib/sanity'
import { Chip } from './ProjectCard'
import './Blog.css'

function formatDate(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return isoString
  }
}

function BlogSectionComponent({ onSelectPost }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await fetchPosts()
        if (mounted) {
          setPosts(data || [])
        }
      } catch (err) {
        console.error('Error loading posts:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="section" id="blog">
      <div className="sec-head">
        <span className="sec-num">04 — writing</span>
        <div className="sec-head-right">
          <h2 className="sec-title">blog.<em>howsillyistoosilly.lol</em></h2>
        </div>
      </div>

      <div className="blog-list">
        {loading ? (
          <div style={{ padding: '2rem 0', color: 'var(--mid)', fontSize: '0.75rem' }}>
            racking my brain to yap...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '2rem 0', color: 'var(--mid)', fontSize: '0.75rem' }}>
            No articles published yet.
          </div>
        ) : (
          posts.map((post, idx) => {
            const formattedDate = formatDate(post.publishedAt)
            const postNumber = post.num || String(idx + 1).padStart(2, '0')

            return (
              <button
                type="button"
                key={post._id || post.slug?.current || idx}
                className="blog-card"
                onClick={() => onSelectPost(post)}
              >
                <div className="blog-num">{postNumber}</div>
                <div className="blog-main">
                  <div className="blog-meta-top">
                    {formattedDate && <span className="blog-date">{formattedDate}</span>}
                    {post.readTime && <span className="blog-readtime">· {post.readTime}</span>}
                    {post.tags && post.tags.length > 0 && (
                      <div className="blog-tags">
                        {post.tags.map((t) => (
                          <Chip key={t} label={t} />
                        ))}
                      </div>
                    )}
                  </div>
                  <h3 className="blog-title">{post.title}</h3>
                  {post.excerpt && <p className="blog-excerpt">{post.excerpt}</p>}
                </div>
                <div className="blog-action">
                  <span className="blog-action-btn">read article ↗</span>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export default memo(BlogSectionComponent)
