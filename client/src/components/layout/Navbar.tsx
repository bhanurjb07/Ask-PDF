import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  ['nav-link', isActive ? 'nav-link-active' : 'nav-link-inactive'].join(' ');

export default function Navbar() {
  const { darkMode, toggleDarkMode, setSidebarOpen } = useAppContext();

  return (
    <header className="nav-header">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn-outline lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            Menu
          </button>
          <div>
            <p className="font-display text-xl tracking-tight text-ink-900 dark:text-ink-50">
              RAG Doc QA
            </p>
            <p className="text-xs text-ink-500 dark:text-ink-300">Ask your documents</p>
          </div>
        </div>

        <nav className="flex items-center gap-2" aria-label="Primary">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/chat" className={linkClass}>
            Chat
          </NavLink>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="btn-outline"
            aria-label="Toggle dark mode"
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </nav>
      </div>
    </header>
  );
}
