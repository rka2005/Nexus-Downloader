import React, { useState, useRef } from 'react';
import DownloaderForm from './components/DownloaderForm';

import facebookIcon from './assets/facebook.svg';
import instagramIcon from './assets/instagram.svg';
import youtubeIcon from './assets/youtube.svg';
import telegramIcon from './assets/telegram.svg';

const CONFIGURED_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');
const API_BASE_URL = CONFIGURED_API_BASE_URL || (import.meta.env.DEV ? '/api' : '');

const toUserFacingError = (status, detail) => {
  if (status === 403) {
    return 'This media is restricted by the source platform. Try another link or try again later.';
  }

  if (status === 502) {
    return 'The source platform denied this request. Please try another link.';
  }

  if (status >= 500) {
    return 'The server could not process your request right now. Please try again in a moment.';
  }

  return detail || 'Download failed.';
};

const filenameFromHeaders = (response) => {
  const header = response.headers.get('content-disposition');
  if (!header) return 'download';
  const match = header.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  return decodeURIComponent(match?.[1] || match?.[2] || 'download');
};

/* ── Download status phases ── */
const STATUS = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  DOWNLOADING: 'downloading',
  PROCESSING: 'processing',
  DONE: 'done',
  ERROR: 'error',
};

function App() {
  const [url, setUrl] = useState('');
  const [mediaType, setMediaType] = useState('video');
  const [formatChoice, setFormatChoice] = useState('mp4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Download progress state
  const [downloadStatus, setDownloadStatus] = useState(STATUS.IDLE);
  const [progress, setProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [downloadFilename, setDownloadFilename] = useState('');
  const abortRef = useRef(null);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFetchMedia = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Add a valid URL before downloading.');
      return;
    }

    if (!API_BASE_URL) {
      setError('Set VITE_API_BASE_URL to your Render backend URL before deploying to Vercel.');
      return;
    }

    // Reset
    setLoading(true);
    setError('');
    setProgress(0);
    setDownloadedBytes(0);
    setTotalBytes(0);
    setDownloadFilename('');
    setDownloadStatus(STATUS.CONNECTING);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${API_BASE_URL}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          type: mediaType,
          format: formatChoice,
        }),
        signal: controller.signal,
      });

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const payload = await response.json();
        const errorMessage = payload?.error?.message || payload?.detail || 'Download failed.';
        throw new Error(errorMessage);
      }

      if (!response.ok) {
        let detail = 'Download failed.';
        try {
          detail = await response.text();
        } catch {
          // keep default fallback
        }
        throw new Error(toUserFacingError(response.status, detail));
      }

      // Stream the response to track progress
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      setTotalBytes(total);
      setDownloadStatus(STATUS.DOWNLOADING);

      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        received += value.length;
        setDownloadedBytes(received);

        if (total > 0) {
          setProgress(Math.min(Math.round((received / total) * 100), 100));
        } else {
          // Indeterminate progress — pulse between 20-80
          setProgress((prev) => (prev >= 80 ? 20 : prev + 2));
        }
      }

      setDownloadStatus(STATUS.PROCESSING);
      setProgress(100);

      // Build the blob and trigger download
      const blob = new Blob(chunks);
      const downloadUrl = window.URL.createObjectURL(blob);
      const filename = filenameFromHeaders(response);
      setDownloadFilename(filename);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setDownloadStatus(STATUS.DONE);
    } catch (requestError) {
      if (requestError.name === 'AbortError') {
        setDownloadStatus(STATUS.IDLE);
      } else {
        setError(requestError.message || 'Unable to reach the backend.');
        setDownloadStatus(STATUS.ERROR);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  };

  /* ── Status card content helper ── */
  const getStatusDisplay = () => {
    switch (downloadStatus) {
      case STATUS.CONNECTING:
        return { icon: '🔗', label: 'Connecting', text: 'Reaching the server...', color: 'text-amber-400' };
      case STATUS.DOWNLOADING:
        return { icon: '⬇️', label: 'Downloading', text: totalBytes > 0 ? `${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}` : `${formatBytes(downloadedBytes)} downloaded`, color: 'text-accent-cyan' };
      case STATUS.PROCESSING:
        return { icon: '⚙️', label: 'Processing', text: 'Preparing your file...', color: 'text-accent-fuchsia' };
      case STATUS.DONE:
        return { icon: '✅', label: 'Complete', text: downloadFilename || 'File saved successfully!', color: 'text-accent-emerald' };
      case STATUS.ERROR:
        return { icon: '❌', label: 'Failed', text: 'Something went wrong.', color: 'text-red-400' };
      default:
        return { icon: '💡', label: 'Ready', text: 'Paste a link and hit download.', color: 'text-slate-400' };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-3 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* ── Ambient background blobs ── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[400px] w-[400px] sm:h-[600px] sm:w-[600px] rounded-full bg-accent-violet/20 blur-[100px] sm:blur-[140px] animate-glow-pulse" />
        <div className="absolute -bottom-32 -right-32 h-[350px] w-[350px] sm:h-[500px] sm:w-[500px] rounded-full bg-accent-fuchsia/20 blur-[90px] sm:blur-[120px] animate-glow-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan/10 blur-[80px] sm:blur-[100px] animate-glow-pulse [animation-delay:3s]" />
      </div>

      {/* ── Main card ── */}
      <div className="relative w-full max-w-[860px] rounded-2xl sm:rounded-3xl border border-glass-white-12 bg-glass-white-5 p-5 sm:p-8 md:p-12 backdrop-blur-2xl shadow-[0_20px_80px_-20px_rgba(124,58,237,0.25)] animate-slide-up">

        {/* Decorative top glow line */}
        <div className="absolute inset-x-0 -top-px mx-auto h-px w-3/4 bg-gradient-to-r from-transparent via-accent-violet/60 to-transparent" />

        {/* ── Header ── */}
        <header className="text-center mb-8 sm:mb-10 px-1">
          <h1 className="text-[clamp(1.65rem,9.5vw,3.75rem)] font-extrabold tracking-tight bg-gradient-to-r from-accent-violet via-accent-fuchsia to-accent-pink bg-clip-text text-transparent leading-[1.08] mb-2 sm:mb-3 drop-shadow-lg break-words [overflow-wrap:anywhere]">
            Nexus Downloader
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 font-light max-w-lg mx-auto leading-relaxed">
            Grab video &amp; audio from your favourite platforms — fast, free, and effortless.
          </p>
        </header>

        {/* ── Supported platforms ── */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 md:gap-7 mb-8 sm:mb-10 pb-5 sm:pb-6 border-b border-dashed border-glass-white-12">
          {[
            { src: youtubeIcon, alt: 'YouTube' },
            { src: instagramIcon, alt: 'Instagram' },
            { src: facebookIcon, alt: 'Facebook' },
            { src: telegramIcon, alt: 'Telegram' },
          ].map(({ src, alt }) => (
            <img
              key={alt}
              src={src}
              alt={alt}
              title={alt}
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-110 hover:drop-shadow-[0_6px_20px_rgba(217,70,239,0.45)] cursor-pointer"
            />
          ))}
          <span className="text-xs sm:text-sm text-slate-500 font-medium">&amp; more</span>
        </div>

        {/* ── Form ── */}
        <main className="mb-6 sm:mb-8">
          <DownloaderForm
            url={url}
            setUrl={setUrl}
            mediaType={mediaType}
            setMediaType={setMediaType}
            formatChoice={formatChoice}
            setFormatChoice={setFormatChoice}
            handleFetchMedia={handleFetchMedia}
            loading={loading}
            error={error}
          />

          {/* ── Download Progress Card ── */}
          {downloadStatus !== STATUS.IDLE && (
            <div className="mt-6 sm:mt-8 rounded-2xl border border-glass-white-8 bg-glass-white-5 backdrop-blur-xl overflow-hidden animate-fade-in">
              {/* Progress bar */}
              <div className="h-1 w-full bg-dark-800/50">
                <div
                  className={`h-full transition-all duration-500 ease-out rounded-r-full ${
                    downloadStatus === STATUS.ERROR
                      ? 'bg-red-500'
                      : downloadStatus === STATUS.DONE
                      ? 'bg-accent-emerald'
                      : 'bg-gradient-to-r from-accent-violet via-accent-fuchsia to-accent-pink'
                  } ${downloadStatus === STATUS.CONNECTING ? 'animate-shimmer bg-[length:200%_100%]' : ''}`}
                  style={{ width: downloadStatus === STATUS.CONNECTING ? '100%' : `${progress}%` }}
                />
              </div>

              <div className="p-4 sm:p-5">
                {/* Status row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl sm:text-2xl shrink-0">{status.icon}</span>
                    <div className="min-w-0">
                      <p className={`text-sm sm:text-base font-semibold ${status.color}`}>{status.label}</p>
                      <p className="text-xs sm:text-sm text-slate-500 truncate">{status.text}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Percentage badge */}
                    {(downloadStatus === STATUS.DOWNLOADING || downloadStatus === STATUS.DONE) && totalBytes > 0 && (
                      <span className={`text-xs sm:text-sm font-bold tabular-nums ${status.color}`}>
                        {progress}%
                      </span>
                    )}

                    {/* Cancel button */}
                    {loading && (
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Step indicators */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {[
                    { key: STATUS.CONNECTING, label: 'Connect' },
                    { key: STATUS.DOWNLOADING, label: 'Download' },
                    { key: STATUS.PROCESSING, label: 'Process' },
                    { key: STATUS.DONE, label: 'Done' },
                  ].map((step, idx) => {
                    const steps = [STATUS.CONNECTING, STATUS.DOWNLOADING, STATUS.PROCESSING, STATUS.DONE];
                    const currentIdx = steps.indexOf(downloadStatus);
                    const stepIdx = steps.indexOf(step.key);
                    const isActive = stepIdx === currentIdx;
                    const isComplete = stepIdx < currentIdx;
                    const isError = downloadStatus === STATUS.ERROR;

                    return (
                      <React.Fragment key={step.key}>
                        {idx > 0 && (
                          <div className={`flex-1 h-px ${isComplete ? 'bg-accent-emerald/50' : isError ? 'bg-red-500/30' : 'bg-glass-white-12'}`} />
                        )}
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold transition-all duration-300 ${
                              isComplete
                                ? 'bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30'
                                : isActive && !isError
                                ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/40 animate-pulse'
                                : isError && isActive
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-dark-800/50 text-slate-600 border border-glass-white-8'
                            }`}
                          >
                            {isComplete ? '✓' : idx + 1}
                          </div>
                          <span className={`text-[9px] sm:text-[10px] font-medium hidden sm:block ${isActive ? status.color : isComplete ? 'text-accent-emerald/70' : 'text-slate-600'}`}>
                            {step.label}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Status card (when idle) ── */}
          {downloadStatus === STATUS.IDLE && (
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-glass-white-8 bg-glass-white-5 backdrop-blur-xl p-4 sm:p-5 md:p-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-sm sm:text-base font-semibold text-slate-200 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
                  Backend Status
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">Paste a supported link, choose a format, and start the download.</p>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-glass-white-12 bg-dark-800/60 px-3 sm:px-4 py-2.5 sm:py-3 min-w-[120px] sm:min-w-[130px]">
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-slate-500">
                    {mediaType === 'audio' ? 'Audio' : 'Video'}
                  </span>
                  <strong className="text-xs sm:text-sm font-bold text-slate-200 tracking-wide">
                    {formatChoice.toUpperCase()}
                  </strong>
                </div>
                <div className={`ml-auto w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${mediaType === 'audio' ? 'bg-accent-cyan/15 text-accent-cyan' : 'bg-accent-violet/15 text-accent-violet'}`}>
                  {mediaType === 'audio' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Decorative bottom glow line */}
        <div className="absolute inset-x-0 -bottom-px mx-auto h-px w-1/2 bg-gradient-to-r from-transparent via-accent-fuchsia/40 to-transparent" />

        {/* ── Footer ── */}
        <footer className="mt-8 sm:mt-10 text-center">
          <p className="text-[10px] sm:text-xs text-slate-600 font-light">&copy; 2026 NexusDownloader. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;