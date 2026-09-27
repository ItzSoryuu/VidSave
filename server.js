import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Ensure bin and temp directories exist
const BIN_DIR = path.join(__dirname, 'bin');
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// Locate yt-dlp & ffmpeg
const YTDLP_BIN = fs.existsSync(path.join(BIN_DIR, 'yt-dlp.exe'))
  ? path.join(BIN_DIR, 'yt-dlp.exe')
  : (fs.existsSync(path.join(BIN_DIR, 'yt-dlp')) ? path.join(BIN_DIR, 'yt-dlp') : 'yt-dlp');

const FFMPEG_LOCATION = fs.existsSync(path.join(BIN_DIR, 'ffmpeg.exe'))
  ? BIN_DIR
  : (fs.existsSync(path.join(BIN_DIR, 'ffmpeg')) ? BIN_DIR : null);

// ─── HELPERS ───────────────────────────────────────────────────────────────

function detectPlatform(url) {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  return null;
}

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes) || bytes <= 0) return null;
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function cleanFilename(str) {
  return (str || 'video')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60);
}

// Execute yt-dlp command with arguments
function runYtDlp(args, onSpawn) {
  return new Promise((resolve, reject) => {
    const finalArgs = [...args];
    if (FFMPEG_LOCATION && !finalArgs.includes('--ffmpeg-location')) {
      finalArgs.push('--ffmpeg-location', FFMPEG_LOCATION);
    }
    finalArgs.push('--js-runtimes', 'node', '--no-warnings', '--no-check-certificates');

    const proc = spawn(YTDLP_BIN, finalArgs, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    onSpawn?.(proc);

    proc.stdout.on('data', data => {
      stdout += data.toString();
    });

    proc.stderr.on('data', data => {
      stderr += data.toString();
    });

    proc.on('close', code => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr || stdout || `yt-dlp exited with code ${code}`));
      }
    });

    proc.on('error', err => {
      reject(err);
    });
  });
}

// ─── YOUTUBE INFO ──────────────────────────────────────────────────────────

async function getYoutubeInfo(url) {
  const jsonStr = await runYtDlp(['-j', '--no-playlist', url]);
  const meta = JSON.parse(jsonStr);

  const formats = [];
  const allFormats = meta.formats || [];

  // Best audio size estimation
  const bestAudioFormat = allFormats
    .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
  
  let audioBytes = bestAudioFormat?.filesize || bestAudioFormat?.filesize_approx || 0;
  if (!audioBytes && bestAudioFormat && meta.duration > 0) {
    const abr = bestAudioFormat.abr || 128;
    audioBytes = Math.round((abr * 1000 / 8) * meta.duration);
  }

  // Helper to find approximate size for a video height
  const getFormatSize = (targetHeight) => {
    const matchingVideos = allFormats
      .filter(f => (f.height || 0) <= targetHeight && f.vcodec !== 'none')
      .sort((a, b) => (b.height || 0) - (a.height || 0));
    const bestVid = matchingVideos[0];
    if (!bestVid) return null;

    let vidBytes = bestVid.filesize || bestVid.filesize_approx || 0;
    if (!vidBytes && meta.duration > 0) {
      const vbr = bestVid.vbr || bestVid.tbr || (targetHeight >= 1080 ? 3000 : (targetHeight >= 720 ? 1500 : 800));
      vidBytes = Math.round((vbr * 1000 / 8) * meta.duration);
    }
    return vidBytes > 0 ? vidBytes + audioBytes : null;
  };

  // 1080p
  const size1080 = getFormatSize(1080);
  formats.push({
    id: 'yt_1080',
    label: '1080p Full HD',
    type: 'video',
    ext: 'mp4',
    formatSelector: 'bestvideo[vcodec^=avc1][height<=1080]+bestaudio[ext=m4a]/bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best',
    contentLength: size1080,
    sizeLabel: size1080 ? formatBytes(size1080) : null,
  });

  // 720p
  const size720 = getFormatSize(720);
  formats.push({
    id: 'yt_720',
    label: '720p HD',
    type: 'video',
    ext: 'mp4',
    formatSelector: 'bestvideo[vcodec^=avc1][height<=720]+bestaudio[ext=m4a]/bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best',
    contentLength: size720,
    sizeLabel: size720 ? formatBytes(size720) : null,
  });

  // 480p
  const size480 = getFormatSize(480);
  formats.push({
    id: 'yt_480',
    label: '480p SD',
    type: 'video',
    ext: 'mp4',
    formatSelector: 'bestvideo[vcodec^=avc1][height<=480]+bestaudio[ext=m4a]/bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best',
    contentLength: size480,
    sizeLabel: size480 ? formatBytes(size480) : null,
  });

  // MP3 Audio
  formats.push({
    id: 'yt_mp3',
    label: 'MP3 (Audio Only)',
    type: 'audio',
    ext: 'mp3',
    formatSelector: 'bestaudio/best',
    contentLength: audioBytes || null,
    sizeLabel: audioBytes ? formatBytes(audioBytes) : null,
  });

  return {
    platform: 'youtube',
    title: meta.title || 'YouTube Video',
    uploader: meta.uploader || meta.channel || 'YouTube Creator',
    duration: meta.duration || 0,
    viewCount: meta.view_count || 0,
    likeCount: meta.like_count || 0,
    thumbnail: meta.thumbnail,
    formats,
    originalUrl: url,
  };
}

