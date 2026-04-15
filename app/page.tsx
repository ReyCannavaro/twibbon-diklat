"use client";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();

  const roles = [
    {
      id: "peserta",
      label: "Peserta",
      tagline: "I'M READY",
      desc: "Aku siap buktiin diri di Diklat Senior!",
      emoji: "🦅",
      cardClass: styles.cardRed,
      tagClass: styles.tagRed,
      arrowClass: styles.arrowRed,
    },
    {
      id: "panitia",
      label: "Panitia",
      tagline: "PART OF THE CREW",
      desc: "Aku siap jadi tulang punggung acara ini!",
      emoji: "⚙️",
      cardClass: styles.cardGold,
      tagClass: styles.tagGold,
      arrowClass: styles.arrowGold,
    },
  ];

  return (
    <main className={`bg-animated ${styles.main}`}>
      <div className={`blob blob-red ${styles.blob1}`} />
      <div className={`blob blob-gold ${styles.blob2}`} />

      <div className={styles.container}>
        <div className={`anim-fadeInUp ${styles.badgeWrap}`} style={{ animationDelay: "0s" }}>
          <span className="badge badge-gold">✦ Pastemda SMK Telkom Sidoarjo ✦</span>
        </div>

        <h1
          className={`gold-shimmer anim-fadeInUp ${styles.title}`}
          style={{ animationDelay: "0.1s" }}
        >
          DIKLAT SENIOR
        </h1>
        <h2
          className={`anim-fadeInUp ${styles.subtitle}`}
          style={{ animationDelay: "0.15s" }}
        >
          PASKIBRA 2026
        </h2>

        <hr className={`divider-gold anim-fadeInUp ${styles.divider}`} style={{ animationDelay: "0.2s" }} />

        <p className={`anim-fadeInUp ${styles.quote}`} style={{ animationDelay: "0.25s" }}>
          &ldquo;Shape the Vision for the Next Generation&rdquo;
        </p>
        <p className={`anim-fadeInUp ${styles.prompt}`} style={{ animationDelay: "0.3s" }}>
          Hai! Siapa kamu di sini? 👀
        </p>

        <div className={styles.grid}>
          {roles.map((role, i) => (
            <button
              key={role.id}
              className={`card anim-fadeInUp ${role.cardClass} ${styles.roleCard}`}
              style={{ animationDelay: `${0.35 + i * 0.1}s` }}
              onClick={() => router.push(`/twibbon?role=${role.id}`)}
            >
              <div className={`anim-float ${styles.emoji}`} style={{ animationDelay: `${i * 0.8}s` }}>
                {role.emoji}
              </div>
              <div className={styles.roleLabel}>{role.label}</div>
              <div className={`${role.tagClass} ${styles.roleTagline}`}>{role.tagline}</div>
              <p className={styles.roleDesc}>{role.desc}</p>
              <div className={`${role.arrowClass} ${styles.roleAction}`}>
                Pasang Twibbon <span className={styles.arrow}>→</span>
              </div>
            </button>
          ))}
        </div>

        <p className={`anim-fadeInUp ${styles.hashtags}`} style={{ animationDelay: "0.6s" }}>
          #DiklatSeniorPastemda · #Pastemda · #SMKTelkomSidoarjo
        </p>
      </div>
    </main>
  );
}