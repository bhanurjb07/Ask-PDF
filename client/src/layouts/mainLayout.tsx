import { NavLink, Outlet } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  ['nav-link', isActive ? 'nav-link-active' : 'nav-link-inactive'].join(' ');

function MainLayout() {
  return (
    <div className="min-h-screen">
      <header className="nav-header">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <p className="font-display text-lg font-semibold tracking-tight text-ink-900 dark:text-ink-50">
            RAG Doc QA
          </p>
          <nav className="flex items-center gap-4">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/chat" className={linkClass}>
              Chat
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
