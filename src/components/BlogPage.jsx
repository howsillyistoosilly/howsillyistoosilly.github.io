import { memo, useEffect, useState } from 'react'
import { fetchPosts, urlFor } from '../lib/sanity'
import { Chip } from './ProjectCard'
import BlogPostPage from './BlogPostPage'
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

function getSlugFromUrl() {
  if (typeof window === 'undefined') return null
  const pathname = window.location.pathname
  if (pathname.startsWith('/blog/')) {
    const segment = pathname.replace('/blog/', '').trim()
    if (segment) return segment
  }
  const params = new URLSearchParams(window.location.search)
  return params.get('post') || params.get('article') || null
}

function BlogPageComponent({ onNavigateHome }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSlug, setActiveSlug] = useState(getSlugFromUrl)
  const [selectedPostObj, setSelectedPostObj] = useState(null)

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

    const handlePopState = () => {
      const slug = getSlugFromUrl()
      setActiveSlug(slug)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      mounted = false
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const handleSelectPost = (post) => {
    const slug = post?.slug?.current
    if (!slug) return
    setSelectedPostObj(post)
    setActiveSlug(slug)
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/blog/${slug}`)
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }

  const handleBackToFeed = () => {
    setActiveSlug(null)
    setSelectedPostObj(null)
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/blog')
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }

  // If a post slug is active, render the dedicated Article Page view
  if (activeSlug) {
    return (
      <BlogPostPage
        slug={activeSlug}
        initialPost={selectedPostObj}
        onBackToFeed={handleBackToFeed}
        onNavigateHome={onNavigateHome}
      />
    )
  }

  // Otherwise render the full Blog Feed
  return (
    <div className="blog-page">
      <nav className="blog-nav">
        <div className="blog-nav__left">
          <span className="blog-nav__domain">blog.<em>howsillyistoosilly.lol</em></span>
        </div>
        <div className="blog-nav__right">
          <button
            type="button"
            className="blog-back-btn"
            onClick={onNavigateHome}
          >
            <span>← howsillyistoosilly.lol</span>
          </button>
        </div>
      </nav>

      <main className="blog-page__content">
        <header className="blog-page__hero">
          <div className="blog-page__tag">Devlog · Articles · Thoughts</div>
          <h1 className="blog-page__title">
            Writing & <em>Experiments</em>
          </h1>
          <p className="blog-page__desc">
            just my thoughts and ramblings.
          </p>
        </header>

        <section className="blog-page__feed">
          <div className="sec-head" style={{ marginBottom: '1.5rem' }}>
            <span className="sec-num">all posts</span>
            <span className="photos-hint">{posts.length} {posts.length === 1 ? 'article' : 'articles'}</span>
          </div>

          <div className="blog-list">
            {loading ? (
              <div style={{ padding: '3rem 0', color: 'var(--mid)', fontSize: '0.8rem' }}>
                racking my brain to yap...
              </div>
            ) : posts.length === 0 ? (
              <div style={{ padding: '4rem 0', color: 'var(--mid)', fontSize: '0.8rem', lineHeight: '1.8' }}>
                No articles published yet.
              </div>
            ) : (
              posts.map((post, idx) => {
                const formattedDate = formatDate(post.publishedAt)
                const postNumber = post.num || String(idx + 1).padStart(2, '0')
                const coverImageUrl = post.mainImage
                  ? urlFor(post.mainImage)?.width(1200).auto('format').url() || post.mainImage.asset?.url
                  : null

                return (
                  <button
                    type="button"
                    key={post._id || post.slug?.current || idx}
                    className="blog-card"
                    onClick={() => handleSelectPost(post)}
                  >
                    {coverImageUrl && (
                      <div className="blog-card__image-container">
                        <img
                          src={coverImageUrl}
                          alt={post.mainImage?.alt || post.title}
                          className="blog-card__image"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="blog-card__glass-panel">
                      <div className="blog-card__glass-head">
                        <div className="blog-num">{postNumber}</div>
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
                      </div>

                      <h2 className="blog-title">{post.title}</h2>
                      {post.excerpt && <p className="blog-excerpt">{post.excerpt}</p>}

                      <div className="blog-action">
                        <span className="blog-action-btn">read article ↗</span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </section>
      </main>

      <footer className="blog-footer">
        <span>blog.howsillyistoosilly.lol</span>
        <span>© 2026</span>
        <button type="button" className="blog-footer-back" onClick={onNavigateHome}>
          howsillyistoosilly.lol ↑
        </button>
      </footer>
    </div>
  )
}

export default memo(BlogPageComponent)
