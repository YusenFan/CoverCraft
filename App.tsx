import React, { useState, useCallback, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { INITIAL_STATE } from './constants';
import { CoverLetterState, GeneratedResult } from './types';
import { generateCoverLetter } from './services/openaiService';
import { storageService } from './services/storageService';
import InputPanel from './components/InputPanel';
import PreviewPanel from './components/PreviewPanel';
import PopupApp from './components/PopupApp';

const App: React.FC = () => {
  const [formData, setFormData] = useState<CoverLetterState>(INITIAL_STATE);
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isExtension, setIsExtension] = useState(false);

  // Detect if running as Chrome extension
  useEffect(() => {
    const checkExtension = typeof chrome !== 'undefined' && chrome.runtime !== undefined && !!chrome.runtime.id;
    setIsExtension(checkExtension);
  }, []);

  // Load saved data on mount (for web version)
  useEffect(() => {
    if (isExtension) return; // Skip for extension, PopupApp handles its own state

    const loadSavedData = async () => {
      try {
        const prefs = await storageService.loadPreferences();
        const draft = await storageService.loadDraft();

        setFormData(prev => ({
          ...prev,
          language: prefs.language || prev.language,
          tone: prefs.tone || prev.tone,
          length: prefs.length || prev.length,
          jobDescription: draft.draftJobDescription || prev.jobDescription,
          companyName: draft.draftCompanyName || prev.companyName,
          jobTitle: draft.draftJobTitle || prev.jobTitle,
          jobLink: draft.draftJobLink || prev.jobLink,
          additionalInstructions: draft.draftAdditionalInstructions || prev.additionalInstructions,
        }));
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    };

    loadSavedData();
  }, [isExtension]);

  // Auto-save draft when formData changes (for web version)
  useEffect(() => {
    if (isExtension) return;

    const saveTimer = setTimeout(async () => {
      try {
        await storageService.saveDraft(formData);
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [formData, isExtension]);

  const handleInputChange = useCallback((field: keyof CoverLetterState, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      if (field === 'language' || field === 'tone' || field === 'length') {
        storageService.savePreferences({
          language: field === 'language' ? value : prev.language,
          tone: field === 'tone' ? value : prev.tone,
          length: field === 'length' ? value : prev.length,
        });
      }

      return updated;
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await generateCoverLetter(formData);
      setGeneratedResult(result);
      setLastUpdated(new Date());

      if (result.text) {
        await storageService.addToHistory({
          companyName: formData.companyName,
          jobTitle: formData.jobTitle,
          content: result.text,
        });
      }
    } catch (error) {
      alert("Error generating letter. Please check your API key and try again.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [formData]);

  const handleContentChange = useCallback((newText: string) => {
    setGeneratedResult(prev => prev ? { ...prev, text: newText } : null);
  }, []);

  // Use popup UI for Chrome extension
  if (isExtension) {
    return <PopupApp />;
  }

  // Web version: Full two-column layout
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-white">
      {/* Left Panel: Inputs */}
      <div className="w-full md:w-[400px] lg:w-[450px] h-1/2 md:h-full flex-shrink-0 z-20 shadow-xl border-r border-slate-200">
        <InputPanel
          state={formData}
          onChange={handleInputChange}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      </div>

      {/* Right Panel: Preview & Edit */}
      <div className="flex-1 h-1/2 md:h-full overflow-hidden relative">
         <PreviewPanel
            result={generatedResult}
            isGenerating={isGenerating}
            lastUpdated={lastUpdated}
            onContentChange={handleContentChange}
         />
      </div>

      {/* Mobile Overlay for Print Warning */}
      <div className="md:hidden fixed bottom-4 right-4 bg-black/75 text-white text-xs px-3 py-1 rounded-full pointer-events-none z-50 no-print">
         Desktop recommended for printing
      </div>

      <Analytics />
    </div>
  );
};

export default App;