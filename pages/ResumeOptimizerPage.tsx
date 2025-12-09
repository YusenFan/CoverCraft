import React, { useState, useCallback } from 'react';
import { ResumeOptimizerState, ResumeAnalysisResult } from '../types';
import { analyzeResume } from '../services/openaiService';
import OptimizerInputPanel from '../components/OptimizerInputPanel';
import OptimizerPreviewPanel from '../components/OptimizerPreviewPanel';

const INITIAL_OPTIMIZER_STATE: ResumeOptimizerState = {
  jobLink: '',
  jobDescription: '',
  resumeText: '',
  resumeData: undefined,
  resumeMimeType: undefined,
};

const ResumeOptimizerPage: React.FC = () => {
  const [formData, setFormData] = useState<ResumeOptimizerState>(INITIAL_OPTIMIZER_STATE);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleInputChange = useCallback((field: keyof ResumeOptimizerState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeResume(formData);
      setAnalysisResult(result);
      setLastUpdated(new Date());
    } catch (error) {
      alert("Error analyzing resume. Please check your API key and try again.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [formData]);

  const handleReset = useCallback(() => {
    setAnalysisResult(null);
    setLastUpdated(null);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-white">
      {/* Left Panel: Inputs */}
      <div className="w-full md:w-[400px] lg:w-[450px] h-1/2 md:h-full flex-shrink-0 z-20 shadow-xl border-r border-slate-200">
        <OptimizerInputPanel 
          state={formData} 
          onChange={handleInputChange} 
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
        />
      </div>

      {/* Right Panel: Results Preview */}
      <div className="flex-1 h-1/2 md:h-full overflow-hidden relative">
        <OptimizerPreviewPanel 
          result={analysisResult} 
          isAnalyzing={isAnalyzing} 
          lastUpdated={lastUpdated}
          onReset={handleReset}
        />
      </div>
      
      {/* Mobile Overlay for Print Warning */}
      <div className="md:hidden fixed bottom-4 right-4 bg-black/75 text-white text-xs px-3 py-1 rounded-full pointer-events-none z-50 no-print">
        Desktop recommended for best experience
      </div>
    </div>
  );
};

export default ResumeOptimizerPage;
