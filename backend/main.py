from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import yt_dlp
import os
import uuid
import imageio_ffmpeg

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

DOWNLOAD_FOLDER = "downloads"
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)


class DownloadRequest(BaseModel):
    url: str
    type: str   # "audio" or "video"
    format: str = "mp4"


def download_media(url, media_type, format_choice):
    file_id = str(uuid.uuid4())
    output_template = os.path.join(DOWNLOAD_FOLDER, f"{file_id}.%(ext)s")

    ydl_opts = {
        "outtmpl": output_template,
        "quiet": True,
        "noplaylist": True,
        "ffmpeg_location": imageio_ffmpeg.get_ffmpeg_exe(),
    }

    if media_type == "audio":
        audio_format = format_choice if format_choice in {"m4a", "webm", "best"} else "m4a"
        ydl_opts.update({
            "format": f"bestaudio[ext={audio_format}]/bestaudio/best" if audio_format in {"m4a", "webm"} else "bestaudio/best",
        })

    elif media_type == "video":
        if format_choice == "mp4":
            ydl_opts.update({
                "format": "best[ext=mp4]/best",
            })
        else:
            ydl_opts.update({
                "format": "best[ext=mp4]/best"
            })

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)

    if media_type == "video" and format_choice == "mp4":
        filename = os.path.splitext(filename)[0] + ".mp4"

    return filename


@app.post("/download")
async def download(req: DownloadRequest):
    if req.type not in ["audio", "video"]:
        raise HTTPException(status_code=400, detail="Invalid type")

    try:
        file_path = download_media(req.url, req.type, req.format)

        return FileResponse(
            path=file_path,
            filename=os.path.basename(file_path),
            media_type="application/octet-stream"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def home():
    return {"message": "FastAPI Downloader Running 🚀"}