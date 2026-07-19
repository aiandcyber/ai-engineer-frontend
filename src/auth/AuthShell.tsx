import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { useEffect, type ReactNode } from 'react'
import { setAccessTokenGetter } from '../api/authToken'
import { AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_DOMAIN, AUTH_CONFIGURED } from '../config'
import { AuthActionProvider } from './useRequireAuth'

function TokenBridge() {
  const { getAccessTokenSilently, isAuthenticated, user } = useAuth0()

  useEffect(() => {
    if (!isAuthenticated) {
      setAccessTokenGetter(null)
      window.dispatchEvent(new CustomEvent('auth-session-changed'))
      return
    }
    setAccessTokenGetter(() =>
      getAccessTokenSilently({
        authorizationParams: { audience: AUTH0_AUDIENCE },
      }),
    )
    window.dispatchEvent(new CustomEvent('auth-session-changed', {
      detail: { identity: user?.sub ?? null },
    }))
    return () => setAccessTokenGetter(null)
  }, [getAccessTokenSilently, isAuthenticated, user?.sub])

  return null
}

export function AuthShell({ children }: { children: ReactNode }) {
  if (!AUTH_CONFIGURED) {
    return <AuthActionProvider>{children}</AuthActionProvider>
  }

  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: AUTH0_AUDIENCE,
      }}
      cacheLocation="localstorage"
    >
      <TokenBridge />
      <AuthActionProvider>{children}</AuthActionProvider>
    </Auth0Provider>
  )
}
