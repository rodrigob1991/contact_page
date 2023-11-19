import '../../styles/globals.css'
import type { AppProps } from 'next/app'
import { Analytics } from '@vercel/analytics/react'
import { Container, Footer } from '../components/home/Layout'

function MyApp({Component, pageProps}: AppProps) {
  return <>
         <Container>
         <Component {...pageProps} />
         <Analytics/>
         </Container>
         </>
}

export default MyApp
