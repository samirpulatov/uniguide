import { useEffect, useState } from 'react';
import { housingPhotosApi } from '../api/housingPhotos';

interface AuthImageProps {
  photoId: string;
  alt: string;
  className?: string;
}

// <img src> cannot send the Authorization header, so the photo is fetched with the JWT as a blob
// and shown through a temporary object URL.
export function AuthImage({ photoId, alt, className }: AuthImageProps) {
  // remembers which photoId the result belongs to, so a stale image is never shown for a new id
  const [result, setResult] = useState<{ photoId: string; src: string | null } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | null = null;

    housingPhotosApi
      .getPhotoBlob(photoId, controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setResult({ photoId, src: objectUrl });
      })
      .catch(() => {
        // src null = failed
        if (!controller.signal.aborted) setResult({ photoId, src: null });
      });

    // on unmount or a new photoId: cancel the request and free the blob, otherwise it stays in memory
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId]);

  if (result?.photoId !== photoId) return <div className={className}>loading…</div>;
  if (!result.src) return <div className={className}>photo unavailable</div>;
  return <img src={result.src} alt={alt} className={className} />;
}
