import type { EndpointDefinition, MaybePromise } from "./types.js"

export interface AuthRequest {
  readonly endpoint: EndpointDefinition
  readonly url: URL
  readonly baseUrl: string
  readonly headers: Headers
  readonly init: RequestInit
}
/** Header/query/cookie placement, also used to keep credentials out of query-cache keys. */
export interface AuthField {
  readonly in: "header" | "query" | "cookie"
  readonly name: string
}
export interface AuthProvider {
  readonly sensitiveFields?: readonly AuthField[]
  apply(request: AuthRequest): MaybePromise<void>
}
export type TokenSource = string | (() => MaybePromise<string | undefined>)
function isCallback(source: TokenSource): source is Exclude<TokenSource, string> {
  return typeof source === "function"
}
export async function resolveToken(source: TokenSource): Promise<string | undefined> {
  return isCallback(source) ? source() : source
}
function isAuthList(
  value: AuthProvider | readonly AuthProvider[],
): value is readonly AuthProvider[] {
  return Array.isArray(value)
}
export function getAuthProviders(
  auth: AuthProvider | readonly AuthProvider[] | undefined,
): readonly AuthProvider[] {
  return auth === undefined ? [] : isAuthList(auth) ? auth : [auth]
}

export function BearerAuth(token: TokenSource): AuthProvider {
  return {
    async apply({ headers }) {
      const value = await resolveToken(token)
      if (value !== undefined) headers.set("authorization", `Bearer ${value}`)
    },
  }
}
export const StaticBearerAuth = BearerAuth
export function BasicAuth(username: string, password: string): AuthProvider {
  if (username.includes(":")) throw new TypeError("Basic auth usernames cannot contain a colon")
  const value = base64(`${username}:${password}`)
  return {
    apply({ headers }) {
      headers.set("authorization", `Basic ${value}`)
    },
  }
}
export function ApiKeyAuth(key: TokenSource, placement: AuthField): AuthProvider {
  return {
    sensitiveFields: [placement],
    async apply(request) {
      const value = await resolveToken(key)
      if (value === undefined) return
      if (placement.in === "header") request.headers.set(placement.name, value)
      else if (placement.in === "query") request.url.searchParams.set(placement.name, value)
      else
        request.headers.set(
          "cookie",
          [
            request.headers.get("cookie"),
            `${encodeURIComponent(placement.name)}=${encodeURIComponent(value)}`,
          ]
            .filter(Boolean)
            .join("; "),
        )
    },
  }
}
export function CustomAuth(
  apply: AuthProvider["apply"],
  sensitiveFields: readonly AuthField[] = [],
): AuthProvider {
  return sensitiveFields.length ? { apply, sensitiveFields } : { apply }
}
function base64(value: string): string {
  return btoa(
    Array.from(new TextEncoder().encode(value), (byte) => String.fromCharCode(byte)).join(""),
  )
}
function formEncode(value: string): string {
  return new URLSearchParams({ v: value }).toString().slice(2)
}

export interface OAuthClientCredentialsOptions {
  readonly clientId: string
  readonly clientSecret: string
  /** Absolute token endpoint URL, or relative to the client baseUrl. */
  readonly tokenUrl: string
  /** Defaults to an empty scope set. */
  readonly scopes?: readonly string[]
  readonly authentication?: "client_secret_basic" | "client_secret_post"
  readonly fetch?: typeof globalThis.fetch
  readonly refreshSkewSeconds?: number
  readonly timeoutMs?: number
}
interface CachedToken {
  readonly value: string
  readonly expiresAt: number
}
// eslint-disable-next-line anti-slop/no-unknown-parameters -- Parse the token endpoint JSON at its network boundary.
function tokenObject(value: unknown): value is {
  readonly access_token: string
  readonly token_type: string
  readonly expires_in?: number
} {
  if (value === null || typeof value !== "object") return false
  return (
    "access_token" in value &&
    typeof value.access_token === "string" &&
    value.access_token.length > 0 &&
    "token_type" in value &&
    typeof value.token_type === "string" &&
    value.token_type.toLowerCase() === "bearer" &&
    (!("expires_in" in value) ||
      (typeof value.expires_in === "number" &&
        Number.isFinite(value.expires_in) &&
        value.expires_in >= 0))
  )
}
/** Server-side client credentials grant. Cache and in-flight requests are isolated by URL and scope set. */
export function OAuthClientCredentialsAuth(options: OAuthClientCredentialsOptions): AuthProvider {
  const cache = new Map<string, CachedToken>()
  const pending = new Map<string, Promise<CachedToken>>()
  const skew = options.refreshSkewSeconds ?? 30
  const timeout = options.timeoutMs ?? 30_000
  if (!Number.isFinite(skew) || skew < 0 || !Number.isSafeInteger(timeout) || timeout <= 0)
    throw new TypeError(
      "OAuth refresh skew and timeout must be non-negative finite values (timeout must be positive)",
    )
  return {
    async apply(request) {
      const url = new URL(options.tokenUrl, request.baseUrl)
      if (
        url.protocol !== "https:" &&
        !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
      )
        throw new TypeError("OAuth token endpoints must use HTTPS (except local development)")
      if (url.username || url.password || url.hash)
        throw new TypeError("OAuth tokenUrl cannot contain credentials or a fragment")
      const scopes = [...new Set(options.scopes ?? [])].sort()
      const key = JSON.stringify([url.href, scopes])
      let token = cache.get(key)
      if (!token || Date.now() >= token.expiresAt) {
        let inFlight = pending.get(key)
        if (!inFlight) {
          const acquire = async (): Promise<CachedToken> => {
            const body = new URLSearchParams({ grant_type: "client_credentials" })
            if (scopes.length) body.set("scope", scopes.join(" "))
            const headers = new Headers({
              "content-type": "application/x-www-form-urlencoded",
              accept: "application/json",
            })
            if (options.authentication === "client_secret_post") {
              body.set("client_id", options.clientId)
              body.set("client_secret", options.clientSecret)
            } else
              headers.set(
                "authorization",
                `Basic ${base64(`${formEncode(options.clientId)}:${formEncode(options.clientSecret)}`)}`,
              )
            const started = Date.now()
            const response = await (options.fetch ?? globalThis.fetch)(url, {
              method: "POST",
              headers,
              body,
              redirect: "error",
              signal: AbortSignal.timeout(timeout),
            })
            if (!response.ok)
              throw new Error(`OAuth token request failed with HTTP ${response.status}`)
            const payload: unknown = await response.json()
            if (!tokenObject(payload))
              throw new TypeError("OAuth token endpoint returned an invalid bearer-token response")
            // Missing expiry means no persistent cache. Refresh early, bounded to 10% for short-lived tokens.
            const lifetime = (payload.expires_in ?? 0) * 1000
            return {
              value: payload.access_token,
              expiresAt: started + Math.max(0, lifetime - Math.min(skew * 1000, lifetime * 0.1)),
            }
          }
          inFlight = acquire()
            .then((token) => {
              cache.set(key, token)
              return token
            })
            .finally(() => pending.delete(key))
          pending.set(key, inFlight)
        }
        token = await inFlight
      }
      request.headers.set("authorization", `Bearer ${token.value}`)
    },
  }
}
