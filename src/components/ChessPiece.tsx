import React from 'react';
import { PieceColor, PieceType } from '../types/chess';

interface ChessPieceProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({ type, color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';

  // White piece styling: Pearl ivory with subtle shading and dark contour
  const fillWhite = 'url(#white-piece-grad)';
  const strokeWhite = '#475569';
  const highlightWhite = '#FFFFFF';

  // Black piece styling: Sleek dark obsidian with gentle rim gradient and crisp stroke
  const fillBlack = 'url(#black-piece-grad)';
  const strokeBlack = '#0F172A';
  const highlightBlack = '#94A3B8';

  const fill = isWhite ? fillWhite : fillBlack;
  const stroke = isWhite ? strokeWhite : strokeBlack;
  const highlight = isWhite ? highlightWhite : highlightBlack;

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} pointer-events-none drop-shadow-md select-none transition-transform duration-150`}
    >
      <defs>
        <radialGradient id="white-piece-grad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </radialGradient>
        <radialGradient id="black-piece-grad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#090D16" />
        </radialGradient>
        <filter id="piece-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter="url(#piece-shadow)">
        {type === 'p' && (
          // PAWN
          <g>
            <path
              d="M30 84 C30 80 34 78 40 76 L40 60 C36 58 35 54 35 50 C35 44 40 40 43 38 C38 34 38 24 43 19 C48 14 52 14 57 19 C62 24 62 34 57 38 C60 40 65 44 65 50 C65 54 64 58 60 60 L60 76 C66 78 70 80 70 84 L72 87 C72 89 70 90 66 90 L34 90 C30 90 28 89 28 87 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Subtle inner highlight */}
            <circle cx="46" cy="24" r="5" fill={highlight} opacity={isWhite ? '0.7' : '0.2'} />
            <path
              d="M42 64 L42 74"
              stroke={highlight}
              strokeWidth="2"
              opacity={isWhite ? '0.6' : '0.2'}
              strokeLinecap="round"
            />
          </g>
        )}

        {type === 'n' && (
          // KNIGHT
          <g>
            <path
              d="M30 86 C30 82 34 80 39 79 L39 67 C36 67 31 63 30 58 C28 48 31 38 37 32 C35 27 36 21 40 18 C44 15 50 16 53 18 C57 15 63 15 67 18 C71 22 71 28 72 34 C74 44 76 58 74 68 C74 74 72 79 70 80 C68 81 67 85 67 86 L69 88 C69 90 67 91 63 91 L33 91 C29 91 28 90 28 88 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Mane & ear contour */}
            <path
              d="M37 32 C41 28 48 27 52 32 C56 36 53 45 42 46 C35 47 31 54 33 60 C35 66 42 66 46 64 C52 61 63 56 66 43"
              fill="none"
              stroke={stroke}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Eye */}
            <circle cx="44" cy="29" r="2.5" fill={isWhite ? '#1E293B' : '#F8FAFC'} />
            {/* Nostril */}
            <circle cx="33" cy="46" r="1.5" fill={stroke} />
          </g>
        )}

        {type === 'b' && (
          // BISHOP
          <g>
            {/* Mitre cross */}
            <path d="M50 12 L50 20 M46 16 L54 16" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
            <path
              d="M30 86 C30 82 34 80 40 78 L40 64 C35 60 32 52 32 44 C32 32 40 22 50 22 C60 22 68 32 68 44 C68 52 65 60 60 64 L60 78 C66 80 70 82 70 86 L72 88 C72 90 70 91 66 91 L34 91 C30 91 28 90 28 88 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Bishop slit cut */}
            <path
              d="M48 30 C53 36 58 42 63 45"
              stroke={stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="50" cy="50" r="3" fill={highlight} opacity={isWhite ? '0.7' : '0.2'} />
            <path d="M38 72 L62 72" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {type === 'r' && (
          // ROOK
          <g>
            <path
              d="M28 86 C28 82 32 80 38 78 L38 52 C35 50 33 46 33 40 L31 28 L40 28 L40 34 L46 34 L46 28 L54 28 L54 34 L60 34 L60 28 L69 28 L67 40 C67 46 65 50 62 52 L62 78 C68 80 72 82 72 86 L74 88 C74 90 72 91 68 91 L32 91 C28 91 26 90 26 88 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Archway window */}
            <path
              d="M45 74 L45 62 C45 59 47 57 50 57 C53 57 55 59 55 62 L55 74 Z"
              fill={isWhite ? '#94A3B8' : '#0B0F19'}
              stroke={stroke}
              strokeWidth="1.5"
            />
            <path d="M36 46 L64 46" stroke={stroke} strokeWidth="2" />
          </g>
        )}

        {type === 'q' && (
          // QUEEN
          <g>
            {/* Crown pearls */}
            <circle cx="28" cy="24" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
            <circle cx="39" cy="18" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
            <circle cx="50" cy="15" r="3.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
            <circle cx="61" cy="18" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
            <circle cx="72" cy="24" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />

            <path
              d="M28 27 L33 46 C31 52 33 60 38 64 L38 78 C32 80 28 82 28 86 L26 88 C26 90 28 91 32 91 L68 91 C72 91 74 90 74 88 L72 86 C72 82 68 80 62 78 L62 64 C67 60 69 52 67 46 L72 27 L61 36 L50 22 L39 36 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="52" r="5" fill={highlight} opacity={isWhite ? '0.7' : '0.2'} />
            <path d="M36 74 L64 74" stroke={stroke} strokeWidth="2" />
          </g>
        )}

        {type === 'k' && (
          // KING
          <g>
            {/* Regal cross on top */}
            <path d="M50 10 L50 22 M44 15 L56 15" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
            <path
              d="M32 86 C32 82 36 80 40 78 L40 64 C34 58 31 50 31 40 C31 29 39 23 50 23 C61 23 69 29 69 40 C69 50 66 58 60 64 L60 78 C64 80 68 82 68 86 L70 88 C70 90 68 91 64 91 L36 91 C32 91 30 90 30 88 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Royal Crown arches */}
            <path
              d="M35 38 C42 32 58 32 65 38 M35 48 C42 42 58 42 65 48"
              stroke={stroke}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="50" cy="55" r="4" fill={highlight} opacity={isWhite ? '0.7' : '0.2'} />
            <path d="M38 74 L62 74" stroke={stroke} strokeWidth="2" />
          </g>
        )}
      </g>
    </svg>
  );
};
