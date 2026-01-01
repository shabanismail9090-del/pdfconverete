import React, { useState, useRef } from 'react';
import { AppStatus, ProcessingStep } from './types';
import { extractTextFromPDF } from './services/pdfService';
import { formatTextWithGemini } from './services/geminiService';
import { createAndDownloadDocx } from './services/wordService';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Loader2, 
  FileType, 
  Sparkles, 
  Download,
  AlertCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [formattedText, setFormattedText] = useState<string>('');
  const [extractedRawText, setExtractedRawText] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setErrorMsg('يرجى تحميل ملف PDF فقط');
        return;
      }
      setFile(selectedFile);
      setErrorMsg('');
      setStatus(AppStatus.IDLE);
    }
  };

  const startConversion = async () => {
    if (!file) return;

    try {
      // Step 1: Extract Text
      setStatus(AppStatus.READING_PDF);
      const extractionResult = await extractTextFromPDF(file);
      setExtractedRawText(extractionResult.rawText);

      // Step 2: AI Processing
      setStatus(AppStatus.AI_PROCESSING);
      const formatted = await formatTextWithGemini(extractionResult.rawText);
      setFormattedText(formatted);

      // Step 3: Complete
      setStatus(AppStatus.COMPLETED);

    } catch (error: any) {
      console.error(error);
      setStatus(AppStatus.ERROR);
      setErrorMsg(error.message || 'حدث خطأ غير متوقع أثناء المعالجة');
    }
  };

  const handleDownload = async () => {
    if (!formattedText || !file) return;
    try {
      setStatus(AppStatus.GENERATING_WORD);
      await createAndDownloadDocx(formattedText, file.name);
      setStatus(AppStatus.COMPLETED);
    } catch (e) {
      console.error(e);
      setErrorMsg('فشل في إنشاء ملف Word');
      setStatus(AppStatus.ERROR);
    }
  };

  // Helper to trigger file input
  const triggerFileInput = () => fileInputRef.current?.click();

  const renderStatusStep = (stepStatus: AppStatus, currentStep: AppStatus, label: string, icon: React.ReactNode) => {
    let isActive = false;
    let isCompleted = false;

    const stepsOrder = [
      AppStatus.READING_PDF,
      AppStatus.AI_PROCESSING,
      AppStatus.COMPLETED
    ];

    const currentIndex = stepsOrder.indexOf(currentStep);
    const stepIndex = stepsOrder.indexOf(stepStatus);

    if (currentStep === AppStatus.ERROR) {
       // simple logic for error state
       isActive = false;
       isCompleted = false;
    } else {
        if (currentStep === stepStatus) isActive = true;
        if (currentIndex > stepIndex) isCompleted = true;
        if (currentStep === AppStatus.COMPLETED) isCompleted = true; // All completed
    }
    
    // Correction for the UI state logic to be simpler
    const stateColor = isCompleted ? 'text-green-400' : isActive ? 'text-blue-400' : 'text-gray-500';
    const borderColor = isCompleted ? 'border-green-400' : isActive ? 'border-blue-400' : 'border-gray-700';
    const bgColor = isCompleted ? 'bg-green-400/10' : isActive ? 'bg-blue-400/10' : 'bg-gray-800/50';

    return (
      <div className={`flex flex-col items-center p-4 rounded-xl border ${borderColor} ${bgColor} transition-all duration-300 w-full sm:w-1/3`}>
        <div className={`mb-3 ${stateColor}`}>
          {isCompleted ? <CheckCircle className="w-8 h-8" /> : isActive ? <Loader2 className="w-8 h-8 animate-spin" /> : icon}
        </div>
        <span className={`text-sm font-semibold ${stateColor}`}>{label}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-950 via-gray-900 to-slate-900 flex flex-col items-center justify-center p-4 md:p-8">
      
      {/* Header */}
      <header className="mb-10 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-600/20 mb-4 border border-blue-500/30 shadow-lg shadow-blue-500/20">
          <Sparkles className="w-6 h-6 text-blue-400 ml-2" />
          <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-blue-200 to-white">
            محول PDF الذكي
          </h1>
        </div>
        <p className="text-gray-400 max-w-xl mx-auto text-lg">
          حوّل ملفات الـ PDF (المدعومة بـ OCR) إلى مستندات Word احترافية مع إعادة تنسيق ذكية باستخدام Gemini AI.
        </p>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-4xl bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 md:p-10 relative">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -z-10 -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -z-10 -ml-20 -mb-20 pointer-events-none"></div>

        {/* Upload Section */}
        {status === AppStatus.IDLE && !file && (
          <div 
            onClick={triggerFileInput}
            className="border-2 border-dashed border-gray-600 hover:border-blue-400 hover:bg-gray-800/50 transition-all cursor-pointer rounded-2xl h-64 flex flex-col items-center justify-center group"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="application/pdf" 
              className="hidden" 
            />
            <div className="p-4 rounded-full bg-gray-800 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300 mb-4 shadow-lg">
              <Upload className="w-10 h-10 text-gray-300 group-hover:text-white" />
            </div>
            <p className="text-xl font-medium text-gray-300 group-hover:text-white transition-colors">اضغط لرفع ملف PDF</p>
            <p className="text-sm text-gray-500 mt-2">أو قم بسحب الملف وإفلاته هنا</p>
          </div>
        )}

        {/* File Selected / Processing UI */}
        {file && (
          <div className="space-y-8">
            
            {/* File Info Card */}
            <div className="flex items-center justify-between bg-gray-800/60 p-4 rounded-xl border border-gray-700">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <FileType className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white truncate max-w-[200px] md:max-w-md">{file.name}</h3>
                  <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              {status === AppStatus.IDLE && (
                <button 
                  onClick={() => { setFile(null); setFormattedText(''); setExtractedRawText(''); }}
                  className="text-gray-400 hover:text-red-400 text-sm transition-colors"
                >
                  حذف
                </button>
              )}
            </div>

            {/* Processing Steps Visualizer */}
            {status !== AppStatus.IDLE && status !== AppStatus.ERROR && (
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                {renderStatusStep(AppStatus.READING_PDF, status, 'استخراج النصوص', <FileText className="w-6 h-6" />)}
                {renderStatusStep(AppStatus.AI_PROCESSING, status, 'تنسيق ذكي (AI)', <Sparkles className="w-6 h-6" />)}
                {renderStatusStep(AppStatus.COMPLETED, status, 'جاهز للتحميل', <CheckCircle className="w-6 h-6" />)}
              </div>
            )}

            {/* Error Message */}
            {status === AppStatus.ERROR && (
               <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl flex items-center space-x-3 space-x-reverse">
                 <AlertCircle className="w-6 h-6 text-red-500" />
                 <span>{errorMsg}</span>
                 <button onClick={() => setStatus(AppStatus.IDLE)} className="mr-auto underline text-sm hover:text-white">حاول مرة أخرى</button>
               </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center mt-6">
              {status === AppStatus.IDLE && (
                <button 
                  onClick={startConversion}
                  className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform transition hover:-translate-y-1 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>بدء التحويل الذكي</span>
                </button>
              )}

              {status === AppStatus.COMPLETED && (
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <button 
                      onClick={handleDownload}
                      className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transform transition hover:-translate-y-1 hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      <span>تحميل ملف Word</span>
                    </button>
                     <button 
                      onClick={() => {
                          setFile(null);
                          setStatus(AppStatus.IDLE);
                          setFormattedText('');
                          setExtractedRawText('');
                      }}
                      className="w-full md:w-auto px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <span>تحويل ملف آخر</span>
                    </button>
                </div>
              )}
            </div>

            {/* Preview Section (Optional - only if completed) */}
            {status === AppStatus.COMPLETED && (
              <div className="mt-8 grid md:grid-cols-2 gap-6 h-96">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 overflow-hidden flex flex-col">
                  <h4 className="text-gray-400 mb-2 text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" /> النص الأصلي (المستخرج)
                  </h4>
                  <div className="flex-1 overflow-y-auto text-xs text-gray-300 font-mono bg-black/30 p-2 rounded whitespace-pre-wrap leading-relaxed">
                    {extractedRawText.slice(0, 1000)}...
                  </div>
                </div>
                <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30 overflow-hidden flex flex-col">
                   <h4 className="text-blue-300 mb-2 text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> معاينة بعد التنسيق
                  </h4>
                  <div className="flex-1 overflow-y-auto text-sm text-gray-200 bg-white/5 p-4 rounded whitespace-pre-wrap leading-relaxed shadow-inner">
                    {formattedText}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-12 text-gray-500 text-sm">
        <p>يعمل بواسطة Google Gemini 2.5 Flash & React</p>
      </footer>

    </div>
  );
}

export default App;