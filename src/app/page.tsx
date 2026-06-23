'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import GameImporter from '@/components/GameImporter/GameImporter';
import { GameData } from '@/lib/types';
import styles from './page.module.css';

/* ── Decorative chess board (Immortal Game position) ─────────────────── */
const POSITION: Record<string, string> = {
  a8:'♜', b8:'♞', c8:'♝', e8:'♚',
  a7:'♟', b7:'♟', c7:'♟', d7:'♟',   f7:'♟', g7:'♟', h7:'♟',
  g8:'♝',
  f6:'♞',
  e6:'♟',
  d6:'♛',
  e5:'♙',
  d4:'♙',
  c3:'♘',
  f3:'♘',
  a1:'♖', h1:'♖',
  a2:'♙', b2:'♙', c2:'♙',           f2:'♙', g2:'♙', h2:'♙',
  d1:'♕', e1:'♔',
  f1:'♗',
  b1:'♘',
};

const PIECE_COLORS: Record<string, string> = {
  '♜':'#1a1410','♞':'#1a1410','♝':'#1a1410','♚':'#1a1410','♛':'#1a1410','♟':'#1a1410',
  '♖':'#f0e6d2','♘':'#f0e6d2','♗':'#f0e6d2','♔':'#f0e6d2','♕':'#f0e6d2','♙':'#f0e6d2',
};

function ChessBoardDecor() {
  const files = ['a','b','c','d','e','f','g','h'];
  const ranks = [8,7,6,5,4,3,2,1];

  return (
    <div className={styles.boardDecor}>
      <div className={styles.rankLabels}>
        {ranks.map(r => <span key={r} className={styles.rankLabel}>{r}</span>)}
      </div>
      <div className={styles.boardGrid}>
        {ranks.map((rank) =>
          files.map((file) => {
            const sq = `${file}${rank}`;
            const fileIdx = files.indexOf(file);
            const rankIdx = ranks.indexOf(rank);
            const isLight = (fileIdx + rankIdx) % 2 === 0;
            const piece = POSITION[sq];
            const isHighlight = sq === 'e5' || sq === 'd6';
            return (
              <div key={sq} className={`${styles.square} ${isLight ? styles.lightSq : styles.darkSq} ${isHighlight ? styles.highlightSq : ''}`}>
                {piece && <span className={styles.piece} style={{ color: PIECE_COLORS[piece] }}>{piece}</span>}
              </div>
            );
          })
        )}
      </div>
      <div className={styles.fileLabels}>
        {files.map(f => <span key={f} className={styles.fileLabel}>{f}</span>)}
      </div>
    </div>
  );
}

