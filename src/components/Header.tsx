import { USE_MOCK, AUTH_ENABLED, portalUrl } from '../config'
import { AuthUserMenu } from './AuthUserMenu'

export type Tab = 'analysis' | 'chat'

export function Header({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <header className="topbar">
      <a className="brand" href={portalUrl()}>
        <span className="brand-dot" />
        <span className="brand-name">AI-for All</span>
        <span className="brand-sep">·</span>
        <span className="brand-app">Construction</span>
      </a>
      <nav className="tabs">
        <button className={`tab ${tab === 'analysis' ? 'tab-active' : ''}`} onClick={() => onTab('analysis')}>
          Analysis
        </button>
        <button className={`tab ${tab === 'chat' ? 'tab-active' : ''}`} onClick={() => onTab('chat')}>
          Chat
        </button>
      </nav>
      <div className="topbar-right">
        {USE_MOCK && <span className="mock-badge" title="Running against in-browser mock data">DEMO DATA</span>}
        {AUTH_ENABLED ? (
          <AuthUserMenu />
        ) : (
          <span className="avatar" title="Dev mode (no login)">AA</span>
        )}
      </div>
    </header>
  )
}
