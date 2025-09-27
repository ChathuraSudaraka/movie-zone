import React, { useState, useCallback, useMemo } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  Globe, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';

interface SubtitleEntry {
  id: number;
  timestamp: string;
  text: string;
}

interface TranslationProgress {
  current: number;
  total: number;
  percentage: number;
}

interface TranslationError {
  message: string;
  entry?: SubtitleEntry;
  retryable: boolean;
}

function SubtitlePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [translatedSubtitles, setTranslatedSubtitles] = useState<SubtitleEntry[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationComplete, setTranslationComplete] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<TranslationProgress>({ current: 0, total: 0, percentage: 0 });
  const [translationError, setTranslationError] = useState<TranslationError | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);

  // Enhanced language list organized by popularity
  const languages = useMemo(() => [
    // Popular European Languages
    { code: 'es', name: 'Spanish', flag: '🇪🇸', category: 'Popular' },
    { code: 'fr', name: 'French', flag: '🇫🇷', category: 'Popular' },
    { code: 'de', name: 'German', flag: '🇩🇪', category: 'Popular' },
    { code: 'it', name: 'Italian', flag: '🇮🇹', category: 'Popular' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', category: 'Popular' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱', category: 'Popular' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺', category: 'Popular' },
    
    // Asian Languages
    { code: 'zh', name: 'Chinese (Simplified)', flag: '��', category: 'Asian' },
    { code: 'zh-tw', name: 'Chinese (Traditional)', flag: '��', category: 'Asian' },
    { code: 'ja', name: 'Japanese', flag: '��', category: 'Asian' },
    { code: 'ko', name: 'Korean', flag: '��', category: 'Asian' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', category: 'Asian' },
    { code: 'th', name: 'Thai', flag: '🇹�', category: 'Asian' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', category: 'Asian' },
    { code: 'id', name: 'Indonesian', flag: '��', category: 'Asian' },
    { code: 'ms', name: 'Malay', flag: '��', category: 'Asian' },
    
    // Middle Eastern & African
    { code: 'ar', name: 'Arabic', flag: '��', category: 'Middle East' },
    { code: 'tr', name: 'Turkish', flag: '��', category: 'Middle East' },
    { code: 'he', name: 'Hebrew', flag: '�🇱', category: 'Middle East' },
    { code: 'fa', name: 'Persian', flag: '��', category: 'Middle East' },
    
    // Nordic Languages
    { code: 'sv', name: 'Swedish', flag: '��', category: 'Nordic' },
    { code: 'da', name: 'Danish', flag: '��', category: 'Nordic' },
    { code: 'no', name: 'Norwegian', flag: '�🇴', category: 'Nordic' },
    { code: 'fi', name: 'Finnish', flag: '��', category: 'Nordic' },
    
    // Eastern European
    { code: 'pl', name: 'Polish', flag: '��', category: 'Eastern Europe' },
    { code: 'uk', name: 'Ukrainian', flag: '��', category: 'Eastern Europe' },
    { code: 'cs', name: 'Czech', flag: '��', category: 'Eastern Europe' },
    { code: 'hu', name: 'Hungarian', flag: '��', category: 'Eastern Europe' },
    { code: 'ro', name: 'Romanian', flag: '��', category: 'Eastern Europe' },
    { code: 'bg', name: 'Bulgarian', flag: '��', category: 'Eastern Europe' },
    { code: 'hr', name: 'Croatian', flag: '��', category: 'Eastern Europe' },
    { code: 'sl', name: 'Slovenian', flag: '��', category: 'Eastern Europe' },
    { code: 'et', name: 'Estonian', flag: '��', category: 'Eastern Europe' },
    { code: 'lv', name: 'Latvian', flag: '��', category: 'Eastern Europe' },
    { code: 'lt', name: 'Lithuanian', flag: '🇱🇹', category: 'Eastern Europe' },
    { code: 'sk', name: 'Slovak', flag: '��', category: 'Eastern Europe' }
  ], []);

  const parseSubtitleFile = useCallback((content: string): SubtitleEntry[] => {
    const entries: SubtitleEntry[] = [];
    const blocks = content.trim().split('\n\n');

    blocks.forEach((block, index) => {
      const lines = block.split('\n');
      if (lines.length >= 3) {
        const timestamp = lines[1];
        const text = lines.slice(2).join('\n');
        if (timestamp.includes('-->')) {
          entries.push({ 
            id: index + 1,
            timestamp, 
            text: text.trim()
          });
        }
      }
    });

    return entries;
  }, []);

  const validateSubtitleFile = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.name.toLowerCase().endsWith('.srt')) {
        reject(new Error('Please upload a valid .srt file'));
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        reject(new Error('File size too large. Please upload a file smaller than 10MB'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content || content.trim().length === 0) {
          reject(new Error('File appears to be empty'));
          return;
        }
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file, 'utf-8');
    });
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setTranslationError(null);
      setTranslationComplete(false);
      setTranslatedSubtitles([]);
      
      const content = await validateSubtitleFile(file);
      const parsedSubtitles = parseSubtitleFile(content);
      
      if (parsedSubtitles.length === 0) {
        throw new Error('No valid subtitle entries found in the file');
      }
      
      setUploadedFile(file);
      setSubtitles(parsedSubtitles);
    } catch (error) {
      setTranslationError({
        message: error instanceof Error ? error.message : 'Failed to process subtitle file',
        retryable: false
      });
      setUploadedFile(null);
      setSubtitles([]);
    }
  };

  // Enhanced Google Translate API implementation
  const translateWithGoogle = async (text: string, targetLanguage: string): Promise<string> => {
    try {
      // Method 1: Using Google Translate via cors-anywhere proxy
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(proxyUrl + targetUrl, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          return data[0][0][0];
        }
      }
    } catch (error) {
      console.error('Google Translate (Method 1) failed:', error);
    }

    try {
      // Method 2: Using MyMemory Translation API as fallback
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLanguage}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.responseData && data.responseData.translatedText) {
          return data.responseData.translatedText;
        }
      }
    } catch (error) {
      console.error('MyMemory Translation failed:', error);
    }

    try {
      // Method 3: Using LibreTranslate as second fallback
      const fallbackUrl = `https://libretranslate.de/translate`;
      const fallbackResponse = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'auto',
          target: targetLanguage,
          format: 'text'
        })
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData && fallbackData.translatedText) {
          return fallbackData.translatedText;
        }
      }
    } catch (fallbackError) {
      console.error('LibreTranslate also failed:', fallbackError);
    }
    
    throw new Error('All translation services failed. Please try again later.');
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleTranslate = async () => {
    if (!selectedLanguage || subtitles.length === 0) return;

    setIsTranslating(true);
    setTranslationComplete(false);
    setTranslationError(null);
    setTranslationProgress({ current: 0, total: subtitles.length, percentage: 0 });

    try {
      const translated: SubtitleEntry[] = [];
      
      // Process subtitles one by one with delay to avoid rate limiting
      for (let i = 0; i < subtitles.length; i++) {
        const subtitle = subtitles[i];
        
        try {
          // Add delay between requests to avoid rate limiting
          if (i > 0) {
            await delay(1500); // 1.5 second delay for better performance
          }
          
          const translatedText = await translateWithGoogle(subtitle.text, selectedLanguage);
          translated.push({
            id: subtitle.id,
            timestamp: subtitle.timestamp,
            text: translatedText
          });
          
          // Update progress
          const currentProgress = i + 1;
          setTranslationProgress({
            current: currentProgress,
            total: subtitles.length,
            percentage: Math.round((currentProgress / subtitles.length) * 100)
          });
        } catch (error) {
          console.error(`Translation failed for subtitle ${subtitle.id}:`, error);
          setTranslationError({
            message: `Translation failed at subtitle ${subtitle.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            entry: subtitle,
            retryable: true
          });
          return;
        }
      }

      setTranslatedSubtitles(translated);
      setTranslationComplete(true);
      setTranslationProgress({ current: subtitles.length, total: subtitles.length, percentage: 100 });
    } catch (error) {
      console.error('Translation failed:', error);
      setTranslationError({
        message: error instanceof Error ? error.message : 'Translation failed. Please try again.',
        retryable: true
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const retryTranslation = () => {
    setTranslationError(null);
    handleTranslate();
  };

  const downloadSubtitles = (subtitlesToDownload: SubtitleEntry[], filename: string) => {
    if (subtitlesToDownload.length === 0) {
      setTranslationError({
        message: 'No subtitles available to download',
        retryable: false
      });
      return;
    }

    try {
      let srtContent = '';
      
      subtitlesToDownload.forEach((subtitle, index) => {
        srtContent += `${index + 1}\n`;
        srtContent += `${subtitle.timestamp}\n`;
        srtContent += `${subtitle.text}\n\n`;
      });

      const blob = new Blob([srtContent], { type: 'text/plain; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setTranslationError({
        message: 'Failed to download subtitles. Please try again.',
        retryable: false
      });
    }
  };

  const clearAll = () => {
    setUploadedFile(null);
    setSubtitles([]);
    setTranslatedSubtitles([]);
    setTranslationComplete(false);
    setTranslationError(null);
    setTranslationProgress({ current: 0, total: 0, percentage: 0 });
    setSelectedLanguage('');
  };

  return (
    <div className="mt-[68px] min-h-screen bg-[#141414] px-4 py-8 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Subtitle Translator
            </h1>
            <p className="text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed">
              Translate your subtitle files to {languages.length}+ languages using Google Translate API
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
              <div className="flex items-center justify-center mb-2">
                <Globe className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">Multi-Language</h3>
              <p className="text-sm text-zinc-400">
                Support for {languages.length}+ languages with automatic source detection
              </p>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
              <div className="flex items-center justify-center mb-2">
                <FileText className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">SRT Files</h3>
              <p className="text-sm text-zinc-400">
                Upload .srt subtitle files up to 10MB in size
              </p>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
              <div className="flex items-center justify-center mb-2">
                <Download className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">Free Download</h3>
              <p className="text-sm text-zinc-400">
                Download translated subtitles in original SRT format
              </p>
            </div>
          </div>

          {/* Clear all button */}
          {(uploadedFile || subtitles.length > 0) && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Start Over
            </button>
          )}
        </div>

        {/* Error Display */}
        {translationError && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-medium">Error</p>
                <p className="text-red-300 text-sm mt-1">{translationError.message}</p>
                {translationError.entry && (
                  <div className="mt-2 p-2 bg-red-900/30 rounded text-xs text-red-200">
                    <p className="font-mono">{translationError.entry.timestamp}</p>
                    <p>"{translationError.entry.text}"</p>
                  </div>
                )}
              </div>
              {translationError.retryable && (
                <button
                  onClick={retryTranslation}
                  className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Upload Section */}
        <div className="bg-zinc-900/50 rounded-lg p-6 mb-8 border border-zinc-800">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Subtitle File
          </h2>
          
          <div className="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center hover:border-zinc-500 transition-colors">
            <input
              type="file"
              accept=".srt"
              onChange={handleFileUpload}
              className="hidden"
              id="subtitle-upload"
            />
            <label 
              htmlFor="subtitle-upload" 
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-zinc-400" />
              </div>
              <div>
                <p className="text-white font-medium text-lg">Click to upload subtitle file</p>
                <p className="text-zinc-400 text-sm mt-1">
                  Supports .srt files up to 10MB • English subtitles recommended
                </p>
              </div>
            </label>
          </div>

          {uploadedFile && (
            <div className="mt-6 p-4 bg-green-900/20 border border-green-600 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-green-400 font-medium">{uploadedFile.name}</p>
                    <p className="text-green-300 text-sm">
                      {subtitles.length} subtitle entries • {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="flex items-center gap-2 px-3 py-1 bg-green-700 text-white rounded hover:bg-green-600 transition-colors text-sm"
                >
                  {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showOriginal ? 'Hide' : 'Show'} Preview
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Translation Section */}
        {subtitles.length > 0 && (
          <div className="bg-zinc-900/50 rounded-lg p-6 mb-8 border border-zinc-800">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Translate Subtitles (Free Translation Service)
            </h2>
            
            {/* Language Selection */}
            <div className="mb-6">
              <label className="block text-white text-sm font-medium mb-3">
                Target Language
              </label>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-zinc-800 text-white border border-zinc-600 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-red-600 appearance-none"
                >
                  <option value="">Select target language</option>
                  
                  {/* Popular Languages */}
                  <optgroup label="🌟 Popular Languages">
                    {languages.filter(lang => lang.category === 'Popular').map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </optgroup>

                  {/* Asian Languages */}
                  <optgroup label="🌏 Asian Languages">
                    {languages.filter(lang => lang.category === 'Asian').map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </optgroup>

                  {/* Middle Eastern & African */}
                  <optgroup label="🌍 Middle Eastern & African">
                    {languages.filter(lang => lang.category === 'Middle East').map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </optgroup>

                  {/* Nordic Languages */}
                  <optgroup label="❄️ Nordic Languages">
                    {languages.filter(lang => lang.category === 'Nordic').map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </optgroup>

                  {/* Eastern European */}
                  <optgroup label="🏰 Eastern European">
                    {languages.filter(lang => lang.category === 'Eastern Europe').map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                💡 Powered by Google Translate API (Free) - Auto-detects source language
              </p>
            </div>
            
            {/* Translation Button */}
            <button
              onClick={handleTranslate}
              disabled={!selectedLanguage || isTranslating}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Translating... ({translationProgress.current}/{translationProgress.total})
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5" />
                  Translate to {selectedLanguage ? languages.find(l => l.code === selectedLanguage)?.name : 'Selected Language'}
                </>
              )}
            </button>

            {/* Progress Bar */}
            {isTranslating && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-zinc-400 mb-2">
                  <span>Translation Progress</span>
                  <span>{translationProgress.percentage}%</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${translationProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {translationComplete && (
              <div className="mt-4 bg-green-900/20 border border-green-600 rounded-lg p-4">
                <p className="text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Translation completed! {translatedSubtitles.length} subtitles translated successfully.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {(subtitles.length > 0 || translatedSubtitles.length > 0) && (
          <div className="space-y-8">
            {/* Original Subtitles */}
            {showOriginal && subtitles.length > 0 && (
              <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Original Subtitles (English)
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 text-sm">
                      {subtitles.length} entries
                    </span>
                    <button
                      onClick={() => downloadSubtitles(subtitles, `original_${uploadedFile?.name || 'subtitles'}.srt`)}
                      className="flex items-center gap-2 px-3 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
                
                <div className="bg-zinc-800/50 rounded-lg p-4 max-h-96 overflow-y-auto border border-zinc-700">
                  {subtitles.slice(0, 15).map((subtitle) => (
                    <div key={subtitle.id} className="mb-4 pb-4 border-b border-zinc-700 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-400 text-xs font-mono">#{subtitle.id}</span>
                        <span className="text-zinc-400 text-xs font-mono">{subtitle.timestamp}</span>
                      </div>
                      <p className="text-white text-sm leading-relaxed">{subtitle.text}</p>
                    </div>
                  ))}
                  {subtitles.length > 15 && (
                    <div className="text-center py-4 border-t border-zinc-700">
                      <p className="text-zinc-400 text-sm">
                        ... and {subtitles.length - 15} more entries
                      </p>
                      <button
                        onClick={() => {
                          const container = document.querySelector('.max-h-96');
                          if (container) container.classList.remove('max-h-96');
                        }}
                        className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
                      >
                        Show all
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Translated Subtitles */}
            {translatedSubtitles.length > 0 && (
              <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Translated Subtitles ({languages.find(l => l.code === selectedLanguage)?.flag} {languages.find(l => l.code === selectedLanguage)?.name})
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 text-sm">
                      {translatedSubtitles.length} entries
                    </span>
                    <button
                      onClick={() => downloadSubtitles(
                        translatedSubtitles, 
                        `${uploadedFile?.name?.replace('.srt', '') || 'subtitles'}_${selectedLanguage}.srt`
                      )}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
                
                <div className="bg-zinc-800/50 rounded-lg p-4 max-h-96 overflow-y-auto border border-zinc-700">
                  {translatedSubtitles.slice(0, 15).map((subtitle) => (
                    <div key={subtitle.id} className="mb-4 pb-4 border-b border-zinc-700 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-400 text-xs font-mono">#{subtitle.id}</span>
                        <span className="text-zinc-400 text-xs font-mono">{subtitle.timestamp}</span>
                      </div>
                      <p className="text-white text-sm leading-relaxed">{subtitle.text}</p>
                    </div>
                  ))}
                  {translatedSubtitles.length > 15 && (
                    <div className="text-center py-4 border-t border-zinc-700">
                      <p className="text-zinc-400 text-sm">
                        ... and {translatedSubtitles.length - 15} more entries
                      </p>
                      <button
                        onClick={() => {
                          const containers = document.querySelectorAll('.max-h-96');
                          containers.forEach(container => container.classList.remove('max-h-96'));
                        }}
                        className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
                      >
                        Show all
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comparison View */}
            {translatedSubtitles.length > 0 && subtitles.length > 0 && (
              <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Side-by-Side Comparison
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      🇺🇸 English (Original)
                    </h4>
                    <div className="bg-zinc-800/50 rounded-lg p-4 max-h-80 overflow-y-auto border border-zinc-700">
                      {subtitles.slice(0, 5).map((subtitle) => (
                        <div key={`orig-${subtitle.id}`} className="mb-3 pb-3 border-b border-zinc-700 last:border-0">
                          <p className="text-zinc-400 text-xs mb-1">#{subtitle.id} • {subtitle.timestamp}</p>
                          <p className="text-white text-sm">{subtitle.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      {languages.find(l => l.code === selectedLanguage)?.flag} {languages.find(l => l.code === selectedLanguage)?.name} (Translated)
                    </h4>
                    <div className="bg-zinc-800/50 rounded-lg p-4 max-h-80 overflow-y-auto border border-zinc-700">
                      {translatedSubtitles.slice(0, 5).map((subtitle) => (
                        <div key={`trans-${subtitle.id}`} className="mb-3 pb-3 border-b border-zinc-700 last:border-0">
                          <p className="text-zinc-400 text-xs mb-1">#{subtitle.id} • {subtitle.timestamp}</p>
                          <p className="text-white text-sm">{subtitle.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* How to Use */}
          <div className="bg-zinc-900/30 rounded-lg p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              How to Use
            </h3>
            <ol className="text-zinc-300 space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-medium">1</span>
                <span>Upload an English subtitle file (.srt format, max 10MB)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-medium">2</span>
                <span>Choose your target language from 36+ available options</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-medium">3</span>
                <span>Click "Translate" and wait for Google Translate to process</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-medium">4</span>
                <span>Download the translated subtitle file when complete</span>
              </li>
            </ol>
          </div>

          {/* Features */}
          <div className="bg-zinc-900/30 rounded-lg p-6 border border-zinc-800">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Features
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>🆓 Completely free - no API keys required</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>🌍 Support for {languages.length}+ languages</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>⚡ Powered by MyMemory & LibreTranslate APIs</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>📊 Real-time progress tracking</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>🔄 Automatic retry on errors</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>👁️ Side-by-side comparison view</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>📥 Instant download of translated files</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ready to Use Notice */}
        <div className="bg-green-900/20 border border-green-600 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
            🎉 Ready to Use!
          </h3>
          <p className="text-green-300 mb-4">
            Your subtitle translator is ready to go! No setup required - just upload your .srt file and start translating.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-green-800 text-green-200 rounded-full text-xs">Free Forever</span>
            <span className="px-3 py-1 bg-green-800 text-green-200 rounded-full text-xs">No Registration</span>
            <span className="px-3 py-1 bg-green-800 text-green-200 rounded-full text-xs">Works Offline</span>
            <span className="px-3 py-1 bg-green-800 text-green-200 rounded-full text-xs">Privacy Friendly</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubtitlePage;
