import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResumeOptimizerState } from '../types';
// @ts-ignore
import * as mammoth from 'mammoth';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

interface OptimizerInputPanelProps {
  state: ResumeOptimizerState;
  onChange: (field: keyof ResumeOptimizerState, value: any) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const OptimizerInputPanel: React.FC<OptimizerInputPanelProps> = ({ 
  state, 
  onChange, 
  onAnalyze, 
  isAnalyzing 
}) => {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [jdInputMode, setJdInputMode] = useState<'link' | 'manual'>('link');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessingFile(true);

    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';
          }

          onChange('resumeText', fullText.trim());
          onChange('resumeData', undefined);
          onChange('resumeMimeType', undefined);
        } catch (err) {
          console.error("PDF parse error", err);
          alert("Could not parse PDF file. Please try copying and pasting the text instead.");
          setFileName(null);
        }
        setIsProcessingFile(false);
      } 
      else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          onChange('resumeText', result.value);
          onChange('resumeData', undefined);
          onChange('resumeMimeType', undefined);
        } catch (err) {
          console.error("DOCX parse error", err);
          alert("Could not parse DOCX file. Please copy paste text.");
          setFileName(null);
        }
        setIsProcessingFile(false);
      }
      else if (file.name.endsWith('.doc')) {
        alert(".doc files are not supported directly. Please save as .docx or .pdf, or copy-paste text.");
        setFileName(null);
        setIsProcessingFile(false);
      }
      else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            onChange('resumeText', event.target.result as string);
            onChange('resumeData', undefined);
            onChange('resumeMimeType', undefined);
          }
          setIsProcessingFile(false);
        };
        reader.readAsText(file);
      }
    } catch (e) {
      console.error(e);
      setIsProcessingFile(false);
    }
  };

  const hasResume = !!state.resumeText;
  const hasJobInfo = !!state.jobLink || !!state.jobDescription;
  const canAnalyze = hasResume && hasJobInfo && !isAnalyzing && !isProcessingFile;

  return (
    <div className="h-full flex flex-col overflow-y-auto p-6 bg-white border-r border-slate-200 no-print">
      {/* Header with branding */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black flex items-center gap-2">
          <span className="bg-emerald-600 text-white p-1.5 rounded-lg text-lg">RO</span>
          Resume Optimizer
        </h1>
        <p className="text-sm text-slate-600 mt-1">Improve your chances of getting the job</p>
        
        {/* Back to CoverCraft Button */}
        <button
          onClick={() => navigate('/')}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-sm font-semibold transition-all group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to CoverCraft</span>
        </button>
      </div>

      <div className="space-y-6 flex-1">
        {/* Job Description Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Job</h2>
            <div className="flex bg-slate-100 rounded p-0.5">
              <button 
                onClick={() => setJdInputMode('link')}
                className={`px-3 py-1 text-xs font-bold rounded transition-all ${jdInputMode === 'link' ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-black'}`}
              >
                Link
              </button>
              <button 
                onClick={() => setJdInputMode('manual')}
                className={`px-3 py-1 text-xs font-bold rounded transition-all ${jdInputMode === 'manual' ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-black'}`}
              >
                Paste JD
              </button>
            </div>
          </div>
          
          {/* Fixed height container to prevent layout shift */}
          <div className="min-h-[140px]">
            {jdInputMode === 'link' ? (
              <div className="space-y-2">
                <input
                  type="url"
                  value={state.jobLink}
                  onChange={(e) => onChange('jobLink', e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white text-black transition-all"
                  placeholder="https://linkedin.com/jobs/... or any job posting URL"
                />
                <p className="text-xs text-slate-500">Paste the job posting URL and we'll analyze the requirements</p>
              </div>
            ) : (
              <div>
                <textarea
                  value={state.jobDescription || ''}
                  onChange={(e) => onChange('jobDescription', e.target.value)}
                  className="w-full h-[120px] p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none bg-white text-black transition-all"
                  placeholder="Paste the full job description here..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Resume Upload */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Resume</h2>
          <label className={`cursor-pointer block px-4 py-5 border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-xl font-medium transition-all text-center ${isProcessingFile ? 'opacity-50' : ''}`}>
            <div className="flex flex-col items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-slate-700 text-sm">{isProcessingFile ? 'Processing...' : fileName ? `✓ ${fileName}` : 'Click to upload your resume'}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">PDF, DOCX, TXT supported</span>
            </div>
            <input type="file" accept=".pdf,.docx,.doc,.txt,.md" onChange={handleFileChange} className="hidden" disabled={isProcessingFile} />
          </label>
          
          {fileName && state.resumeText && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Resume loaded successfully
            </div>
          )}

          {/* Preview toggle for resume text */}
          {state.resumeText && (
            <details className="mt-2">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 font-medium">Preview resume text</summary>
              <div className="mt-2 p-3 bg-slate-50 rounded-lg max-h-32 overflow-y-auto text-xs text-slate-600 whitespace-pre-wrap border border-slate-200">
                {state.resumeText.slice(0, 800)}
                {state.resumeText.length > 800 && '...'}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-6 mt-4 border-t border-slate-200">
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition-all shadow-lg 
            ${!canAnalyze 
              ? 'bg-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30 active:scale-[0.98]'}
          `}
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Resume...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Crack Resume
            </>
          )}
        </button>
        {!canAnalyze && !isAnalyzing && (
          <p className="text-center text-xs text-slate-500 mt-2 font-medium">
            {!hasResume && !hasJobInfo ? 'Upload resume and provide job info' :
             !hasResume ? 'Please upload your resume' :
             'Please provide a job link or description'}
          </p>
        )}
      </div>
    </div>
  );
};

export default OptimizerInputPanel;
