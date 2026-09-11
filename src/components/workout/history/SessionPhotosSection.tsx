import React, { useEffect, useState } from 'react';
import { Camera, FolderOpen, Loader2, Trash2 } from 'lucide-react';
import { getWorkoutPhotoUrl } from '../../../lib/storage.ts';

interface SessionPhotosSectionProps {
  sessionId: string;
  photos: string[] | null | undefined;
  uploadingSessionId: string | null;
  onTriggerAddPhoto: (sessionId: string, source: 'camera' | 'files') => void;
  onDeletePhoto: (sessionId: string, photoIndex: number) => void;
}

export const SessionPhotosSection: React.FC<SessionPhotosSectionProps> = ({
  sessionId,
  photos,
  uploadingSessionId,
  onTriggerAddPhoto,
  onDeletePhoto,
}) => {
  const photoList = photos || [];
  const isUploading = uploadingSessionId === sessionId;
  const [resolvedPhotos, setResolvedPhotos] = useState<Array<{ index: number; url: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      photoList.map(async (photo, index) => ({
        index,
        url: await getWorkoutPhotoUrl(photo),
      }))
    ).then((resolved) => {
      if (cancelled) return;
      setResolvedPhotos(
        resolved.filter((photo): photo is { index: number; url: string } => Boolean(photo.url))
      );
    });

    return () => {
      cancelled = true;
    };
  }, [photos]);

  return (
    <div className="mb-6 p-3.5 bg-[#161616] border border-[#2a2a2a] rounded-xl text-xs">
      <div className="flex items-center justify-between mb-3 text-gray-300">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#C0FF00]" />
          <span className="font-mono text-[10px] uppercase font-bold text-[#C0FF00]">
            Progress Photos ({photoList.length}/5)
          </span>
        </div>
        {photoList.length < 5 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onTriggerAddPhoto(sessionId, 'camera')}
              disabled={isUploading}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#222] hover:bg-[#2c2c2c] text-[#C0FF00] text-[10px] font-mono font-bold uppercase transition-colors"
              title="Take Photo with Camera"
            >
              {isUploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Camera className="w-3 h-3" />
              )}
              Camera
            </button>
            <button
              onClick={() => onTriggerAddPhoto(sessionId, 'files')}
              disabled={isUploading}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#222] hover:bg-[#2c2c2c] text-white hover:text-[#C0FF00] text-[10px] font-mono font-bold uppercase transition-colors"
              title="Upload from File Manager or Gallery"
            >
              <FolderOpen className="w-3 h-3" />
              Files
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {resolvedPhotos.map(({ index, url: photoUrl }) => (
          <div
            key={index}
            className="relative group aspect-square rounded-xl overflow-hidden border border-[#333] bg-[#1a1a1a]"
          >
            <a
              href={photoUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full h-full block"
              title="View photo full size"
            >
              <img
                src={photoUrl}
                alt={`Progress photo ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </a>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeletePhoto(sessionId, index);
              }}
              className="absolute top-1 right-1 p-1 rounded-lg bg-black/80 hover:bg-red-600 text-white transition-colors cursor-pointer opacity-85"
              title="Remove photo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {photoList.length < 5 && (
          <div className="flex gap-2 aspect-square">
            <button
              type="button"
              onClick={() => onTriggerAddPhoto(sessionId, 'camera')}
              disabled={isUploading}
              className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#333] hover:border-[#C0FF00] bg-[#141414] hover:bg-[#1a1a1a] text-gray-400 hover:text-[#C0FF00] transition-all cursor-pointer p-1.5"
              title="Take Photo with Camera"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#C0FF00]" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-center">
                Camera
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTriggerAddPhoto(sessionId, 'files')}
              disabled={isUploading}
              className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#333] hover:border-[#C0FF00] bg-[#141414] hover:bg-[#1a1a1a] text-gray-400 hover:text-[#C0FF00] transition-all cursor-pointer p-1.5"
              title="Choose from Gallery or Files"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-center">
                Files
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
