# ChessReview ♟️

A browser-based chess game analyzer powered by **Stockfish 18**. Import any PGN and get instant, move-by-move analysis with accuracy scores and evaluation graphs — no signup required.

## Features

- **📥 PGN Import** — Paste any PGN string to analyze
- **🤖 Stockfish 18 Analysis** — Full engine evaluation via WebAssembly, runs 100% client-side
- **📊 Move Classification** — Chess.com-style ratings: Brilliant !!, Best, Excellent, Good, Inaccuracy ?!, Mistake ?, Blunder ??
- **🎯 Accuracy Scores** — Per-player accuracy using chess.com's logistic sigmoid formula
- **📈 Evaluation Graph** — Centipawn progression chart across the entire game
- **⚖️ Eval Bar** — Real-time position advantage indicator
- **🧠 Coach Review** — Highlights mistakes and critical moments
- **♟️ Opening Detection** — Identifies opening names and variations
- **🎨 Interactive Board** — Step through moves with full move controls

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Board UI:** react-chessboard
- **Game Logic:** chess.js
- **Engine:** Stockfish 18 (WebAssembly) — client-side only, no server required
Contributions are welcome! Feel free to open issues or submit pull requests.
Site Link - https://chessreview-f4yv.onrender.com
