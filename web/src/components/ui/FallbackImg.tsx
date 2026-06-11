'use client';

// <img> that swaps to a fallback URL once if the primary fails — used to
// load derived/ thumbnails with the original as safety net (older uploads
// or GIFs have no thumb).

interface FallbackImgProps {
  src: string;
  fallback?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function FallbackImg({ src, fallback, alt, className, loading }: FallbackImgProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={(e) => {
        const img = e.currentTarget;
        if (fallback && img.src !== fallback) img.src = fallback;
      }}
    />
  );
}
