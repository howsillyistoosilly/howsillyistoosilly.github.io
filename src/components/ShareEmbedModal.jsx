import { useState, useEffect, memo } from 'react'
import { urlFor } from '../lib/sanity'
import './Blog.css'

function ShareEmbedModalComponent({ post, onClose }) {
  const [copiedType, setCopiedType] = useState(null)
  const [activeTab, setActiveTab] = useState('preview') // 'preview' | 'embed' | 'markdown'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!post) return null

  const slug = post.slug?.current || ''
  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.local')
  )

  // Live production domain for blog articles
  const productionDomain = 'https://blog.howsillyistoosilly.lol'

  // When hosted on custom domain (howsillyistoosilly.lol / blog.howsillyistoosilly.lol), use live origin
  const liveUrl = typeof window !== 'undefined' && !isLocal
    ? `${window.location.origin}/blog/${slug}`
    : `${productionDomain}/blog/${slug}`

  const postUrl = liveUrl
  const shareUrl = liveUrl

  const imageUrl = post.mainImage
    ? urlFor(post.mainImage)?.width(1200).auto('format').url() || post.mainImage.asset?.url
    : null

  const handleCopy = async (text, type) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 2200)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `"${post.title}" by @howsillyistoosilly\n\n${shareUrl}`
  )}`

  const embedCode = `<iframe src="${shareUrl}" width="100%" height="240" frameborder="0" style="border:1px solid rgba(255,255,255,0.15);border-radius:6px;overflow:hidden;" title="${post.title}"></iframe>`

  const markdownCode = `[![${post.title}](${imageUrl || ''})](${shareUrl})\n\n### [${post.title}](${shareUrl})\n> ${post.excerpt || 'Devlog by howsillyistoosilly'}`

  return (
    <div
      className="share-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="share-modal">
        <button
          type="button"
          className="share-modal-close"
          onClick={onClose}
          aria-label="Close share dialog"
        >
          ✕
        </button>

        <div className="share-modal-header">
          <div className="share-modal-tag">Share & Embed Article</div>
          <h2 className="share-modal-title">Spread the Word</h2>
        </div>

        {/* Tab switcher */}
        <div className="share-tabs">
          <button
            type="button"
            className={`share-tab${activeTab === 'preview' ? ' active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Live Embed Preview
          </button>
          <button
            type="button"
            className={`share-tab${activeTab === 'embed' ? ' active' : ''}`}
            onClick={() => setActiveTab('embed')}
          >
            HTML Embed Code
          </button>
          <button
            type="button"
            className={`share-tab${activeTab === 'markdown' ? ' active' : ''}`}
            onClick={() => setActiveTab('markdown')}
          >
            Markdown Card
          </button>
        </div>

        {/* TAB 1: LIVE EMBED PREVIEW */}
        {activeTab === 'preview' && (
          <div className="share-preview-wrap">
            <div className="share-embed-card">
              {imageUrl && (
                <div className="share-embed-card__img-wrap">
                  <img src={imageUrl} alt={post.title} className="share-embed-card__img" />
                </div>
              )}
              <div className="share-embed-card__body">
                <div className="share-embed-card__meta">
                  <span className="share-embed-card__site">blog.howsillyistoosilly.lol</span>
                  {post.readTime && <span>· {post.readTime}</span>}
                </div>
                <h3 className="share-embed-card__title">{post.title}</h3>
                {post.excerpt && <p className="share-embed-card__desc">{post.excerpt}</p>}
                <div className="share-embed-card__footer">
                  <span>Adarsh (howsillyistoosilly)</span>
                  <span className="share-embed-card__arrow">Read Article ↗</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HTML EMBED CODE */}
        {activeTab === 'embed' && (
          <div className="share-code-wrap">
            <pre className="share-code-block">
              <code>{embedCode}</code>
            </pre>
            <button
              type="button"
              className="share-action-btn"
              onClick={() => handleCopy(embedCode, 'html')}
            >
              {copiedType === 'html' ? 'Embed Code Copied! ✓' : 'Copy HTML Embed Code'}
            </button>
          </div>
        )}

        {/* TAB 3: MARKDOWN CARD */}
        {activeTab === 'markdown' && (
          <div className="share-code-wrap">
            <pre className="share-code-block">
              <code>{markdownCode}</code>
            </pre>
            <button
              type="button"
              className="share-action-btn"
              onClick={() => handleCopy(markdownCode, 'markdown')}
            >
              {copiedType === 'markdown' ? 'Markdown Copied! ✓' : 'Copy Markdown Snippet'}
            </button>
          </div>
        )}

        {/* Quick Link Share Actions */}
        <div className="share-quick-actions">
          <div className="share-link-input-wrap">
            <input
              type="text"
              readOnly
              value={postUrl}
              className="share-link-input"
              onClick={(e) => e.target.select()}
            />
            <button
              type="button"
              className="share-copy-btn"
              onClick={() => handleCopy(postUrl, 'link')}
            >
              {copiedType === 'link' ? 'Copied! ✓' : 'Copy Link'}
            </button>
          </div>

          <div className="share-social-row">
            <a
              href={twitterShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-social-btn"
            >
              <span>𝕏 Share on X / Twitter</span>
            </a>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                type="button"
                className="share-social-btn"
                onClick={() => {
                  navigator.share({
                    title: post.title,
                    text: post.excerpt || post.title,
                    url: postUrl,
                  }).catch(() => {})
                }}
              >
                <span>System Share ↗</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(ShareEmbedModalComponent)
