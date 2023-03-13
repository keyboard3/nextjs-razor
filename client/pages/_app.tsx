import '@/styles/test.module.css'
import type { AppProps } from 'next/app'
import { compile, compilePrint } from '@/template-helper/compile';
if (typeof window !== "undefined") {
  global.compile = compile as any;
  global.compilePrint = compilePrint;
}
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
