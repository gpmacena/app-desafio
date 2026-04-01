import { NavLink, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/challenge', icon: '🏋️', label: 'Desafio' },
  { path: '/feed', icon: '💬', label: 'Feed' },
  { path: '/ranking', icon: '🏆', label: 'Ranking' },
  { path: '/diary', icon: '📓', label: 'Diário' },
  { path: '/running', icon: '🏃', label: 'Corrida' },
  { path: '/weight', icon: '⚖️', label: 'Peso' },
  { path: '/calendar', icon: '📅', label: 'Agenda' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <div className="max-w-[680px] mx-auto flex items-center justify-around py-1.5 px-1">
        {tabs.map((t) => {
          const isActive = location.pathname === t.path;
          return (
            <NavLink
              key={t.path}
              to={t.path}
              className="flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg transition-colors"
            >
              <span className="text-lg leading-none">{t.icon}</span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {t.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
