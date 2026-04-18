import base64
import logging
import os
import tempfile
import uuid

import imageio_ffmpeg
import yt_dlp
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from yt_dlp.utils import DownloadError

app = FastAPI()
logger = logging.getLogger("nexus_downloader")


def _normalize_origin(origin: str) -> str:
    return origin.strip().rstrip("/")


def _load_allowed_origins():
    explicit = os.getenv("FRONTEND_ORIGINS", "")
    single = os.getenv("FRONTEND_ORIGIN", "")

    origins = []
    if explicit:
        origins.extend(_normalize_origin(item) for item in explicit.split(",") if item.strip())
    if single:
        origins.append(_normalize_origin(single))

    if not origins:
        origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

    seen = set()
    unique_origins = []
    for origin in origins:
        if origin and origin not in seen:
            seen.add(origin)
            unique_origins.append(origin)

    return unique_origins


cors_kwargs = {
    "allow_origins": _load_allowed_origins(),
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
    "expose_headers": ["Content-Disposition", "Content-Length"],
}

frontend_origin_regex = os.getenv("FRONTEND_ORIGIN_REGEX")
if frontend_origin_regex:
    cors_kwargs["allow_origin_regex"] = frontend_origin_regex.strip()

app.add_middleware(
    CORSMiddleware,
    **cors_kwargs,
)

DOWNLOAD_FOLDER = "downloads"
os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)


class DownloadRequest(BaseModel):
    url: str
    type: str   # "audio" or "video"
    format: str = "mp4"


def _resolve_cookie_file():
    cookie_file_from_path = os.getenv("YTDLP_COOKIE_FILE", "").strip()
    if cookie_file_from_path:
        return cookie_file_from_path, None

    cookies_b64 = os.getenv("YTDLP_COOKIES_B64", "").strip()
    cookies_raw = os.getenv("YTDLP_COOKIES", "")

    if not cookies_b64 and not cookies_raw:
        return None, None

    if cookies_b64:
        try:
            cookie_text = base64.b64decode(cookies_b64).decode("utf-8")
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Invalid YTDLP_COOKIES_B64 value: {exc}")
    else:
        cookie_text = cookies_raw.replace("\\n", "\n")

    temp_cookie_file = tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", suffix=".txt", delete=False)
    temp_cookie_file.write(cookie_text)
    temp_cookie_file.flush()
    temp_cookie_file.close()
    return temp_cookie_file.name, temp_cookie_file.name


def _error_response(message: str, code: str, request_id: str | None = None):
    payload = {
        "ok": False,
        "error": {
            "code": code,
            "message": message,
        },
    }

    if request_id:
        payload["error"]["requestId"] = request_id

    return JSONResponse(status_code=200, content=payload)


def download_media(url, media_type, format_choice):
    file_id = str(uuid.uuid4())
    output_template = os.path.join(DOWNLOAD_FOLDER, f"{file_id}.%(ext)s")
    cookie_file_path, temporary_cookie_file = _resolve_cookie_file()

    ydl_opts = {
        "outtmpl": output_template,
        "quiet": True,
        "noplaylist": True,
        "ffmpeg_location": imageio_ffmpeg.get_ffmpeg_exe(),
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "web"],
            }
        },
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
        "retries": 3,
        "fragment_retries": 3,
    }

    if cookie_file_path:
        ydl_opts["cookiefile"] = cookie_file_path

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

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
    except DownloadError as exc:
        error_message = str(exc)
        normalized = error_message.lower()
        logger.warning("yt-dlp error while processing URL: %s", error_message)

        if "sign in to confirm" in normalized or "not a bot" in normalized:
            return _error_response(
                message="This media is currently restricted by the source platform and cannot be downloaded right now.",
                code="source_restricted",
            )

        logger.info("yt-dlp rejected download for URL: %s", url)
        return _error_response(
            message="The source platform did not allow this download request.",
            code="source_denied",
        )
    finally:
        if temporary_cookie_file:
            try:
                os.remove(temporary_cookie_file)
            except OSError:
                pass

    if media_type == "video" and format_choice == "mp4":
        filename = os.path.splitext(filename)[0] + ".mp4"

    return filename


@app.post("/download")
async def download(req: DownloadRequest):
    if req.type not in ["audio", "video"]:
        raise HTTPException(status_code=400, detail="Invalid type")

    if not req.url.strip():
        raise HTTPException(status_code=400, detail="A valid URL is required")

    try:
        file_path = download_media(req.url.strip(), req.type, req.format)

        if isinstance(file_path, JSONResponse):
            return file_path

        return FileResponse(
            path=file_path,
            filename=os.path.basename(file_path),
            media_type="application/octet-stream"
        )

    except HTTPException:
        raise
    except Exception as exc:
        request_id = uuid.uuid4().hex[:8]
        logger.exception("Unhandled download error request_id=%s", request_id)
        return _error_response(
            message="Unable to process this download right now. Please try again later.",
            code="server_error",
            request_id=request_id,
        )


@app.get("/")
async def home():
    return {"message": "FastAPI Downloader Running 🚀"}