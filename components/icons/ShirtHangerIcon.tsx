import { useId, type SVGProps } from "react"

interface ShirtHangerIconProps extends SVGProps<SVGSVGElement> {
  title?: string
}

export function ShirtHangerIcon({
  title = "Icono de ropa",
  ...props
}: ShirtHangerIconProps) {
  const bodyCutoutMaskId = useId()

  return (
    <svg
      viewBox="0 0 256 300"
      fill="none"
      role="img"
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      <path
        fill="currentColor"
        d="M127.5 16c-21.4 0-38.5 17.1-38.5 33.2 0 8.2 6.7 14.9 14.9 14.9 6.9 0 12.9-4.8 14.4-11.4 1.2-5.2 5.7-9 11-9 6.2 0 11.3 5.1 11.3 11.3 0 6.1-4.9 11.1-11 11.3-6.9.1-12.5 5.7-12.5 12.6V99h22.4V89.4c14.2-5.6 24.4-19.4 24.4-35.7C164 31.2 147.8 16 127.5 16Z"
      />

      <path
        fill="currentColor"
        d="M72 94c16.6-12 35.9-18.7 56-18.7 20.1 0 39.4 6.7 56 18.7l-8.2 11.5c-14.2-9.8-30.7-15.2-47.8-15.2-17.1 0-33.6 5.4-47.8 15.2L72 94Z"
      />

      <mask id={bodyCutoutMaskId} maskUnits="userSpaceOnUse">
        <rect x="0" y="0" width="256" height="300" fill="#ffffff" />
        <path
          fill="#000000"
          d="M92.5 112.5c10.4-8.4 22.8-12.9 35.5-12.9 12.7 0 25.1 4.5 35.5 12.9l-8.4 12.6h-54.2l-8.4-12.6Z"
        />
        <ellipse cx="128" cy="142" rx="20" ry="6.8" fill="#000000" />
      </mask>

      <path
        fill="currentColor"
        mask={`url(#${bodyCutoutMaskId})`}
        d="M66.3 92.6 32.2 98.1 10.8 125.8c-8.2 10.5-2.6 25.8 10.5 28.4l25.1 5v95.2c0 17.4 14.1 31.6 31.6 31.6h99.9c17.4 0 31.6-14.1 31.6-31.6v-95.2l25.1-5c13.1-2.6 18.7-17.9 10.5-28.4l-21.4-27.7-34.1-5.5-11.6 8.1a83.6 83.6 0 0 0-50-16.6c-18.3 0-35.8 5.9-50 16.6l-11.7-8.1Z"
      />
    </svg>
  )
}
