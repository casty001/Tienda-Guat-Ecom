import "./globals.css";
import Script from "next/script";
import { Poppins } from "next/font/google";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* 👇 Google Analytics */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-0P4TQEPSKM"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-0P4TQEPSKM');
            `,
          }}
        />
      </head>
      <body className={poppins.className}>
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;
              var ttq=w[t]=w[t]||[];

              ttq.methods=[
                "page","track","identify",
                "instances","debug","on","off",
                "once","ready","alias","group",
                "enableCookie","disableCookie",
                "holdConsent","revokeConsent",
                "grantConsent"
              ];

              ttq.setAndDefer=function(t,e){
                t[e]=function(){
                  t.push([e].concat(
                    Array.prototype.slice.call(arguments,0)
                  ))
                }
              };

              for(var i=0;i<ttq.methods.length;i++){
                ttq.setAndDefer(ttq,ttq.methods[i]);
              }

              ttq.load=function(e){
                var s=d.createElement("script");

                s.async=!0;

                s.src="https://analytics.tiktok.com/i18n/pixel/events.js?sdkid="+e+"&lib="+t;

                var x=d.getElementsByTagName("script")[0];

                x.parentNode.insertBefore(s,x);
              };

              ttq.load('D8E1PFBC77UANKFS69IG');

              ttq.page();

            }(window, document, 'ttq');
          `}
        </Script>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;

            n.push=n;
            n.loaded=!0;
            n.version='2.0';
            n.queue=[];

            t=b.createElement(e);
            t.async=!0;
            t.src=v;

            s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}

            (window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');

            fbq('init', '904323315400372');

            fbq('track', 'PageView');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}