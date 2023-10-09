import { APP_TITLE } from 'commonConstantsWithClient';
import { Head, Html, Main, NextScript } from 'next/document';

function Document() {
  return (
    <Html lang="ja">
      <Head>
        <title>{APP_TITLE}</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content={APP_TITLE} />
        <link rel="icon" href="favicon.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

export default Document;
