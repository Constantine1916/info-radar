import 'antd/dist/reset.css'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '../lib/auth-context'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}
