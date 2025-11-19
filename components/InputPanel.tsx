import React, { useState } from 'react';
import { CoverLetterState, Tone, Length, Language } from '../types';
// @ts-ignore
import * as mammoth from 'mammoth';

interface InputPanelProps {
  state: CoverLetterState;
  onChange: (field: keyof CoverLetterState, value: any) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({ state, onChange, onGenerate, isGenerating }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [jobTab, setJobTab] = useState<'manual' | 'link'>('link');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessingFile(true);

    try {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          // Extract base64 part
          const base64 = result.split(',')[1];
          onChange('resumeData', base64);
          onChange('resumeMimeType', 'application/pdf');
          onChange('resumeText', ''); // Clear text so PDF is used
          setIsProcessingFile(false);
        };
        reader.readAsDataURL(file);
      } 
      else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Use mammoth for docx
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
        // Text or MD
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

  const handleTextChange = (val: string) => {
    onChange('resumeText', val);
    if (val.length > 0 && state.resumeData) {
      onChange('resumeData', undefined);
      onChange('resumeMimeType', undefined);
      setFileName(null);
    }
  };

  // Validation: Resume is required. Either Company Name OR Job Link is required.
  const hasResume = state.resumeText || state.resumeData;
  const hasJobTarget = (jobTab === 'manual' && state.companyName) || (jobTab === 'link' && state.jobLink);
  const canGenerate = hasResume && hasJobTarget && !isGenerating && !isProcessingFile;

  return (
    <div className="h-full flex flex-col overflow-y-auto p-6 bg-white border-r border-slate-200 no-print">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black flex items-center gap-2">
          <span className="bg-black text-white p-1.5 rounded-lg text-lg">CC</span>
          CoverCraft
        </h1>
        <p className="text-sm text-slate-600 mt-1">AI-powered tailored letters</p>
      </div>

      <div className="space-y-8 flex-1">
        {/* Personal Info */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Who are you?</h2>
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">Your Full Name</label>
            <input
              type="text"
              value={state.fullName}
              onChange={(e) => onChange('fullName', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white text-black"
              placeholder="Jane Doe (Or leave blank to extract from Resume)"
            />
          </div>
        </div>

        {/* Job Target - Tabs */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Job</h2>
              <div className="flex bg-slate-100 rounded p-0.5">
                  <button 
                    onClick={() => setJobTab('link')}
                    className={`px-3 py-1 text-xs font-bold rounded transition-all ${jobTab === 'link' ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-black'}`}
                  >
                    Link
                  </button>
                  <button 
                    onClick={() => setJobTab('manual')}
                    className={`px-3 py-1 text-xs font-bold rounded transition-all ${jobTab === 'manual' ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-black'}`}
                  >
                    Manual
                  </button>
              </div>
           </div>
           
           {jobTab === 'manual' ? (
             <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Target Company</label>
                  <input
                    type="text"
                    value={state.companyName}
                    onChange={(e) => onChange('companyName', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white text-black"
                    placeholder="Google, Acme Corp..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Target Position</label>
                  <input
                    type="text"
                    value={state.jobTitle}
                    onChange={(e) => onChange('jobTitle', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white text-black"
                    placeholder="Senior Product Manager"
                  />
                </div>
             </div>
           ) : (
             <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">Job Posting Link (Recommended)</label>
                  <input
                    type="url"
                    value={state.jobLink || ''}
                    onChange={(e) => onChange('jobLink', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white text-black"
                    placeholder="https://linkedin.com/jobs/..."
                  />
                  <p className="text-xs text-slate-500 mt-1">We'll read the job details and company info from this link automatically.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
                        <input
                            type="text"
                            value={state.companyName}
                            onChange={(e) => onChange('companyName', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-black outline-none bg-white text-black placeholder-slate-400"
                            placeholder="Auto-extract"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Position</label>
                        <input
                            type="text"
                            value={state.jobTitle}
                            onChange={(e) => onChange('jobTitle', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-black outline-none bg-white text-black placeholder-slate-400"
                            placeholder="Auto-extract"
                        />
                    </div>
                </div>
             </div>
           )}
        </div>

        {/* Resume Input */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resume Content</h2>
          <div className="flex flex-col gap-2 mb-2">
             <label className={`cursor-pointer px-4 py-3 border border-dashed border-slate-400 hover:border-black hover:bg-slate-50 text-black text-sm rounded-lg font-medium transition-all text-center flex flex-col items-center gap-1 ${isProcessingFile ? 'opacity-50' : ''}`}>
               <span className="text-slate-600">{isProcessingFile ? 'Processing...' : fileName ? `File: ${fileName}` : 'Click to Upload Resume'}</span>
               <span className="text-[10px] text-slate-400 font-normal uppercase">PDF, DOCX, TXT</span>
               <input type="file" accept=".pdf,.docx,.doc,.txt,.md" onChange={handleFileChange} className="hidden" disabled={isProcessingFile} />
             </label>
             {fileName && state.resumeData && (
               <p className="text-xs text-green-600 font-semibold text-center">✓ PDF Ready for Analysis</p>
             )}
          </div>
          <div className="relative">
            <textarea
              value={state.resumeText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full h-32 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent outline-none text-xs font-mono leading-relaxed resize-none bg-white text-black placeholder-slate-400"
              placeholder={state.resumeData ? "PDF loaded. You can also type here to override." : "Or paste your resume text here..."}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
           <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adjustments</h2>
           <div className="grid grid-cols-1 gap-4">
             <div>
               <label className="block text-xs font-bold text-slate-700 mb-1">Tone</label>
               <select 
                value={state.tone} 
                onChange={(e) => onChange('tone', e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-sm text-black focus:ring-2 focus:ring-black outline-none"
              >
                 {Object.values(Tone).map(t => <option key={t} value={t}>{t}</option>)}
               </select>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Length</label>
                <select 
                    value={state.length} 
                    onChange={(e) => onChange('length', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded text-sm text-black focus:ring-2 focus:ring-black outline-none"
                >
                    {Object.values(Length).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                </div>
                <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Language</label>
                <select 
                    value={state.language} 
                    onChange={(e) => onChange('language', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded text-sm text-black focus:ring-2 focus:ring-black outline-none"
                >
                    {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                </div>
             </div>
           </div>
           <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Custom Instructions</label>
              <textarea
                value={state.additionalInstructions}
                onChange={(e) => onChange('additionalInstructions', e.target.value)}
                className="w-full h-20 p-2 border border-slate-300 rounded-md text-sm outline-none resize-none bg-white text-black focus:ring-2 focus:ring-black"
                placeholder="e.g., Emphasize my leadership skills..."
              />
           </div>
        </div>
      </div>

      <div className="pt-6 mt-4 border-t border-slate-200">
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition-all shadow-lg 
            ${!canGenerate 
              ? 'bg-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-black hover:bg-slate-800 shadow-slate-500/30 active:scale-[0.98]'}
          `}
        >
          {isGenerating ? (
             <>
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Crafting Letter...
             </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Generate Cover Letter
            </>
          )}
        </button>
        {!canGenerate && (
          <p className="text-center text-xs text-red-600 mt-2 font-medium">Resume and Company/Link required.</p>
        )}
      </div>
    </div>
  );
};

export default InputPanel;