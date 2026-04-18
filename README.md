# Nexus Downloader

```text
                ┌──────────────────────────────────────────────────────────────┐
                │                                                              │
                │        ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗           │
                │        ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝           │
                │        ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗           │
                │        ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║           │
                │        ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║           │
                │        ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝           │
                │                                                              │
                │     Full-Stack Media Downloader with React + FastAPI         │
                │                                                              │
                └──────────────────────────────────────────────────────────────┘
```

NexusDownloader is a full-stack media downloader that lets you paste a supported link, choose audio or video output, and download the processed file through a polished browser interface. The frontend is built with React and Vite, while the backend uses FastAPI and `yt-dlp` to fetch and serve the media.

## Overview

This project is built as a clean two-part application:

- The **frontend** handles the user interface, form state, responsive layout, and download progress display.
- The **backend** accepts download requests, processes the media with `yt-dlp`, and returns the generated file to the browser.

The result is a lightweight and responsive local downloader that is easy to run, easy to extend, and visually polished.

## Purpose

The goal of NexusDownloader is to provide a simple workflow for:

- Downloading supported media from a pasted URL.
- Switching between video and audio output.
- Choosing a format before the download starts.
- Showing live download and processing status.
- Keeping the setup minimal for local development.

## Features

| Feature | What it does |
|---|---|
| Responsive design | Adapts to mobile, tablet, and desktop screens.
| Media type selector | Lets the user switch between audio and video.
| Format selector | Provides output format choices based on the selected media type.
| Progress states | Shows connecting, downloading, processing, done, and error states.
| File response handling | Streams the finished file back to the browser as a download.
| CORS support | Allows the frontend and backend to communicate locally or in deployment.
| Modern UI | Uses a glass-style card layout, gradient accents, and subtle motion.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Backend | FastAPI, Uvicorn, Pydantic |
| Media engine | `yt-dlp` |
| Runtime | Node.js for the frontend, Python for the backend |
| Styling | Tailwind utility classes and custom theme tokens |

## Project Structure

```text
downloader/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── downloads/
│   └── ffmpeg.zip
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── components/
│   │       └── DownloaderForm.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
└── README.md
```

## Frontend Setup

### Requirements

- Node.js 18 or newer
- npm

### Install dependencies

```bash
cd frontend
npm install
```

### Run the frontend

```bash
npm run dev
```

The frontend will usually be available at `http://localhost:5173`.

### Optional frontend environment variable

If your backend is running on a different URL, create a `frontend/.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000
```

If this variable is not set, the app falls back to `/api`.

## Backend Setup

### Requirements

- Python 3.10 or newer
- `pip`

### Create a virtual environment

```bash
cd backend
python -m venv .venv
```

Activate the environment, then install the dependencies:

```bash
pip install -r requirements.txt
```

### Run the backend

```bash
uvicorn main:app --reload
```

The backend will usually run at `http://localhost:8000`.

### Optional backend environment variable

The backend supports a frontend origin for CORS:

```env
FRONTEND_ORIGIN=http://localhost:5173
```

## How It Works

1. Paste a supported media link into the form.
2. Choose whether you want audio or video.
3. Select the format you want to download.
4. The frontend sends a request to the FastAPI backend.
5. `yt-dlp` processes the media and prepares the output file.
6. The backend returns the file and the browser starts the download.

## Useful Tips

- Keep `.env` files private and commit only `.env.example` files with safe placeholder values.
- Do not commit `backend/downloads/` contents because they are generated at runtime.
- If the frontend cannot reach the backend, confirm `VITE_API_BASE_URL` and `FRONTEND_ORIGIN` match your local ports.
- If downloads fail, verify that the pasted URL is supported by `yt-dlp`.
- If you want broader format conversion support, make sure `ffmpeg` is installed and available in your environment.
- Before publishing, review `.gitignore` so temporary files, logs, and caches stay out of GitHub.

## Conclusion

NexusDownloader combines a polished React interface with a FastAPI media-processing backend to create a practical downloader for local use and future expansion. It is simple to run, easy to style, and ready for further features such as authentication, deployment, or expanded media handling.

## Support

For help, feedback, or contributions:

- Open a GitHub issue in the repository.
- Use pull requests for improvements and fixes.
- Contact the maintainer at: rohitkr.adak0@gmail.com

Replace the email above with your real support contact before publishing the repository.
