import { ServiceUnavailableException } from '@nestjs/common';

/**
 * Detects connectivity / infrastructure failures (e.g. Supabase unreachable)
 * so they can be surfaced as 5xx instead of being mistaken for client errors.
 */
export function isUpstreamNetworkError(error: unknown): boolean {
  if (!error) return false;
  const err = error as { name?: string; status?: number; message?: string };
  const message = (err.message ?? '').toLowerCase();

  return (
    err.name === 'AuthRetryableFetchError' ||
    err.status === 0 ||
    message.includes('fetch failed') ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('getaddrinfo') ||
    message.includes('etimedout') ||
    message.includes('socket hang up')
  );
}

/**
 * Throws a 503 when the error is an upstream connectivity failure.
 * Returns normally otherwise, so the caller can map domain errors itself.
 */
export function throwIfUpstreamUnavailable(error: unknown): void {
  if (isUpstreamNetworkError(error)) {
    throw new ServiceUnavailableException(
      'Upstream service is temporarily unavailable. Please try again later.',
    );
  }
}
