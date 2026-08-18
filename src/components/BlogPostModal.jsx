import { useEffect, memo } from 'react'
import { PortableText } from '@portabletext/react'
import { urlFor } from '../lib/sanity'
import { Chip } from './ProjectCard'

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
      const imageUrl = urlFor(value)?.width(1200).auto('format').url() || value.asset?.url
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

function BlogPostModalComponent({ post, onClose }) {
  useEffect(() => {
    if (!post) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Prevent body background scroll while reading
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [post, onClose])

  if (!post) return null

  const mainImageUrl = post.mainImage
    ? urlFor(post.mainImage)?.width(1200).auto('format').url() || post.mainImage.asset?.url
    : null

  const formattedDate = formatDate(post.publishedAt)

  return (
    <div
      className="blog-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-title"
    >
      <article className="blog-modal">
        <button
          className="blog-modal-close"
          onClick={onClose}
          type="button"
          aria-label="Close article"
        >
          <span>✕</span> close
        </button>

        <header className="blog-modal-header">
          <div className="blog-modal-meta">
            {formattedDate && <span>{formattedDate}</span>}
            {post.readTime && <span>· {post.readTime}</span>}
            {post.tags && post.tags.length > 0 && (
              <div className="blog-tags" style={{ display: 'inline-flex', marginLeft: '0.5rem' }}>
                {post.tags.map((tag) => (
                  <Chip key={tag} label={tag} />
                ))}
              </div>
            )}
          </div>
          <h1 className="blog-modal-title" id="article-title">
            {post.title}
          </h1>
          {post.excerpt && <p className="blog-modal-lead">{post.excerpt}</p>}
        </header>

        {mainImageUrl && (
          <img
            src={mainImageUrl}
            alt={post.mainImage?.alt || post.title}
            className="blog-modal-hero-img"
          />
        )}

        <div className="blog-prose">
          {Array.isArray(post.body) ? (
            <PortableText value={post.body} components={portableTextComponents} />
          ) : typeof post.body === 'string' ? (
            <p>{post.body}</p>
          ) : null}
        </div>

        <footer className="blog-modal-footer">
          <button
            className="blog-modal-close"
            style={{ position: 'static' }}
            onClick={onClose}
            type="button"
          >
            ← Back to Articles
          </button>
          <span style={{ fontSize: '0.62rem', letterSpacing: '1px', color: 'var(--mid)', textTransform: 'uppercase' }}>
            howsillyistoosilly · devlog
          </span>
        </footer>
      </article>
    </div>
  )
}

export default memo(BlogPostModalComponent)
