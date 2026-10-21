import { memo } from 'react'

function GridDividerComponent({ top, bottom, className = '' }) {
  const positionClass = top
    ? 'dvb-grid-rule--top'
    : bottom
    ? 'dvb-grid-rule--bottom'
    : ''

  return (
    <div
      className={`dvb-grid-rule ${positionClass} ${className}`}
      aria-hidden="true"
    >
      {/* 4 Corner Crosshairs corresponding to the 4 vertical structural guidelines */}
      <i className="grid-cross grid-cross--outer-l" />
      <i className="grid-cross grid-cross--inner-l" />
      <i className="grid-cross grid-cross--inner-r" />
      <i className="grid-cross grid-cross--outer-r" />
    </div>
  )
}

export default memo(GridDividerComponent)
