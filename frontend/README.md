# Frontend Deploy Notes

This app is built with React and Vite. For production on Vercel, set `VITE_API_BASE_URL` to the Render backend URL so the app can reach the API cross-origin.

Recommended Vercel settings:

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Recommended environment variable:

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```
