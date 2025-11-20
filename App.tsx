import React, { useState, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { INITIAL_STATE } from './constants';
import { CoverLetterState, GeneratedResult } from './types';
import { generateCoverLetter } from './services/openaiService';
import InputPanel from './components/InputPanel';
import PreviewPanel from './components/PreviewPanel';

const App: React.FC = () => {
  const [formData, setFormData] = useState<CoverLetterState>(INITIAL_STATE);
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleInputChange = useCallback((field: keyof CoverLetterState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await generateCoverLetter(formData);
      setGeneratedResult(result);
      setLastUpdated(new Date());
    } catch (error) {
      alert("Error generating letter. Please check your API key and try again.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [formData]);

  const handleContentChange = useCallback((newText: string) => {
    // We only update the text part of the result when user manually edits
    setGeneratedResult(prev => prev ? { ...prev, text: newText } : null);
  }, []);

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