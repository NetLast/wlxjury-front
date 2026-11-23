import { useState, type ImgHTMLAttributes } from 'react'

const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#e0e0e0"/>` +
      `<text x="50%" y="50%" fill="#757575" font-family="sans-serif" font-size="20" text-anchor="middle">Фото недоступне</text></svg>`
  )

/** An <img> that shows a placeholder when the picture can't be loaded. */
export default function FallbackImg(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false)
  return (
    <img
      {...props}
      alt={props.alt ?? ''}
      src={failed ? PLACEHOLDER : props.src}
      srcSet={failed ? undefined : props.srcSet}
      onError={() => setFailed(true)}
    />
  )
}
