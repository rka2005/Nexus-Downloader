import React from 'react';

/* ── SVG Icons ── */
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0M17.657 6.343a8 8 0 010 11.314M5.636 17.657a8 8 0 010-11.314" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const DownloaderForm = ({
  url,
  setUrl,
  mediaType,
  setMediaType,
  formatChoice,
  setFormatChoice,
  handleFetchMedia,
  loading,
  error,
}) => {
  const mediaFormats = {
    video: [
      { value: 'mp4', label: 'MP4' },
      { value: 'webm', label: 'WEBM' },
      { value: 'mkv', label: 'MKV' },
      { value: 'best', label: 'Best quality' },
    ],
    audio: [
      { value: 'm4a', label: 'M4A' },
      { value: 'mp3', label: 'MP3' },
      { value: 'wav', label: 'WAV' },
      { value: 'flac', label: 'FLAC' },
      { value: 'webm', label: 'WEBM' },
      { value: 'best', label: 'Best quality' },
    ],
  };

  return (
    <form onSubmit={handleFetchMedia} className="space-y-5">
      {/* ── Dropdowns row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
        {/* Media type */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-widest text-slate-500 pl-1">
            Media type
          </span>
          <div className="relative">
            <select
              id="media-type-select"
              value={mediaType}
              onChange={(e) => {
                const nextType = e.target.value;
                setMediaType(nextType);
                setFormatChoice(nextType === 'audio' ? 'm4a' : 'mp4');
              }}
              disabled={loading}
              className="w-full h-12 appearance-none rounded-xl border border-glass-white-12 bg-dark-800/80 text-slate-200 pl-4 pr-10 text-sm font-medium outline-none transition-all duration-200 focus:border-accent-violet/50 focus:ring-2 focus:ring-accent-violet/20 hover:border-glass-white-20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <option value="video">🎬 Video</option>
              <option value="audio">🎵 Audio</option>
            </select>
            {/* Custom chevron */}
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </label>

        {/* Format */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-widest text-slate-500 pl-1">
            Format
          </span>
          <div className="relative">
            <select
              id="format-select"
              value={formatChoice}
              onChange={(e) => setFormatChoice(e.target.value)}
              disabled={loading}
              className="w-full h-12 appearance-none rounded-xl border border-glass-white-12 bg-dark-800/80 text-slate-200 pl-4 pr-10 text-sm font-medium outline-none transition-all duration-200 focus:border-accent-fuchsia/50 focus:ring-2 focus:ring-accent-fuchsia/20 hover:border-glass-white-20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {mediaFormats[mediaType].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </label>
      </div>

      {/* ── URL input with glowing border ── */}
      <div className="group relative max-w-xl mx-auto">
        {/* Animated gradient border glow (behind the input) */}
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-accent-violet via-accent-fuchsia to-accent-pink opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-40 group-focus-within:opacity-60" />

        {/* Input wrapper */}
        <div className="relative flex items-center rounded-2xl border border-glass-white-12 bg-dark-900/90 backdrop-blur-md overflow-hidden transition-all duration-300 group-focus-within:border-accent-violet/40">
          {/* Search icon */}
          <div className="flex items-center justify-center pl-4 pr-1">
            <SearchIcon />
          </div>

          {/* Input */}
          <input
            id="url-input"
            type="text"
            name="url"
            placeholder="Paste your link here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="flex-1 h-14 bg-transparent text-slate-200 placeholder-slate-500 text-sm sm:text-base font-normal outline-none px-3 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Submit button */}
          <button
            id="submit-button"
            type="submit"
            disabled={loading}
            className="relative m-1.5 flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-accent-violet to-accent-fuchsia text-white shadow-lg shadow-accent-violet/25 transition-all duration-300 hover:scale-105 hover:shadow-accent-violet/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <ArrowIcon />
            )}
          </button>
        </div>
      </div>

      {/* ── Error message ── */}
      {error && (
        <div
          id="form-error"
          role="alert"
          className="flex items-start gap-3 max-w-xl mx-auto rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 animate-fade-in"
        >
          <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-red-300/90 leading-relaxed">{error}</p>
        </div>
      )}
    </form>
  );
};

export default DownloaderForm;