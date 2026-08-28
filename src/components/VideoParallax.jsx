import { memo } from 'react'
import VideoCard from './VideoCard'
import './VideoParallax.css'

function VideoParallax({ items = [], onOpenGallery, onOpenSeparateTab }) {
  return (
    <div className="reel-list">
      {items.map((item, i) => (
        <VideoCard 
          key={item.id || item.title || i} 
          index={i}
          direction={i % 2 === 0 ? 1 : -1} 
          onOpenGallery={onOpenGallery}
          onOpenSeparateTab={onOpenSeparateTab}
          {...item} 
        />
      ))}
    </div>
  )
}

export default memo(VideoParallax)

