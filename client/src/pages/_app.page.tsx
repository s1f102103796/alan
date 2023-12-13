import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import '../styles/chat-ui-kit.css';
import '../styles/globals.css';
import { AuthLoader } from './@components/AuthLoader';

function MyApp({ Component, pageProps }: AppProps) {
  const SafeHydrate = dynamic(() => import('../components/SafeHydrate'), { ssr: false });

  return (
    <>
      <SafeHydrate>
        <Component {...pageProps} />
      </SafeHydrate>
      <AuthLoader />
    </>
  );
}

export default MyApp;
