import React from 'react';

export function useIsDesktop(breakpoint = 1024): boolean {
  const [isDesktop, setIsDesktop] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth >= breakpoint : false,
  );
  React.useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);
  return isDesktop;
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg className="brand__logo" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="9" fill="#1a5bd8" />
      <ellipse cx="24" cy="24" rx="21" ry="8" fill="none" stroke="#f58a3c" strokeWidth="2.5" transform="rotate(-28 24 24)" />
      <circle cx="43" cy="17" r="2.6" fill="#f58a3c" />
    </svg>
  );
}

export type TabId = 'today' | 'map' | 'experiments' | 'journey';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'today', label: 'Hôm nay', icon: '⌂' },
  { id: 'map', label: 'Bản đồ', icon: '◎' },
  { id: 'experiments', label: 'Đang thử', icon: '⚗' },
  { id: 'journey', label: 'Hành trình', icon: '📈' },
];

export function BottomNav({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="nav" aria-label="Điều hướng chính">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          aria-current={active === t.id ? 'page' : undefined}
        >
          <span className="nav__icon" aria-hidden="true">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

const SIDE_TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'today', label: 'Khám phá', icon: '⌂' },
  { id: 'map', label: 'Bản đồ', icon: '◎' },
  { id: 'experiments', label: 'Điều đang thử', icon: '⚗' },
  { id: 'journey', label: 'Hành trình', icon: '📈' },
];

export function SideNav({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <aside className="sidenav" aria-label="Điều hướng chính">
      <div className="sidenav__brand">
        <Logo size={34} />
        <span>Life Lab</span>
      </div>
      <nav className="sidenav__links">
        {SIDE_TABS.map((t) => (
          <button
            key={t.id}
            className="sidenav__link"
            onClick={() => onChange(t.id)}
            aria-current={active === t.id ? 'page' : undefined}
          >
            <span className="sidenav__icon" aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
      <p className="sidenav__footnote">Những câu hỏi nhỏ tạo ra thay đổi lớn.</p>
    </aside>
  );
}

export function Spinner({ label = 'Đang tải' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <div className="sr-only">{label}</div>
    </div>
  );
}

export function Typing() {
  return (
    <div className="msg msg--assistant" aria-label="Life Lab đang soạn phản hồi">
      <span className="typing" aria-hidden="true"><span /><span /><span /></span>
    </div>
  );
}

export function OrbitGraphic() {
  return (
    <svg viewBox="0 0 320 220" width="100%" height="200" role="img" aria-label="Bản đồ các chủ đề cuộc sống">
      <g fill="none" stroke="#9db4e8" strokeDasharray="3 5" strokeWidth="1.3">
        <ellipse cx="160" cy="110" rx="120" ry="70" />
        <ellipse cx="160" cy="110" rx="70" ry="95" transform="rotate(30 160 110)" />
      </g>
      <Bubble x={160} y={46} r={34} fill="#fde4d0" label="Công việc" icon="💼" />
      <Bubble x={78} y={140} r={30} fill="#e7ddfb" label="Mối quan hệ" icon="👥" />
      <Bubble x={238} y={140} r={30} fill="#d9f0c9" label="Bản thân" icon="🧭" />
      <g>
        <circle cx="160" cy="178" r="22" fill="#fff" stroke="#ece6dc" />
        <text x="160" y="183" textAnchor="middle" fontSize="18" fill="#5a6b84">+</text>
      </g>
    </svg>
  );
}

function Bubble({ x, y, r, fill, label, icon }: { x: number; y: number; r: number; fill: string; label: string; icon: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={fill} />
      <text x={x} y={y - 2} textAnchor="middle" fontSize="16">{icon}</text>
      <text x={x} y={y + 16} textAnchor="middle" fontSize="10.5" fill="#1a2b4a" fontWeight="600">{label}</text>
    </g>
  );
}

/** Canvas bản đồ lớn cho desktop — tâm "Điều quan trọng lúc này" (concept 02). */
export function MapCanvasLarge({ onPick }: { onPick?: (topic: string) => void }) {
  const node = (x: number, y: number, rx: number, ry: number, fill: string, title: string, sub: string, icon: string) => (
    <g style={{ cursor: 'pointer' }} onClick={() => onPick?.(title)} role="button" aria-label={title}>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={fill} />
      <text x={x} y={y - 6} textAnchor="middle" fontSize="22">{icon}</text>
      <text x={x} y={y + 16} textAnchor="middle" fontSize="16" fontWeight="700" fill="#1a2b4a">{title}</text>
      <text x={x} y={y + 36} textAnchor="middle" fontSize="12.5" fill="#5a6b84">{sub}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 760 440" width="100%" height="100%" role="img" aria-label="Bản đồ chủ đề cuộc sống">
      <g fill="none" stroke="#9db4e8" strokeDasharray="3 6" strokeWidth="1.3">
        <path d="M250 150 C 330 110, 430 110, 480 170" />
        <path d="M250 290 C 340 330, 430 330, 500 300" />
        <path d="M380 150 L 380 290" />
      </g>
      {node(205, 150, 115, 70, '#fde4d0', 'Công việc', 'Chủ động thời gian', '💼')}
      {node(560, 165, 115, 72, '#e7ddfb', 'Mối quan hệ', 'Một chuyện muốn nói', '👥')}
      {node(205, 320, 110, 70, '#d9f0c9', 'Bản thân', 'Điều mình cần', '🧭')}
      <g>
        <ellipse cx="400" cy="220" rx="110" ry="66" fill="#1a5bd8" />
        <text x="400" y="214" textAnchor="middle" fontSize="22" fill="#fff">✦</text>
        <text x="400" y="238" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">Điều quan trọng</text>
        <text x="400" y="258" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">lúc này</text>
      </g>
      <g style={{ cursor: 'pointer' }} onClick={() => onPick?.('Chuyện mới')} role="button" aria-label="Thêm chuyện mới">
        <circle cx="600" cy="330" r="55" fill="#fff" stroke="#ece6dc" strokeWidth="1.5" />
        <text x="600" y="326" textAnchor="middle" fontSize="22" fill="#5a6b84">+</text>
        <text x="600" y="348" textAnchor="middle" fontSize="13.5" fontWeight="600" fill="#1a2b4a">Chuyện mới</text>
      </g>
    </svg>
  );
}
