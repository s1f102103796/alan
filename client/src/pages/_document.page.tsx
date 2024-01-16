import { Head, Html, Main, NextScript } from 'next/document';
import { staticPath } from 'src/utils/$path';
import { APP_TITLE } from 'src/utils/constants';

function Document() {
  return (
    <Html lang="ja">
      <Head>
        <title>{APP_TITLE}</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content={APP_TITLE} />
        <link rel="icon" href={staticPath.favicon_png} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

export default Document;
