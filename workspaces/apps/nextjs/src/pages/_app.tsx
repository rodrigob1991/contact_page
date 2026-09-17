import { Analytics } from '@vercel/analytics/react'
import type { AppProps } from 'next/app'
import '../../styles/globals.css'
import { Container } from '../components/home/Layout'

function MyApp({Component, pageProps}: AppProps) {
  return <Container>
         <Component {...pageProps} />
         <Analytics/>
         </Container>
}

export default MyApp
