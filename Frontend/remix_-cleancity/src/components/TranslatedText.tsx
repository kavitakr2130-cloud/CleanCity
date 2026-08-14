import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Globe } from 'lucide-react';

interface TranslatedTextProps {
  text: string;
  className?: string;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({ text, className = '' }) => {
  const { currentLanguage, translateText } = useApp();
  const [translated, setTranslated] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    if (!text || !text.trim()) {
      setTranslated('');
      return;
    }

    // Reset showOriginal status when text or currentLanguage changes
    setShowOriginal(false);

    if (currentLanguage === 'english') {
      setTranslated(text);
      setLoading(false);
      setError(false);
      return;
    }

    const fetchTranslation = async () => {
      setLoading(true);
      setError(false);
      try {
        const result = await translateText(text, currentLanguage);
        if (active) {
          setTranslated(result);
        }
      } catch (err) {
        console.error('Translation failed for text:', text, err);
        if (active) {
          setError(true);
          setTranslated(text);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchTranslation();

    return () => {
      active = false;
    };
  }, [text, currentLanguage, translateText]);

  if (!text || !text.trim()) {
    return null;
  }

  const isTranslated = translated && translated.trim().toLowerCase() !== text.trim().toLowerCase();

  return (
    <span className={`inline ${className}`}>
      {showOriginal ? (
        <span>{text}</span>
      ) : (
        <span>
          {loading ? (
            <span className="opacity-75 inline-flex items-center gap-1">
              {text}
              <span className="inline-block animate-spin text-[10px] text-slate-400" role="status">
                🌀
              </span>
            </span>
          ) : (
            translated || text
          )}
        </span>
      )}

      {/* View Original / Show Translation Button */}
      {!loading && !error && isTranslated && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowOriginal(!showOriginal);
          }}
          className="ml-2 inline-inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
          title={showOriginal ? "Show Translation" : "View Original"}
        >
          <Globe className="w-2.5 h-2.5 inline" />
          <span>{showOriginal ? "Show Translation" : "View Original"}</span>
        </button>
      )}

      {/* Error Badge */}
      {!loading && error && (
        <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded select-none">
          Original language displayed – Translation unavailable
        </span>
      )}
    </span>
  );
};
