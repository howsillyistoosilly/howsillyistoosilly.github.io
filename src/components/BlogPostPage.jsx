import { useEffect, useState, memo } from 'react'
import { PortableText } from '@portabletext/react'
import { fetchPostBySlug, urlFor } from '../lib/sanity'
import { Chip } from './ProjectCard'
import ShareEmbedModal from './ShareEmbedModal'
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

const portableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value) return null
      const imageUrl = urlFor(value)?.width(1400).auto('format').url() || value.asset?.url
      if (!imageUrl) return null

      return (
        <figure className="blog-figure">
          <img src={imageUrl} alt={value.alt || 'Post illustration'} loading="lazy" />
          {value.caption && <figcaption>{value.caption}</figcaption>}
        </figure>
      )
    },
    code: ({ value }) => {
      if (!value?.code) return null
      return (
        <div className="blog-code-wrap">
          {value.language && <div className="blog-code-lang">{value.language}</div>}
          <pre data-language={value.language || 'text'}>
            <code>{value.code}</code>
          </pre>
        </div>
      )
    },
  },
  marks: {
    link: ({ value, children }) => {
      const target = (value?.href || '').startsWith('http') ? '_blank' : undefined
      return (
        <a href={value?.href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined}>
          {children}
        </a>
      )
    },
    code: ({ children }) => <code>{children}</code>,
  },
  block: {
    h1: ({ children }) => <h1>{children}</h1>,
    h2: ({ children }) => <h2>{children}</h2>,
    h3: ({ children }) => <h3>{children}</h3>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  },
}

function BlogPostPageComponent({ slug, initialPost, onBackToFeed, onNavigateHome }) {
  const [post, setPost] = useState(initialPost || null)
  const [loading, setLoading] = useState(!initialPost)
  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [slug])

  useEffect(() => {
    if (initialPost && initialPost.slug?.current === slug) {
      setPost(initialPost)
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)

    fetchPostBySlug(slug)
      .then((data) => {
        if (mounted) {
          setPost(data)
        }
      })
      .catch((err) => {
        console.error('Error fetching post:', err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [slug, initialPost])

  // Update dynamic page title when post loads
  useEffect(() => {
    if (post?.title) {
      document.title = `${post.title} — blog.howsillyistoosilly.lol`
    } else {
      document.title = 'howsillyistoosilly — devlogs'
    }
    return () => {
      document.title = 'howsillyistoosilly — portfolio & blog'
    }
  }, [post])

  const formattedDate = post ? formatDate(post.publishedAt) : ''
  const mainImageUrl = post?.mainImage
    ? urlFor(post.mainImage)?.width(1400).auto('format').url() || post.mainImage.asset?.url
    : null

  return (
    <div className="blog-post-page">
      <nav className="blog-nav">
        <div className="blog-nav__left">
          <button type="button" className="blog-nav-brand-btn" onClick={onBackToFeed}>
            blog.<em>howsillyistoosilly.lol</em>
          </button>
        </div>
        <div className="blog-nav__right" style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="blog-back-btn"
            onClick={onBackToFeed}
          >
            <span>← all posts</span>
          </button>
          <button
            type="button"
            className="blog-back-btn"
            onClick={onNavigateHome}
          >
            <span>portfolio ↗</span>
          </button>
        </div>
      </nav>

      <main className="blog-post-page__content">
        {loading ? (
          <div style={{ padding: '6rem 0', color: 'var(--mid)', fontSize: '0.85rem' }}>
            racking my brain to yap...
          </div>
        ) : !post ? (
          <div style={{ padding: '6rem 0', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--fg)' }}>Article not found</h2>
            <p style={{ color: 'var(--mid)', marginBottom: '2rem', fontSize: '0.85rem' }}>
              The post you are looking for does not exist or has been removed.
            </p>
            <button type="button" className="blog-back-btn" onClick={onBackToFeed}>
              ← Back to all posts
            </button>
          </div>
        ) : (
          <article className="blog-article">
            <header className="blog-article__header">
              <div className="blog-article__meta">
                {formattedDate && <span>{formattedDate}</span>}
                {post.readTime && <span>· {post.readTime}</span>}
                {post.tags && post.tags.length > 0 && (
                  <div className="blog-tags" style={{ display: 'inline-flex', marginLeft: '0.5rem' }}>
                    {post.tags.map((tag) => (
                      <Chip key={tag} label={tag} />
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="blog-share-trigger-btn"
                  onClick={() => setShowShareModal(true)}
                  title="Share & Embed this article"
                >
                  <span>share / embed ↗</span>
                </button>
              </div>

              <h1 className="blog-article__title">{post.title}</h1>

              {post.excerpt && <p className="blog-article__lead">{post.excerpt}</p>}
            </header>

            {mainImageUrl && (
              <div className="blog-article__hero-wrap">
                <img
                  src={mainImageUrl}
                  alt={post.mainImage?.alt || post.title}
                  className="blog-article__hero-img"
                />
                {post.mainImage?.alt && (
                  <div className="blog-article__img-caption">{post.mainImage.alt}</div>
                )}
              </div>
            )}

            <div className="blog-prose">
              {Array.isArray(post.body) ? (
                <PortableText value={post.body} components={portableTextComponents} />
              ) : typeof post.body === 'string' ? (
                <p>{post.body}</p>
              ) : null}
            </div>

            <footer className="blog-article__footer">
              <div className="blog-article__footer-actions">
                <button
                  type="button"
                  className="blog-back-btn"
                  onClick={onBackToFeed}
                >
                  ← Back to all posts
                </button>
                <button
                  type="button"
                  className="blog-share-trigger-btn"
                  onClick={() => setShowShareModal(true)}
                >
                  <span>share & embed ↗</span>
                </button>
              </div>
              <span style={{ fontSize: '0.62rem', letterSpacing: '1.5px', color: 'var(--mid)', textTransform: 'uppercase' }}>
                howsillyistoosilly · devlog
              </span>
            </footer>
          </article>
        )}
      </main>

      <footer className="blog-footer">
        <span>blog.howsillyistoosilly.lol</span>
        <span>© 2026</span>
        <button type="button" className="blog-footer-back" onClick={onNavigateHome}>
          howsillyistoosilly.lol ↑
        </button>
      </footer>

      {showShareModal && post && (
        <ShareEmbedModal
          post={post}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}

export default memo(BlogPostPageComponent)
