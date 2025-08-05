type MonacoLoader = {
  config: (x: { paths?: { vs?: string } }) => void } &
  ((e: string[], cb: (value: unknown) => void) => void)

declare const require: MonacoLoader