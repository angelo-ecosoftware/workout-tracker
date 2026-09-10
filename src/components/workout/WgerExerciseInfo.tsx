import React, { useState, useCallback } from 'react';
import { ChevronRight, Eye } from 'lucide-react';

const WGER_EXACT_MATCHES: Record<string, number> = {
  "Lat Pulldown": 158,
  "Bench Press": 163,
  "Romanian Deadlift": 1700,
  "Plank": 1911,
};

const NO_DESC_FALLBACK = "No detailed description available for this exercise.";

export const WgerExerciseInfo: React.FC<{ exerciseName: string }> = React.memo(({ exerciseName }) => {
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchDescription = useCallback(async () => {
    const cacheKey = `wger_desc_${exerciseName.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      setDescription(cached);
      setHasFetched(true);
      return;
    }

    setLoading(true);
    let resultDesc = NO_DESC_FALLBACK;

    try {
      let exerciseId = WGER_EXACT_MATCHES[exerciseName];

      if (!exerciseId) {
        try {
          const searchRes = await fetch(
            `https://wger.de/api/v2/exercise/?name=${encodeURIComponent(exerciseName)}&language=2`
          );
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.results?.length > 0) {
              const exactMatch = (searchData.results as { id: number; name?: string }[]).find(
                (r) => r.name?.toLowerCase() === exerciseName?.toLowerCase()
              );
              if (exactMatch) {
                exerciseId = exactMatch.id;
              }
            }
          }
        } catch (e) {
          console.warn("Wger search failed", e);
        }
      }

      if (exerciseId) {
        const infoRes = await fetch(`https://wger.de/api/v2/exerciseinfo/${exerciseId}/`);
        if (infoRes.ok) {
          const infoData = await infoRes.json();
          const translations: { language?: number; description?: string }[] = infoData.translations || [];
          const englishTranslation = translations.find((t) => t.language === 2);
          const anyTranslation = translations[0];

          resultDesc =
            englishTranslation?.description ||
            anyTranslation?.description ||
            NO_DESC_FALLBACK;
        }
      }
    } catch (e) {
      resultDesc = NO_DESC_FALLBACK;
    } finally {
      // Cache both positive and negative results to avoid redundant external network hits
      localStorage.setItem(cacheKey, resultDesc);
      setDescription(resultDesc);
      setLoading(false);
      setHasFetched(true);
    }
  }, [exerciseName]);

  const handleToggle = () => {
    if (!isOpen && !hasFetched) {
      fetchDescription();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden text-xs">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-2.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-[11px] font-mono font-semibold"
      >
        <span className="flex items-center gap-2">
          <Eye className="w-3 h-3 text-[#C0FF00]" />
          How to perform
        </span>
        <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="p-4 pt-0 border-t border-[#222] mt-2 text-gray-400 text-[11px]">
          {loading ? (
            <div className="text-[10px] text-gray-500 font-mono italic animate-pulse py-2">
              Fetching exercise guide...
            </div>
          ) : description ? (
            <div
              className="wger-content [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:ml-4"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <div className="text-gray-500 italic py-1">No detailed description available.</div>
          )}
        </div>
      )}
    </div>
  );
});