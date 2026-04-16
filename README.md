# NexusDownloader

NexusDownloader is a full-stack media downloader built with React, Vite, FastAPI, and `yt-dlp`. It provides a clean browser interface for pasting a supported media link, choosing audio or video output, and downloading the processed file through a Python backend.

## Overview

This project is split into two parts:

- A modern frontend that handles user input, format selection, and download progress UI.
- A FastAPI backend that receives the download request, processes the media with `yt-dlp`, and returns the file to the browser.

The app is designed to be lightweight, responsive, and easy to run locally for development.

## Purpose

The purpose of NexusDownloader is to provide a simple and fast way to:

- Download supported media from a pasted link.
- Convert or fetch audio and video in selected formats.
- Show download status and progress in the interface.
- Keep the workflow minimal for local development and testing.

## Features

| Feature | Description |
|---|---|
| Responsive UI | Works across desktop and mobile screen sizes.
| Media type selection | Lets the user choose between audio and video.
| Format selection | Supports multiple output formats depending on media type.
| Download progress | Shows download, processing, and completion states.
| Backend file response | Streams the generated file back to the browser.
| Cross-origin support | Uses CORS settings for frontend and backend communication.
| Modern interface | Built with a glassmorphism-style UI and animated feedback.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Backend | FastAPI, Uvicorn, Pydantic |
| Media processing | `yt-dlp` |
| Styling | Tailwind utility classes, custom theme tokens |
| Runtime | Node.js for frontend, Python for backend |

## Project Structure

```text
downloader/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── downloads/
│   └── ffmpeg.zip
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── components/
│   │       └── DownloaderForm.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
└── README.md
```

## Frontend Setup

### Prerequisites

- Node.js 18 or newer
- npm

### Install and run

```bash
cd frontend
npm install
npm run dev
```

The frontend will usually run at `http://localhost:5173`.

### Frontend environment variables

If your backend is deployed somewhere other than the default local URL, create a `frontend/.env` file and set:

```env
VITE_API_BASE_URL=http://localhost:8000
```

If `VITE_API_BASE_URL` is not set, the app falls back to `/api`.

## Backend Setup

### Prerequisites

- Python 3.10 or newer
- `pip`

### Install and run

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment, then install dependencies:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend will usually run at `http://localhost:8000`.

### Backend environment variables

The backend supports a frontend origin setting for CORS:

```env
FRONTEND_ORIGIN=http://localhost:5173
```

If not set, the backend uses the default local frontend origin.

## How It Works

1. The user pastes a supported media URL into the frontend.
2. The user selects media type and format.
3. The frontend sends a JSON request to the FastAPI backend.
4. The backend uses `yt-dlp` to extract and download the media.
5. The generated file is returned as a downloadable response.
6. The frontend shows progress and final status to the user.

## Useful Tips

- Keep `.env` files out of version control and use `.env.example` for shared defaults.
- Do not commit files in `backend/downloads/`; they are temporary runtime outputs.
- If downloads fail, verify that `yt-dlp` is installed correctly and the URL is supported.
- If the frontend cannot reach the backend, check `VITE_API_BASE_URL` and `FRONTEND_ORIGIN`.
- When deploying, update the CORS origin to match the final frontend domain.
- If you plan to use video conversion beyond the current default flow, make sure `ffmpeg` is available in your environment.

## Conclusion

NexusDownloader is a compact media downloader that combines a polished React interface with a FastAPI processing backend. It is a good base for local media download workflows, internal tools, and future expansion into more advanced format handling or deployment support.

## Support

For support, use one of the following:

- Open an issue in the GitHub repository.
- Use the repository discussions or pull requests for questions and improvements.
- Contact the maintainer at: your-email@example.com

Replace the email above with your real support contact before publishing.
