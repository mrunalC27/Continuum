export default function Logo({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="sphereGrad" cx="40%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="#a8d4ff" />
                    <stop offset="40%" stopColor="#4f8ef7" />
                    <stop offset="100%" stopColor="#1a3a8f" />
                </radialGradient>
                <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4f8ef7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#4f8ef7" stopOpacity="0" />
                </radialGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id="orbitGlow">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* outer glow */}
            <circle cx="60" cy="60" r="55" fill="url(#glowGrad)" />

            {/* orbit ring 1 — tilted left */}
            <ellipse cx="60" cy="60" rx="54" ry="20"
                stroke="#4f8ef7" strokeWidth="2.5"
                strokeOpacity="0.9"
                transform="rotate(-40 60 60)"
                fill="none" filter="url(#orbitGlow)" />

            {/* orbit ring 2 — tilted right */}
            <ellipse cx="60" cy="60" rx="52" ry="18"
                stroke="#4f8ef7" strokeWidth="2.5"
                strokeOpacity="0.9"
                transform="rotate(35 60 60)"
                fill="none" filter="url(#orbitGlow)" />

            {/* center sphere */}
            <circle cx="60" cy="60" r="16"
                fill="url(#sphereGrad)"
                filter="url(#glow)" />

            {/* sphere highlight */}
            <circle cx="54" cy="54" r="5"
                fill="white" opacity="0.35" />

            {/* star sparkles */}
            {/* top right sparkle */}
            <g transform="translate(88, 22)" opacity="0.9">
                <line x1="0" y1="-6" x2="0" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-6" y1="0" x2="6" y2="0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-3" y1="-3" x2="3" y2="3" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
                <line x1="3" y1="-3" x2="-3" y2="3" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
            </g>

            {/* bottom left small sparkle */}
            <g transform="translate(26, 88)" opacity="0.6">
                <line x1="0" y1="-4" x2="0" y2="4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="-4" y1="0" x2="4" y2="0" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            </g>

            {/* top left tiny dot */}
            <circle cx="30" cy="28" r="2" fill="white" opacity="0.5" />

            {/* bottom right tiny dot */}
            <circle cx="94" cy="90" r="1.5" fill="#a8c8ff" opacity="0.6" />
        </svg>
    );
}