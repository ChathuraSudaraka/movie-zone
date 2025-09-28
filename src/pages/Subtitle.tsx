import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  Globe, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Languages
} from 'lucide-react';

// Browser-compatible translation using Google Translate API
const translateText = async (text: string, targetLang: string): Promise<string> => {
  try {
    // Using Google Translate's free API endpoint
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Extract translated text from the response
    if (result && result[0] && Array.isArray(result[0])) {
      return result[0].map((item: any[]) => item[0]).join('');
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Translation error:', error);
    
    // Fallback to MyMemory API if Google Translate fails
    try {
      const fallbackResponse = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`
      );
      
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.responseStatus === 200 && fallbackData.responseData) {
        return fallbackData.responseData.translatedText;
      }
    } catch (fallbackError) {
      console.error('Fallback translation failed:', fallbackError);
    }
    
    throw new Error('Translation failed');
  }
};

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

function SubtitlePage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [translatedSubtitles, setTranslatedSubtitles] = useState<SubtitleEntry[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationComplete, setTranslationComplete] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<TranslationProgress>({ 
    current: 0, 
    total: 0, 
    percentage: 0 
  });
  const [error, setError] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [availableLanguages, setAvailableLanguages] = useState<Array<{code: string, name: string, flag: string}>>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);

  // Load supported languages from Google Translate API
  const loadSupportedLanguages = async () => {
    setIsLoadingLanguages(true);
    try {
      // Google Translate supported languages
      const languages = [
        { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
        { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
        { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
        { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
        { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
        { code: 'eu', name: 'Basque', flag: '🏳️' },
        { code: 'be', name: 'Belarusian', flag: '🇧🇾' },
        { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
        { code: 'bs', name: 'Bosnian', flag: '🇧🇦' },
        { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
        { code: 'ca', name: 'Catalan', flag: '🇪🇸' },
        { code: 'ceb', name: 'Cebuano', flag: '🇵🇭' },
        { code: 'ny', name: 'Chichewa', flag: '🇲🇼' },
        { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
        { code: 'zh-tw', name: 'Chinese (Traditional)', flag: '🇹🇼' },
        { code: 'co', name: 'Corsican', flag: '🇫🇷' },
        { code: 'hr', name: 'Croatian', flag: '🇭�' },
        { code: 'cs', name: 'Czech', flag: '🇨🇿' },
        { code: 'da', name: 'Danish', flag: '🇩🇰' },
        { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'eo', name: 'Esperanto', flag: '🌐' },
        { code: 'et', name: 'Estonian', flag: '�🇪�' },
        { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
        { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
        { code: 'fr', name: 'French', flag: '🇫🇷' },
        { code: 'fy', name: 'Frisian', flag: '🇳🇱' },
        { code: 'gl', name: 'Galician', flag: '🇪🇸' },
        { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
        { code: 'de', name: 'German', flag: '🇩🇪' },
        { code: 'el', name: 'Greek', flag: '🇬🇷' },
        { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
        { code: 'ht', name: 'Haitian Creole', flag: '🇭🇹' },
        { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
        { code: 'haw', name: 'Hawaiian', flag: '🏝️' },
        { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
        { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
        { code: 'hmn', name: 'Hmong', flag: '🇻🇳' },
        { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
        { code: 'is', name: 'Icelandic', flag: '🇮🇸' },
        { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
        { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
        { code: 'ga', name: 'Irish', flag: '🇮🇪' },
        { code: 'it', name: 'Italian', flag: '🇮🇹' },
        { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
        { code: 'jw', name: 'Javanese', flag: '🇮🇩' },
        { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
        { code: 'kk', name: 'Kazakh', flag: '🇰🇿' },
        { code: 'km', name: 'Khmer', flag: '🇰🇭' },
        { code: 'ko', name: 'Korean', flag: '🇰🇷' },
        { code: 'ku', name: 'Kurdish', flag: '🇮🇶' },
        { code: 'ky', name: 'Kyrgyz', flag: '🇰🇬' },
        { code: 'lo', name: 'Lao', flag: '🇱🇦' },
        { code: 'la', name: 'Latin', flag: '⛪' },
        { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
        { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
        { code: 'lb', name: 'Luxembourgish', flag: '🇱🇺' },
        { code: 'mk', name: 'Macedonian', flag: '🇲🇰' },
        { code: 'mg', name: 'Malagasy', flag: '🇲🇬' },
        { code: 'ms', name: 'Malay', flag: '🇲🇾' },
        { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
        { code: 'mt', name: 'Maltese', flag: '�🇹' },
        { code: 'mi', name: 'Maori', flag: '🇳🇿' },
        { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
        { code: 'mn', name: 'Mongolian', flag: '🇲🇳' },
        { code: 'my', name: 'Myanmar (Burmese)', flag: '🇲🇲' },
        { code: 'ne', name: 'Nepali', flag: '🇳🇵' },
        { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
        { code: 'ps', name: 'Pashto', flag: '🇦🇫' },
        { code: 'fa', name: 'Persian', flag: '🇮🇷' },
        { code: 'pl', name: 'Polish', flag: '�🇱' },
        { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
        { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
        { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
        { code: 'ru', name: 'Russian', flag: '🇷🇺' },
        { code: 'sm', name: 'Samoan', flag: '🇼🇸' },
        { code: 'gd', name: 'Scots Gaelic', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
        { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
        { code: 'st', name: 'Sesotho', flag: '🇱🇸' },
        { code: 'sn', name: 'Shona', flag: '🇿🇼' },
        { code: 'sd', name: 'Sindhi', flag: '🇵🇰' },
        { code: 'si', name: 'Sinhala', flag: '🇱🇰' },
        { code: 'sk', name: 'Slovak', flag: '��' },
        { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
        { code: 'so', name: 'Somali', flag: '��' },
        { code: 'es', name: 'Spanish', flag: '🇪🇸' },
        { code: 'su', name: 'Sundanese', flag: '��' },
        { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
        { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
        { code: 'tg', name: 'Tajik', flag: '🇹🇯' },
        { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
        { code: 'te', name: 'Telugu', flag: '🇮🇳' },
        { code: 'th', name: 'Thai', flag: '��' },
        { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
        { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
        { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
        { code: 'uz', name: 'Uzbek', flag: '🇺🇿' },
        { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
        { code: 'cy', name: 'Welsh', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
        { code: 'xh', name: 'Xhosa', flag: '🇿🇦' },
        { code: 'yi', name: 'Yiddish', flag: '🕎' },
        { code: 'yo', name: 'Yoruba', flag: '��' },
        { code: 'zu', name: 'Zulu', flag: '🇿🇦' }
      ];
      
      setAvailableLanguages(languages);
    } catch (error) {
      console.error('Error loading languages:', error);
      // Fallback to basic languages if loading fails
      setAvailableLanguages([
        { code: 'es', name: 'Spanish', flag: '🇪🇸' },
        { code: 'fr', name: 'French', flag: '🇫🇷' },
        { code: 'de', name: 'German', flag: '🇩🇪' },
        { code: 'it', name: 'Italian', flag: '🇮🇹' },
        { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
        { code: 'ru', name: 'Russian', flag: '🇷🇺' },
        { code: 'zh', name: 'Chinese', flag: '�🇳' },
        { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
        { code: 'ko', name: 'Korean', flag: '🇰🇷' },
        { code: 'ar', name: 'Arabic', flag: '�🇸�' }
      ]);
    } finally {
      setIsLoadingLanguages(false);
    }
  };

  // Detect language from subtitle content
  const detectLanguage = async (text: string): Promise<string> => {
    try {
      // Use a sample of text for detection
      const sampleText = text.substring(0, 500);
      
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(sampleText)}`
      );
      
      if (!response.ok) {
        throw new Error('Language detection failed');
      }
      
      const result = await response.json();
      
      // Extract detected language from response
      if (result && result[2]) {
        const detectedLang = result[2];
        console.log('Detected language:', detectedLang);
        return detectedLang;
      }
      
      return 'auto';
    } catch (error) {
      console.error('Language detection error:', error);
      return 'auto';
    }
  };

  // Load languages on component mount
  React.useEffect(() => {
    loadSupportedLanguages();
  }, []);

  // Helper function to get language name by code
  const getLanguageName = (code: string): string => {
    const language = availableLanguages.find(lang => lang.code === code);
    return language ? `${language.flag} ${language.name}` : code;
  };

  // Parse SRT subtitle file
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

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setTranslationComplete(false);
    setTranslatedSubtitles([]);

    try {
      if (!file.name.toLowerCase().endsWith('.srt')) {
        throw new Error('Please upload a valid .srt file');
      }

      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file, 'utf-8');
      });

      const parsedSubtitles = parseSubtitleFile(content);
      
      if (parsedSubtitles.length === 0) {
        throw new Error('No valid subtitle entries found in the file');
      }
      
      setUploadedFile(file);
      setSubtitles(parsedSubtitles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process subtitle file');
      setUploadedFile(null);
      setSubtitles([]);
    }
  };

  // Handle translation
  const handleTranslate = async () => {
    if (!selectedLanguage || subtitles.length === 0) return;

    setIsTranslating(true);
    setTranslationComplete(false);
    setError('');
    setTranslationProgress({ current: 0, total: subtitles.length, percentage: 0 });

    try {
      // Auto-detect source language if not already detected
      if (!detectedLanguage || detectedLanguage === 'auto') {
        const sampleText = subtitles.slice(0, 10).map(sub => sub.text).join(' ');
        const detected = await detectLanguage(sampleText);
        setDetectedLanguage(detected);
      }

      const translated: SubtitleEntry[] = [];
      
      for (let i = 0; i < subtitles.length; i++) {
        const subtitle = subtitles[i];
        
        try {
          // Add delay to avoid rate limiting (google-translate-api is more reliable)
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay since package handles rate limiting better
          }
          
          const translatedText = await translateText(subtitle.text, selectedLanguage);
          
          translated.push({
            ...subtitle,
            text: translatedText
          });
          
        } catch (err) {
          console.error(`Translation failed for entry ${subtitle.id}:`, err);
          // Keep original text if translation fails
          translated.push(subtitle);
        }

        // Update progress
        const progress = {
          current: i + 1,
          total: subtitles.length,
          percentage: Math.round(((i + 1) / subtitles.length) * 100)
        };
        setTranslationProgress(progress);
      }
      
      setTranslatedSubtitles(translated);
      setTranslationComplete(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  // Download translated subtitles
  const downloadTranslatedFile = () => {
    if (translatedSubtitles.length === 0) return;

    const content = translatedSubtitles
      .map(entry => `${entry.id}\n${entry.timestamp}\n${entry.text}\n`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${uploadedFile?.name.replace('.srt', '')}_translated_${selectedLanguage}.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-[68px] min-h-screen bg-[#141414] text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-6">
            <Languages className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Subtitle Translator</h1>
          <p className="text-xl text-zinc-400">
            Translate your SRT subtitle files using Google Translate API
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Upload className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-semibold">Upload Subtitle File</h2>
          </div>

          <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center">
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
              <FileText className="w-12 h-12 text-zinc-500" />
              <div>
                <p className="text-lg font-medium mb-2">
                  Click to upload your .srt file
                </p>
                <p className="text-sm text-zinc-500">
                  Maximum file size: 10MB
                </p>
              </div>
            </label>
          </div>

          {uploadedFile && (
            <div className="mt-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-400">File uploaded successfully!</p>
                  <p className="text-sm text-zinc-400">
                    {uploadedFile.name} • {subtitles.length} subtitle entries
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Language Selection */}
        {subtitles.length > 0 && (
          <>
            {/* Language Detection Display */}
            {detectedLanguage && detectedLanguage !== 'auto' && (
              <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <h3 className="text-lg font-medium text-blue-300">Language Detected</h3>
                </div>
                <p className="text-blue-100">
                  Source language detected as: <strong>{getLanguageName(detectedLanguage)}</strong>
                </p>
              </div>
            )}

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-semibold">Select Target Language</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {isLoadingLanguages ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                  <span className="ml-2 text-zinc-400">Loading languages...</span>
                </div>
              ) : (
                availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`p-4 rounded-lg border transition-all duration-200 ${ 
                      selectedLanguage === lang.code
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-red-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">{lang.flag}</div>
                    <div className="text-sm font-medium">{lang.name}</div>
                  </button>
                ))
              )}
            </div>

            {selectedLanguage && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="px-8 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isTranslating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Translating... {translationProgress.percentage}%
                    </div>
                  ) : (
                    'Start Translation'
                  )}
                </button>
              </div>
            )}
          </div>
          </>
        )}

        {/* Translation Progress */}
        {isTranslating && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 mb-8">
            <h3 className="text-xl font-semibold mb-4">Translation Progress</h3>
            <div className="w-full bg-zinc-800 rounded-full h-3 mb-4">
              <div 
                className="bg-red-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${translationProgress.percentage}%` }}
              />
            </div>
            <p className="text-center text-zinc-400">
              {translationProgress.current} / {translationProgress.total} entries translated
            </p>
          </div>
        )}

        {/* Download Section */}
        {translationComplete && translatedSubtitles.length > 0 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Download className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-semibold text-green-400">Translation Complete!</h2>
            </div>

            <div className="text-center">
              <p className="text-zinc-400 mb-6">
                Successfully translated {translatedSubtitles.length} subtitle entries
              </p>
              
              <button
                onClick={downloadTranslatedFile}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Download Translated File
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">How it works:</h3>
          <ol className="space-y-2 text-zinc-400">
            <li>1. Upload your .srt subtitle file</li>
            <li>2. Select the target language for translation</li>
            <li>3. Click "Start Translation" and wait for completion</li>
            <li>4. Download your translated subtitle file</li>
          </ol>
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>Note:</strong> This uses the google-translate-api npm package which provides reliable access to Google's translation service.
              Translation quality may vary depending on the source and target languages.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SubtitlePage;
