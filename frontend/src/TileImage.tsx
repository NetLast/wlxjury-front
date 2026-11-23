import { useState, type ImgHTMLAttributes } from 'react'

/**
 * A tile's thumbnail; one that fails to load (a file deleted on Commons, the proxy down) leaves
 * the tile's grey with an icon instead of a broken image, as unitegallery's patched tiles do.
 * The tile's alt stays on the image for screen readers.
 */
export default function TileImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <span className={`${props.className ?? ''} wlx-island-failed`} style={props.style} role="img" aria-label={props.alt}>
        <i className="bi bi-image" aria-hidden="true" />
      </span>
    )
  }
  return <img {...props} alt={props.alt ?? ''} onError={() => setFailed(true)} />
}