// ─── TIKTOK INFO ───────────────────────────────────────────────────────────

async function getTikTokInfo(url) {
  try {
    const resp = await axios.post(
      'https://www.tikwm.com/api/',
      new URLSearchParams({ url, hd: '1' }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
        timeout: 12000,
      }
    );

    const d = resp.data?.data;
    if (d && (d.play || d.hdplay)) {
      const formats = [
        {
          id: 'tt_hd',
          label: 'HD (Tanpa Watermark)',
          type: 'video',
          ext: 'mp4',
          directUrl: d.hdplay || d.play,
          contentLength: d.size || null,
          sizeLabel: d.size ? formatBytes(d.size) : null,
        },
        {
          id: 'tt_sd',
          label: 'SD (Tanpa Watermark)',
          type: 'video',
          ext: 'mp4',
          directUrl: d.play,
          contentLength: d.wm_size || null,
          sizeLabel: d.wm_size ? formatBytes(d.wm_size) : null,
        },
        {
          id: 'tt_mp3',
          label: 'Audio MP3',
          type: 'audio',
          ext: 'mp3',
          directUrl: d.music,
          contentLength: null,
          sizeLabel: d.music_info?.duration ? `~${formatBytes(d.music_info.duration * 16000)}` : null,
        },
      ];

      return {
        platform: 'tiktok',
        title: d.title || 'TikTok Video',
        uploader: d.author?.nickname || d.author?.unique_id || 'TikTok Creator',
        duration: d.duration || 0,
        viewCount: d.play_count || 0,
        likeCount: d.digg_count || 0,
        thumbnail: d.cover || d.origin_cover,
        formats,
        originalUrl: url,
      };
    }
  } catch (err) {
    console.log('TikTok public API fallback to yt-dlp:', err.message);
  }

  // Fallback to yt-dlp
  const jsonStr = await runYtDlp(['-j', '--no-playlist', url]);
  const meta = JSON.parse(jsonStr);

  return {
    platform: 'tiktok',
    title: meta.title || 'TikTok Video',
    uploader: meta.uploader || 'TikTok Creator',
    duration: meta.duration || 0,
    viewCount: meta.view_count || 0,
    likeCount: meta.like_count || 0,
    thumbnail: meta.thumbnail,
    formats: [
      {
        id: 'tt_dlp_video',
        label: 'Video MP4',
        type: 'video',
        ext: 'mp4',
        formatSelector: 'best[ext=mp4]/best',
        contentLength: meta.filesize || meta.filesize_approx || null,
        sizeLabel: (meta.filesize || meta.filesize_approx) ? formatBytes(meta.filesize || meta.filesize_approx) : null,
      },
      {
        id: 'tt_dlp_audio',
        label: 'Audio MP3',
        type: 'audio',
        ext: 'mp3',
        formatSelector: 'bestaudio/best',
        contentLength: null,
        sizeLabel: null,
      },
    ],
    originalUrl: url,
  };
}

// ─── INSTAGRAM INFO ────────────────────────────────────────────────────────

