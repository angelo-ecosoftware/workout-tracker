import React, { useState, useEffect } from 'react';
import { ChevronRight, Eye } from 'lucide-react';

const WGER_EXACT_MATCHES: Record<string, number> = {
  "Lat Pulldown": 158,
  "Bench Press": 163,
  "Romanian Deadlift": 1700,
  "Plank": 1911,
};

export const WgerExerciseInfo: React.FC<{ exerciseName: string }> = ({ exerciseName }) => {
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchDescription = async () => {
      setLoading(true);
      try {
        let exerciseId = WGER_EXACT_MATCHES[exerciseName];

        if (!exerciseId) {
          // Attempt an autocomplete from the web endpoint using search
          try {
            const searchRes = await fetch(`https://wger.de/api/v2/exercise/?name=${encodeURIComponent(exerciseName)}&language=2`);
            if (searchRes.ok) {
              const searchData = await searchRes.json();
              if (searchData.results && searchData.results.length > 0) {
                const exactMatch = searchData.results.find((r: any) => r.name?.toLowerCase() === exerciseName?.toLowerCase());
                if (exactMatch) {
                  exerciseId = exactMatch.id;
                }
              }
            }
          } catch (e) {
            console.warn("Wger search failed, falling back", e);
          }
        }
        
        if (exerciseId) {
          try {
            const infoRes = await fetch(`https://wger.de/api/v2/exerciseinfo/${exerciseId}/`);
            if (!infoRes.ok) {
              setDescription("No detailed description available for this exercise.");
              setLoading(false);
              return;
            }
            const infoData = await infoRes.json();
            
            const translations = infoData.translations || [];
            const englishTranslation = translations.find((t: any) => t.language === 2);
            const anyTranslation = translations[0];
            
            if (englishTranslation && englishTranslation.description) {
              setDescription(englishTranslation.description);
            } else if (anyTranslation && anyTranslation.description) {
              setDescription(anyTranslation.description);
            } else {
              setDescription("No detailed description available for this exercise.");
            }
          } catch (e) {
            setDescription("No detailed description available for this exercise.");
          }
        } else {
          setDescription("No detailed description available for this exercise.");
        }
      } catch (e) {
        setDescription("No detailed description available for this exercise.");
      } finally {
        setLoading(false);
      }
    };

    fetchDescription();
  }, [exerciseName]);

  if (loading) {
    return <div className="text-[10px] text-gray-500 font-mono italic animate-pulse">Fetching exercise guide...</div>;
  }

  if (!description || description === "No detailed description available for this exercise.") {
    return null;
  }

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 text-gray-400 hover:text-white transition-colors cursor-pointer text-[11px] font-mono font-semibold"
      >
        <span className="flex items-center gap-2">
          <Eye className="w-3 h-3 text-[#C0FF00]" />
          How to perform
        </span>
        <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      
      {isOpen && (
        <div 
          className="wger-content p-4 pt-0 border-t border-[#222] mt-2 text-gray-400 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:ml-4 text-[11px]" 
          dangerouslySetInnerHTML={{ __html: description }} 
        />
      )}
    </div>
  );
};
