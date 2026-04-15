"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import styles from "./page.module.css";

type Role = "peserta" | "panitia";

const CONFIG: Record<Role, {
  twibbonSrc: string;
  label: string;
  tagline: string;
  accentColor: string;
  caption: string;
}> = {
  peserta: {
    twibbonSrc: "/twibbon-peserta.png",
    label: "Peserta",
    tagline: "I'M READY 🦅",
    accentColor: "#c0392b",
    caption: `Hai semuanya! 🙌\nAku [NAMA], dan aku resmi jadi peserta Diklat Senior Paskibra SMK Telkom Sidoarjo 2026! 🦅🔥\n\nDengan tema "Shape the Vision for the Next Generation", ini saatnya aku buktiin diri & jadi generasi penerus yang siap membentuk visi ke depan! 💡\n\nDoain aku ya! 😇✨\n\n#DiklatSeniorPastemda #Pastemda #SMKTelkomSidoarjo`,
  },
  panitia: {
    twibbonSrc: "/twibbon-panitia.png",
    label: "Panitia",
    tagline: "PART OF THE CREW ⚙️",
    accentColor: "#c9960c",
    caption: `Hai semuanya! 🙌\nAku [NAMA], bagian dari [JABATAN] di Diklat Senior Paskibra SMK Telkom Sidoarjo 2026! 🦅🔥\n\nMengusung tema "Shape the Vision for the Next Generation", aku siap berkontribusi penuh buat ngbikin acara ini jadi pengalaman yang berkesan! 💡\n\nI'm ready to be part of the crew — let's shape the future together! 🚀✨\n\n#DiklatSeniorPastemda #Pastemda #SMKTelkomSidoarjo`,
  },
};

interface ImgTransform {
  x: number;
  y: number;
  scale: number;
}

function TwibbonEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") || "peserta") as Role;
  const config = CONFIG[role];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const twibbonImgRef = useRef<HTMLImageElement | null>(null);
  const userImgRef = useRef<HTMLImageElement | null>(null);
  const [userImageSrc, setUserImageSrc] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [threshold, setThreshold] = useState(80);
  const [copied, setCopied] = useState(false);
  const [imgTransform, setImgTransform] = useState<ImgTransform>({ x: 0, y: 0, scale: 1 });
  const imgTransformRef = useRef<ImgTransform>({ x: 0, y: 0, scale: 1 });

  const isPeserta = role === "peserta";

  const removeChromaKey = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (g - Math.max(r, b) > threshold && g > 80) d[i + 3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
    },
    [threshold]
  );

  const renderComposite = useCallback(
    (transform?: ImgTransform) => {
      if (!canvasRef.current || !twibbonImgRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      setIsRendering(true);
      setResultUrl(null);

      const tw = twibbonImgRef.current;
      canvas.width = tw.naturalWidth;
      canvas.height = tw.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const t = transform ?? imgTransformRef.current;

      if (userImgRef.current) {
        const img = userImgRef.current;
        const baseScale =
          Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight) * t.scale;
        const sw = img.naturalWidth * baseScale;
        const sh = img.naturalHeight * baseScale;
        const dx = (canvas.width - sw) / 2 + t.x;
        const dy = (canvas.height - sh) / 2 + t.y;
        ctx.drawImage(img, dx, dy, sw, sh);
      } else {
        ctx.fillStyle = "#333";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const tmp = document.createElement("canvas");
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const tmpCtx = tmp.getContext("2d")!;
      tmpCtx.drawImage(tw, 0, 0, canvas.width, canvas.height);
      removeChromaKey(tmpCtx, canvas.width, canvas.height);
      ctx.drawImage(tmp, 0, 0);

      setResultUrl(canvas.toDataURL("image/png"));
      setIsRendering(false);
    },
    [removeChromaKey]
  );

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = config.twibbonSrc;
    img.onload = () => {
      twibbonImgRef.current = img;
      renderComposite();
    };
  }, [config.twibbonSrc, renderComposite]);

  const resetTransform = useCallback(() => {
    const t = { x: 0, y: 0, scale: 1 };
    imgTransformRef.current = t;
    setImgTransform(t);
    return t;
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setUserImageSrc(src);
      const img = new Image();
      img.onload = () => {
        userImgRef.current = img;
        const t = resetTransform();
        renderComposite(t);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const gestureRef = useRef({
    active: false,
    lastX: 0,
    lastY: 0,
    // pinch
    isPinching: false,
    lastPinchDist: 0,
    lastPinchMidX: 0,
    lastPinchMidY: 0,
  });

  const toCanvasDelta = useCallback((dxPx: number, dyPx: number) => {
    const preview = previewContainerRef.current;
    const canvas = canvasRef.current;
    if (!preview || !canvas) return { dx: 0, dy: 0 };
    const rect = preview.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { dx: dxPx * scaleX, dy: dyPx * scaleY };
  }, []);

  const applyDelta = useCallback(
    (dx: number, dy: number, dScale: number, pivotCanvasX?: number, pivotCanvasY?: number) => {
      setImgTransform((prev) => {
        let { x, y, scale } = prev;
        const newScale = Math.min(Math.max(scale * dScale, 0.5), 5);
        const scaleFactor = newScale / scale;

        if (dScale !== 1 && pivotCanvasX !== undefined && pivotCanvasY !== undefined) {
          x = pivotCanvasX + (x - pivotCanvasX) * scaleFactor;
          y = pivotCanvasY + (y - pivotCanvasY) * scaleFactor;
        }

        x += dx;
        y += dy;
        scale = newScale;

        const t = { x, y, scale };
        imgTransformRef.current = t;
        return t;
      });
    },
    []
  );

  const renderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRender = useCallback(() => {
    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    renderTimerRef.current = setTimeout(() => {
      renderComposite();
    }, 60); // ~16fps-ish debounce, feels snappy
  }, [renderComposite]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!userImgRef.current) return;
    e.preventDefault();
    const g = gestureRef.current;
    g.active = true;

    if (e.touches.length === 1) {
      g.isPinching = false;
      g.lastX = e.touches[0].clientX;
      g.lastY = e.touches[0].clientY;
    } else if (e.touches.length >= 2) {
      g.isPinching = true;
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      g.lastPinchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      g.lastPinchMidX = (t0.clientX + t1.clientX) / 2;
      g.lastPinchMidY = (t0.clientY + t1.clientY) / 2;
      g.lastX = g.lastPinchMidX;
      g.lastY = g.lastPinchMidY;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!userImgRef.current) return;
      e.preventDefault();
      const g = gestureRef.current;
      if (!g.active) return;

      const preview = previewContainerRef.current;
      const canvas = canvasRef.current;
      if (!preview || !canvas) return;
      const rect = preview.getBoundingClientRect();

      if (e.touches.length >= 2) {
        g.isPinching = true;
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;

        const dScale = dist / (g.lastPinchDist || dist);
        const dxPx = midX - g.lastX;
        const dyPx = midY - g.lastY;
        const { dx, dy } = toCanvasDelta(dxPx, dyPx);

        const pivotCanvasX = ((midX - rect.left) / rect.width) * canvas.width - canvas.width / 2;
        const pivotCanvasY = ((midY - rect.top) / rect.height) * canvas.height - canvas.height / 2;

        applyDelta(dx, dy, dScale, pivotCanvasX, pivotCanvasY);

        g.lastPinchDist = dist;
        g.lastX = midX;
        g.lastY = midY;
      } else if (e.touches.length === 1 && !g.isPinching) {
        const dxPx = e.touches[0].clientX - g.lastX;
        const dyPx = e.touches[0].clientY - g.lastY;
        const { dx, dy } = toCanvasDelta(dxPx, dyPx);
        applyDelta(dx, dy, 1);
        g.lastX = e.touches[0].clientX;
        g.lastY = e.touches[0].clientY;
      }

      scheduleRender();
    },
    [applyDelta, toCanvasDelta, scheduleRender]
  );

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const g = gestureRef.current;
    if (e.touches.length < 2) g.isPinching = false;
    if (e.touches.length === 0) {
      g.active = false;
      renderComposite();
    }
  }, [renderComposite]);

  const mouseDownRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!userImgRef.current) return;
    mouseDownRef.current = true;
    gestureRef.current.lastX = e.clientX;
    gestureRef.current.lastY = e.clientY;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!mouseDownRef.current || !userImgRef.current) return;
      const dxPx = e.clientX - gestureRef.current.lastX;
      const dyPx = e.clientY - gestureRef.current.lastY;
      const { dx, dy } = toCanvasDelta(dxPx, dyPx);
      applyDelta(dx, dy, 1);
      gestureRef.current.lastX = e.clientX;
      gestureRef.current.lastY = e.clientY;
      scheduleRender();
    },
    [applyDelta, toCanvasDelta, scheduleRender]
  );

  const handleMouseUp = useCallback(() => {
    if (mouseDownRef.current) {
      mouseDownRef.current = false;
      renderComposite();
    }
  }, [renderComposite]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!userImgRef.current) return;
      e.preventDefault();

      const preview = previewContainerRef.current;
      const canvas = canvasRef.current;
      if (!preview || !canvas) return;
      const rect = preview.getBoundingClientRect();

      if (e.ctrlKey) {
        const dScale = 1 - e.deltaY * 0.01;
        const pivotCanvasX = ((e.clientX - rect.left) / rect.width) * canvas.width - canvas.width / 2;
        const pivotCanvasY = ((e.clientY - rect.top) / rect.height) * canvas.height - canvas.height / 2;
        applyDelta(0, 0, dScale, pivotCanvasX, pivotCanvasY);
      } else {
        const { dx, dy } = toCanvasDelta(-e.deltaX, -e.deltaY);
        applyDelta(dx, dy, 1);
      }
      scheduleRender();
    },
    [applyDelta, toCanvasDelta, scheduleRender]
  );

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `twibbon-${role}-pastemda-2026.png`;
    a.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(config.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const accentStyle = { "--accent": config.accentColor } as React.CSSProperties;

  return (
    <main className={`bg-animated ${styles.main}`} style={accentStyle}>
      <div className={`blob ${isPeserta ? "blob-red" : "blob-gold"} ${styles.blob1}`} />
      <div className={`blob blob-gold ${styles.blob2}`} />

      <div className={styles.container}>
        <div className={styles.topNav}>
          <button className={`btn btn-outline ${styles.backBtn}`} onClick={() => router.push("/")}>
            ← Kembali
          </button>
          <hr className="divider-gold" style={{ flex: 1 }} />
          <span className={styles.roleTag} style={{ color: config.accentColor }}>
            Twibbon {config.label}
          </span>
        </div>

        <div className={`anim-fadeInUp ${styles.header}`}>
          <h1 className={`gold-shimmer ${styles.title}`}>PASANG TWIBBON</h1>
          <p className={styles.tagline} style={{ color: config.accentColor }}>
            {config.tagline}
          </p>
        </div>

        <div className={styles.editorGrid}>
          <div className={styles.leftCol}>
            <div
              className={`${styles.uploadZone} ${isDragging ? styles.dragging : ""}`}
              style={isDragging ? { borderColor: config.accentColor } : {}}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {userImageSrc ? (
                <div className={styles.uploadedState}>
                  <img
                    src={userImageSrc}
                    alt="Foto kamu"
                    className={styles.thumbPreview}
                    style={{ borderColor: config.accentColor }}
                  />
                  <p className={styles.uploadedText}>
                    ✅ Foto berhasil! <span style={{ color: config.accentColor }}>Klik untuk ganti</span>
                  </p>
                </div>
              ) : (
                <div className={styles.uploadEmptyState}>
                  <span className={`anim-float ${styles.uploadIcon}`}>📸</span>
                  <p className={styles.uploadTitle}>Upload foto kamu</p>
                  <p className={styles.uploadSub}>Drag & drop atau klik untuk pilih</p>
                  <p className={styles.uploadHint}>JPG, PNG, WEBP — maks 10MB</p>
                </div>
              )}
            </div>

            <div className={`card ${styles.sliderCard}`}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>🟩 Sensitivitas Chroma Key</span>
                <span className={styles.sliderValue} style={{ color: config.accentColor }}>
                  {threshold}
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={150}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                onMouseUp={() => renderComposite()}
                onTouchEnd={() => renderComposite()}
              />
              <p className={styles.sliderHint}>
                Geser lalu lepas untuk update preview. Naikkan jika hijau masih tersisa.
              </p>
            </div>

            {userImageSrc && (
              <div
                className="card"
                style={{
                  padding: "12px 16px",
                  fontSize: "0.78rem",
                  color: "#aaa",
                  lineHeight: 1.6,
                  marginBottom: 0,
                }}
              >
                <p style={{ margin: 0 }}>
                  🖐️ <strong style={{ color: "#ddd" }}>Atur foto di preview:</strong>
                  <br />
                  • <strong>Geser 1 jari / klik-drag</strong> → pindah posisi foto
                  <br />
                  • <strong>Cubit 2 jari / scroll trackpad</strong> → zoom in/out
                </p>
              </div>
            )}

            <button
              className={`btn btn-full ${isPeserta ? "btn-red" : "btn-gold"}`}
              onClick={() => renderComposite()}
              disabled={isRendering}
            >
              {isRendering ? "⏳ Memproses..." : "🔄 Generate Twibbon"}
            </button>
          </div>

          <div className={styles.rightCol}>
            <div
              ref={previewContainerRef}
              className={styles.previewWrap}
              style={{
                borderColor: config.accentColor + "66",
                cursor: userImageSrc ? "grab" : "default",
                userSelect: "none",
                touchAction: userImageSrc ? "none" : "auto",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            >
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Hasil twibbon"
                  className={`anim-scaleIn ${styles.previewImg}`}
                  draggable={false}
                  style={{ pointerEvents: "none" }}
                />
              ) : (
                <div className={styles.previewEmpty}>
                  <span className={`anim-float ${styles.previewIcon}`}>🖼️</span>
                  <p>Preview akan muncul di sini</p>
                </div>
              )}

              {isRendering && (
                <div className={styles.previewOverlay}>
                  <span className="anim-float" style={{ fontSize: "2.5rem" }}>⚙️</span>
                  <p>Memproses chroma key...</p>
                </div>
              )}
            </div>

            <button
              className={`btn btn-full anim-pulseGold ${isPeserta ? "btn-red" : "btn-gold"}`}
              onClick={handleDownload}
              disabled={!resultUrl}
              style={!resultUrl ? { opacity: 0.3, animation: "none" } : {}}
            >
              ⬇️ Download Twibbon
            </button>
          </div>
        </div>

        <div className={`card ${styles.captionCard}`}>
          <div className={styles.captionHeader}>
            <h2 className={styles.captionTitle}>CAPTION SIAP PAKAI</h2>
            <button
              className={`btn ${isPeserta ? "btn-red" : "btn-gold"}`}
              onClick={handleCopy}
              style={{ padding: "10px 20px", fontSize: "0.78rem" }}
            >
              {copied ? "✅ Tersalin!" : "📋 Copy Caption"}
            </button>
          </div>
          <hr className="divider-gold" style={{ margin: "12px 0" }} />
          <pre className={styles.captionText}>{config.caption}</pre>
          <p className={styles.captionNote} style={{ color: config.accentColor }}>
            * Ganti [NAMA]{role === "panitia" ? " dan [JABATAN]" : ""} dengan info kamu ya! 😊
          </p>
        </div>

        <p className={styles.hashtags}>#DiklatSeniorPastemda · #Pastemda · #SMKTelkomSidoarjo</p>
      </div>
    </main>
  );
}

export default function TwibbonPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          Loading...
        </div>
      }
    >
      <TwibbonEditor />
    </Suspense>
  );
}