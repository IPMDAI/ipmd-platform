/** Avatar illustré de l'assistante d'admission IPMD (femme souriante + casque). */
export function AssistantAvatar({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Assistante IPMD" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="ipmd-assistant-clip"><circle cx="32" cy="32" r="32" /></clipPath>
      </defs>
      <g clipPath="url(#ipmd-assistant-clip)">
        {/* Fond doux */}
        <rect width="64" height="64" fill="#fdeede" />
        {/* Épaules / haut rouge IPMD */}
        <path d="M12 64 Q32 46 52 64 Z" fill="#e01228" />
        <path d="M22 64 Q32 54 42 64 Z" fill="#0b0b0d" opacity="0.12" />
        {/* Cou */}
        <rect x="27" y="42" width="10" height="12" rx="5" fill="#9a6440" />
        {/* Cheveux (volume arrière) */}
        <path d="M15 34 Q14 12 32 12 Q50 12 49 34 L49 46 Q47 42 44 42 L44 26 Q42 19 32 19 Q22 19 20 26 L20 42 Q17 42 15 46 Z" fill="#211a1a" />
        {/* Visage */}
        <ellipse cx="32" cy="31" rx="12.5" ry="14.5" fill="#a86b44" />
        {/* Frange / cheveux avant */}
        <path d="M19.5 27 Q20 15 32 15 Q44 15 44.5 27 Q39 21 32 21 Q25 21 19.5 27 Z" fill="#211a1a" />
        {/* Sourcils */}
        <path d="M24 27.5 Q26.6 26 29.2 27.6" stroke="#211a1a" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <path d="M34.8 27.6 Q37.4 26 40 27.5" stroke="#211a1a" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        {/* Yeux */}
        <ellipse cx="26.6" cy="31" rx="2" ry="2.4" fill="#fff" />
        <circle cx="26.8" cy="31.3" r="1.25" fill="#2b1d12" />
        <circle cx="27.2" cy="30.8" r="0.4" fill="#fff" />
        <ellipse cx="37.4" cy="31" rx="2" ry="2.4" fill="#fff" />
        <circle cx="37.2" cy="31.3" r="1.25" fill="#2b1d12" />
        <circle cx="37.6" cy="30.8" r="0.4" fill="#fff" />
        {/* Nez */}
        <path d="M32 32 Q33 35 31.4 36" stroke="#7c4f30" strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* Sourire */}
        <path d="M27.5 38.5 Q32 42.5 36.5 38.5" stroke="#7a1322" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        {/* Joues */}
        <circle cx="23.5" cy="36" r="1.8" fill="#d8835c" opacity="0.45" />
        <circle cx="40.5" cy="36" r="1.8" fill="#d8835c" opacity="0.45" />
        {/* Boucles d'oreilles */}
        <circle cx="19.5" cy="35.5" r="1.3" fill="#f3c14b" />
        <circle cx="44.5" cy="35.5" r="1.3" fill="#f3c14b" />
        {/* Casque (assistante) */}
        <path d="M17 31 Q17 14 32 14 Q47 14 47 31" stroke="#e01228" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <rect x="14.5" y="30" width="4.2" height="7.5" rx="2.1" fill="#e01228" />
        <rect x="45.3" y="30" width="4.2" height="7.5" rx="2.1" fill="#e01228" />
        {/* Micro */}
        <path d="M45.3 36.5 Q45 42 37 42.5" stroke="#e01228" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <circle cx="36.4" cy="42.6" r="1.4" fill="#e01228" />
      </g>
    </svg>
  );
}
