import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { useEffect, type ReactNode } from 'react'
import { setAccessTokenGetter } from '../api/authToken'
import { AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_DOMAIN, AUTH_CONFIGURED } from '../config'

function TokenBridge() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()

  useEffect(() => {
    if (!isAuthenticated) {
      setAccessTokenGetter(null)
      return
    }
    setAccessTokenGetter(() =>
      getAccessTokenSilently({
        authorizationParams: { audience: AUTH0_AUDIENCE },
      }),
    )
    return () => setAccessTokenGetter(null)
  }, [getAccessTokenSilently, isAuthenticated])

  return null
}

export function AuthShell({ children }: { children: ReactNode }) {
  if (!AUTH_CONFIGURED) return <>{children}</>

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
      {children}
    </Auth0Provider>
  )
}
