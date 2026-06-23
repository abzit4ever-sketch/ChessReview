import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChessReview — Analyse Games with Stockfish 18',
  description:
    'Import chess games from chess.com and lichess and get Stockfish 18 engine analysis — move classification, accuracy scores, eval bar, and opening detection.',
  keywords: ['chess', 'chess analyser', 'stockfish 18', 'chess.com', 'lichess', 'game review', 'chess accuracy'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </body>
    </html>
  );
}