async function getInstagramInfo(url) {
  // Try yt-dlp directly for Instagram - it extracts title, uploader, thumbnail and video seamlessly
  try {
    const jsonStr = await runYtDlp(['-j', '--no-playlist', url]);
    const meta = JSON.parse(jsonStr);
    const size = meta.filesize || meta.filesize_approx || null;

    return {
      platform: 'instagram',
      title: meta.title || meta.description?.slice(0, 50) || 'Instagram Video',
      uploader: meta.uploader || 'Instagram User',
      duration: meta.duration || 0,
      viewCount: meta.view_count || 0,
      likeCount: meta.like_count || 0,
      thumbnail: meta.thumbnail,
      formats: [
        {
          id: 'ig_best',
          label: 'Video MP4 (Kualitas Terbaik)',
          type: 'video',
          ext: 'mp4',
          formatSelector: 'best[ext=mp4]/best',
          contentLength: size,
          sizeLabel: size ? formatBytes(size) : null,
        },
      ],
      originalUrl: url,
    };
  } catch (err) {
    console.log('Instagram yt-dlp error, attempting snapinsta fallback:', err.message);
  }

  // Fallback: oEmbed / basic metadata
  let title = 'Instagram Reel';
  let uploader = 'Instagram User';
  let thumbnail = null;

  try {
    const oembedResp = await axios.get(`https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    title = oembedResp.data.title || title;
    uploader = oembedResp.data.author_name || uploader;
    thumbnail = oembedResp.data.thumbnail_url || null;
  } catch {
    // oEmbed is best-effort; yt-dlp metadata below is enough on its own.
  }

  return {
    platform: 'instagram',
    title,
    uploader,
    duration: 0,
    viewCount: 0,
    likeCount: 0,
    thumbnail,
    formats: [
      {
        id: 'ig_best',
        label: 'Video MP4 (Kualitas Terbaik)',
        type: 'video',
        ext: 'mp4',
        formatSelector: 'best',
        contentLength: null,
        sizeLabel: null,
      },
    ],
    originalUrl: url,
  };
}

// ─── DOWNLOAD HANDLERS ─────────────────────────────────────────────────────

// Downloads are served as a plain `Content-Disposition: attachment` response so
// the browser's own download manager owns progress, resume and cancellation.
// An earlier version tried to rebuild the progress bar in-page, which required
// streaming the whole file through JS memory and still had no real numbers to
// show, because yt-dlp writes the file to disk before the response begins.

// Download via direct URL stream (for TikTok direct links)
async function streamDirect(res, directUrl, title, ext) {
  const resp = await axios.get(directUrl, {
    responseType: 'stream',
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    maxRedirects: 10,
  });

  const filename = `${cleanFilename(title)}.${ext}`;
  const contentLength = resp.headers['content-length'];

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', ext === 'mp3' ? 'audio/mpeg' : 'video/mp4');
  if (contentLength) res.setHeader('Content-Length', contentLength);

  resp.data.pipe(res);
  resp.data.on('error', err => {
    console.error('Direct stream error:', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Stream interrupted' });
  });
}

// yt-dlp writes the whole file into TEMP_DIR before we can stream it, so a
// cancelled or crashed download can strand a partial file there. Anything older
// than TEMP_MAX_AGE_MS is a leftover from an earlier run and is safe to drop.
const TEMP_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

function sweepTempDir() {
  let entries = [];
  try {
    entries = fs.readdirSync(TEMP_DIR);
  } catch {
    return;
  }
  const now = Date.now();
  for (const name of entries) {
    const full = path.join(TEMP_DIR, name);
    try {
      if (now - fs.statSync(full).mtimeMs > TEMP_MAX_AGE_MS) fs.unlinkSync(full);
    } catch {
      // Still locked by a running download; the next sweep will retry.
    }
  }
}

// Download via standalone yt-dlp and ffmpeg (merges cleanly into standard MP4 / MP3)
async function downloadWithYtDlp(res, url, formatSelector, title, ext, type) {
  const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const outTemplate = path.join(TEMP_DIR, `${fileId}.%(ext)s`);

  const args = [
    '--no-playlist',
    url,
    '-o', outTemplate,
  ];

  if (type === 'audio') {
    args.push('--extract-audio', '--audio-format', 'mp3');
  } else {
    args.push('-f', formatSelector || 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
    args.push('--merge-output-format', 'mp4');
  }

  // The browser owns cancellation, but it can only drop the HTTP connection —
  // the yt-dlp child process has to be killed from here or it keeps downloading.
  let child = null;
  let abandoned = false;
  res.on('close', () => {
    if (res.writableEnded) return;
    abandoned = true;
    if (child) {
      // On Windows, child.kill() only sends SIGTERM which yt-dlp/ffmpeg often ignore.
      // Use taskkill /F /T to forcefully kill the whole process tree.
      if (process.platform === 'win32') {
        try { spawn('taskkill', ['/F', '/T', '/PID', child.pid], { windowsHide: true }); } catch { /* ignore */ }
      } else {
        try { child.kill('SIGKILL'); } catch { /* ignore */ }
      }
    }
  });

  // Execute download
  try {
    await runYtDlp(args, (proc) => { child = proc; });
  } catch (err) {
    if (abandoned) return;
    throw err;
  }

  if (abandoned) {
    // The client left; drop whatever yt-dlp managed to write.
    removeTempFiles(fileId);
    return;
  }

  // Find the generated file in TEMP_DIR
  const expectedExt = type === 'audio' ? 'mp3' : 'mp4';
  const outFilePath = path.join(TEMP_DIR, `${fileId}.${expectedExt}`);

  if (fs.existsSync(outFilePath)) {
    return sendFileAndCleanup(res, outFilePath, title, expectedExt, type);
  }

  // Check if any file with fileId exists
  const files = fs.readdirSync(TEMP_DIR).filter(f => f.startsWith(fileId));
  if (files.length === 0) throw new Error('File hasil download tidak ditemukan di server.');
  return sendFileAndCleanup(res, path.join(TEMP_DIR, files[0]), title, expectedExt, type);
}

// Delete every artefact belonging to one download attempt (final file + .part)
function removeTempFiles(fileId) {
  try {
    for (const name of fs.readdirSync(TEMP_DIR).filter(f => f.startsWith(fileId))) {
      try { fs.unlinkSync(path.join(TEMP_DIR, name)); } catch { /* locked */ }
    }
  } catch {
    // TEMP_DIR unreadable; the sweeper will handle it.
  }
}

function sendFileAndCleanup(res, filePath, title, ext, type) {
  const stat = fs.statSync(filePath);
  const filename = `${cleanFilename(title)}.${ext}`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');
  res.setHeader('Content-Length', stat.size);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);

  const cleanup = () => {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // A locked file (e.g. cancelled download) is left for the next sweep.
    }
  };

  res.on('finish', cleanup);
  res.on('close', cleanup);
  stream.on('error', (err) => {
    console.error('File stream error:', err.message);
    cleanup();
  });
}

// ─── API ROUTES ────────────────────────────────────────────────────────────

// GET /api/info?url=...
app.get('/api/info', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const platform = detectPlatform(url);
  if (!platform) return res.status(400).json({ error: 'URL tidak dikenali. Gunakan link YouTube, Instagram, atau TikTok.' });

  try {
    let info;
    if (platform === 'youtube') info = await getYoutubeInfo(url);
    else if (platform === 'tiktok') info = await getTikTokInfo(url);
    else if (platform === 'instagram') info = await getInstagramInfo(url);
    res.json(info);
  } catch (err) {
    console.error(`[${platform}] Info error:`, err.message);
    res.status(500).json({
      error: err.message.includes('Private video') || err.message.includes('Video unavailable')
        ? 'Video tidak tersedia atau disetel privat.'
        : `Gagal mengambil info: ${err.message.slice(0, 150)}`,
    });
  }
});

// GET /api/download — streams the file straight to the browser as an attachment.
// The browser download manager shows the real progress and offers cancel/resume,
// so the client never has to buffer or poll anything.
app.get('/api/download', async (req, res) => {
  const { url, platform, formatSelector, directUrl, type, ext, title } = req.query;
  if (!url || !platform) return res.status(400).json({ error: 'URL and platform required' });

  try {
    if (directUrl) {
      await streamDirect(res, directUrl, title || 'video', ext || 'mp4');
    } else {
      await downloadWithYtDlp(res, url, formatSelector, title || 'video', ext || 'mp4', type || 'video');
    }
  } catch (err) {
    console.error(`[${platform}] Download error:`, err.message);
    if (res.headersSent) {
      // The browser already started saving; the only useful action is to stop.
      return res.destroy();
    }
    const message = err.message || 'Download gagal';
    res.status(500).json({
      error: message.includes('Requested format is not available')
        ? 'Format video tidak tersedia untuk sumber ini.'
        : message.includes('Forbidden') || message.includes('HTTP Error 4')
          ? 'Sumber menolak permintaan unduhan. Coba video lain atau beberapa saat lagi.'
          : message.slice(0, 200),
    });
  }
});

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'yt-dlp-standalone',
    ffmpeg: !!FFMPEG_LOCATION,
    ytdlp: fs.existsSync(YTDLP_BIN) || YTDLP_BIN === 'yt-dlp',
  });
});

app.listen(PORT, () => {
  console.log(`VidSave backend running at http://localhost:${PORT}`);
  console.log(`Using standalone binaries: yt-dlp: ${YTDLP_BIN}, ffmpeg: ${FFMPEG_LOCATION || 'system'}`);
  sweepTempDir();
  setInterval(sweepTempDir, 10 * 60 * 1000).unref();
});
