import { memo } from 'react'
import VideoCard from './VideoCard'
import './VideoParallax.css'

function VideoParallax({ items = [] }) {
  return (
    <div className="reel-list">
      {items.map((item, i) => (
        <VideoCard 
          key={item.title || i} 
          direction={i % 2 === 0 ? 1 : -1} 
          {...item} 
        />
      ))}
    </div>
  )
}

export default memo(VideoParallax)