/* ── Importer Modal ───────────────────────────────────────────────────── */
function ImporterModal({ onClose, onGameSelect }: { onClose: () => void; onGameSelect: (g: GameData) => void }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <span className={styles.modalPiece}>♜</span>
            <h2 className={styles.modalTitle}>Import Your Games</h2>
          </div>
          <button
            id="close-modal-btn"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >✕</button>
        </div>
        <div className={styles.modalBody}>
          <GameImporter onGameSelect={onGameSelect} />
        </div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */
export default function HomePage() {
  const router = useRouter();
  const [showImporter, setShowImporter] = useState(false);

  const handleGameSelect = useCallback((game: GameData) => {
    sessionStorage.setItem('chess-selected-game', JSON.stringify(game));
    router.push('/analyse');
  }, [router]);

  const openImporter  = () => setShowImporter(true);
  const closeImporter = () => setShowImporter(false);

  return (
    <div className={styles.page}>

      {/* Modal */}
      {showImporter && (
        <ImporterModal onClose={closeImporter} onGameSelect={handleGameSelect} />
      )}

      {/* ── Navbar ── */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <Image
            src="/logo.png"
            alt="ChessReview logo"
            width={36}
            height={36}
            className={styles.navLogoImg}
            priority
          />
          <span className={styles.navBrand}>
            Chess<span className={styles.navAccent}>Review</span>
          </span>
        </div>
        <div className={styles.navCenter}>
          <span className={styles.navTagline}>Powered by Stockfish 18</span>
        </div>
        <div className={styles.navRight}>
          <button id="nav-analyse-btn" className={styles.navCta} onClick={openImporter}>
            Analyse a Game →
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        {/* Left column */}
        <div className={styles.heroLeft}>
          <div className={styles.heroEyebrow}>
            <span className={styles.eyebrowDot} />
            Game Review · Stockfish 18 · Depth 18
          </div>

          <h1 className={styles.heroTitle}>
            Every move<br />
            <em className={styles.heroTitleEm}>tells a story.</em>
          </h1>

          <p className={styles.heroBody}>
            Import any game from <strong>chess.com</strong> or <strong>lichess</strong> and
            get Stockfish 18 engine analysis — move classification, accuracy scores, eval curves
            and opening detection — right in your browser.
          </p>

          {/* Classification key */}
          <div className={styles.classKey}>
            {[
              { sym: '!!', label: 'Brilliant', color: '#1bada6' },
              { sym: '!',  label: 'Best',      color: '#96bc4b' },
              { sym: '?!', label: 'Inaccuracy',color: '#f6c44f' },
              { sym: '?',  label: 'Mistake',   color: '#e58c1a' },
              { sym: '??', label: 'Blunder',   color: '#ca3431' },
            ].map(c => (
              <div key={c.label} className={styles.classItem}>
                <span className={styles.classSym} style={{ color: c.color }}>{c.sym}</span>
                <span className={styles.classLabel}>{c.label}</span>
              </div>
            ))}
          </div>

          <button
            id="start-analysis-cta"
            className={styles.ctaBtn}
            onClick={openImporter}
          >
            <span className={styles.ctaPawn}>♟</span>
            Analyse a Game
            <span className={styles.ctaArrow}>→</span>
          </button>

          <p className={styles.ctaHint}>
            Supports chess.com &amp; lichess · No login required
          </p>
        </div>

        {/* Right column: decorative board */}
        <div className={styles.heroRight}>
          <ChessBoardDecor />
          <div className={styles.floatBadge} style={{ top: '10%', right: '-12%' }}>
            <span className={styles.badgeNum} style={{ color: '#96bc4b' }}>94%</span>
            <span className={styles.badgeLabel}>White accuracy</span>
          </div>
          <div className={styles.floatBadge} style={{ bottom: '14%', left: '-10%' }}>
            <span className={styles.badgeNum} style={{ color: '#ca3431' }}>61%</span>
            <span className={styles.badgeLabel}>Black accuracy</span>
          </div>
          <div className={styles.floatClassBadge}>
            <span style={{ color: '#1bada6', fontSize: '18px', fontWeight: 700 }}>!!</span>
            <span className={styles.floatClassLabel}>Brilliant move</span>
          </div>
        </div>
      </section>

      {/* ── Feature strip ── */}
      <section className={styles.featureStrip}>
        {[
          { icon: '⚡', title: 'Stockfish 18 WASM', desc: 'World\'s strongest engine — depth 18, fully in-browser' },
          { icon: '♟', title: 'Move Classification', desc: 'Brilliant, Best, Excellent, Good, Inaccuracy, Mistake, Blunder' },
          { icon: '📊', title: 'Accuracy Scores', desc: 'chess.com-style accuracy formula, per player and per move' },
          { icon: '♞', title: 'ECO Openings', desc: 'Detect 200+ named openings via UCI move sequence' },
          { icon: '📈', title: 'Eval Graph', desc: 'Clickable advantage curve — seek any position instantly' },
          { icon: '⌨', title: 'Keyboard Navigation', desc: 'Arrow keys to step through moves; flip board any time' },
        ].map((f) => (
          <div key={f.title} className={styles.featureCard}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <div>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureDesc}>{f.desc}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ── How it works ── */}
      <section className={styles.howSection}>
        <h2 className={styles.howTitle}>How it works</h2>
        <div className={styles.howSteps}>
          {[
            { piece: '♙', step: '01', title: 'Choose a platform', desc: 'Select chess.com or lichess' },
            { piece: '♘', step: '02', title: 'Enter a username',  desc: 'Your last 10 games load instantly' },
            { piece: '♗', step: '03', title: 'Pick any game',     desc: 'Click a card to open the analyser' },
            { piece: '♕', step: '04', title: 'Engine dives deep', desc: 'Stockfish 18 evaluates every position' },
          ].map((s, i) => (
            <React.Fragment key={s.step}>
              <div className={styles.howCard}>
                <div className={styles.howPiece}>{s.piece}</div>
                <div className={styles.howNum}>{s.step}</div>
                <div className={styles.howCardTitle}>{s.title}</div>
                <div className={styles.howCardDesc}>{s.desc}</div>
              </div>
              {i < 3 && <div className={styles.howArrow}>→</div>}
            </React.Fragment>
          ))}
        </div>
        <div className={styles.howCta}>
          <button id="start-analysis-bottom" className={styles.ctaBtn} onClick={openImporter}>
            <span className={styles.ctaPawn}>♙</span>
            Start Analysing
            <span className={styles.ctaArrow}>→</span>
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <Image src="/logo.png" alt="ChessReview" width={18} height={18} className={styles.footerLogo} />
        <span>ChessReview — Powered by Stockfish 18 WASM · chess.com &amp; lichess APIs</span>
      </footer>
    </div>
  );
}
