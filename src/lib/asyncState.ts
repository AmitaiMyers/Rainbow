export type AsyncState<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'ok'; readonly value: T }
  | { readonly status: 'error'; readonly message: string };

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
