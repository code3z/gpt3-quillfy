import { Html, Head, Main, NextScript } from "next/document"
import Script from "next/script"

export default function Document() {
  return (
    <Html>
      <Head>
        <meta charSet="utf-8" />
        <Script type="text/javascript" strategy="afterInteractive">
          {`var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/63d6cb9a4742512879104747/1gnvgmkva';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();`}
        </Script>
        <span
          dangerouslySetInnerHTML={{
            __html: `<script
          async
          src="https://cdn.volument.com/v1/volument-full.js"
          token={"35b16d2b76"}
        ></script>`,
          }}
        ></span>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
