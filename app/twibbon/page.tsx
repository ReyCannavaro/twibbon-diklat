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

function TwibbonEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") || "peserta") as Role;
  const config = CONFIG[role];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const twibbonImgRef = useRef<HTMLImageElement | null>(null);
  const userImgRef = useRef<HTMLImageElement | null>(null);

  const [userImageSrc, setUserImageSrc] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [threshold, setThreshold] = useState(80);
  const [copied, setCopied] = useState(false);

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

  const renderComposite = useCallback(() => {
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

    if (userImgRef.current) {
      const img = userImgRef.current;
      const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      ctx.drawImage(img, (canvas.width - sw) / 2, (canvas.height - sh) / 2, sw, sh);
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
  }, [removeChromaKey]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = config.twibbonSrc;
    img.onload = () => {
      twibbonImgRef.current = img;
      renderComposite();
    };
  }, [config.twibbonSrc, renderComposite]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setUserImageSrc(src);
      const img = new Image();
      img.onload = () => { userImgRef.current = img; renderComposite(); };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

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
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
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
                  <img src={userImageSrc} alt="Foto kamu" className={styles.thumbPreview} style={{ borderColor: config.accentColor }} />
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
                <span className={styles.sliderValue} style={{ color: config.accentColor }}>{threshold}</span>
              </div>
              <input
                type="range" min={20} max={150} value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                onMouseUp={renderComposite}
                onTouchEnd={renderComposite}
              />
              <p className={styles.sliderHint}>
                Geser lalu lepas untuk update preview. Naikkan jika hijau masih tersisa.
              </p>
            </div>

            <button
              className={`btn btn-full ${isPeserta ? "btn-red" : "btn-gold"}`}
              onClick={renderComposite}
              disabled={isRendering}
            >
              {isRendering ? "⏳ Memproses..." : "🔄 Generate Twibbon"}
            </button>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.previewWrap} style={{ borderColor: config.accentColor + "66" }}>
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {resultUrl ? (
                <img src={resultUrl} alt="Hasil twibbon" className={`anim-scaleIn ${styles.previewImg}`} />
              ) : (
                <div className={styles.previewEmpty}>
                  <span className={`anim-float ${styles.previewIcon}`}>🖼️</span>
                  <p>Preview akan muncul di sini</p>
                </div>
              )}

              {isRendering && (
                <div className={styles.previewOverlay}>
                  <span className={`anim-float`} style={{ fontSize: "2.5rem" }}>⚙️</span>
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
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        Loading...
      </div>
    }>
      <TwibbonEditor />
    </Suspense>
  );
}