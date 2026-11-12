import "./globals.css";
import Script from "next/script";
import { Poppins, Inter, Roboto, Montserrat } from "next/font/google";
import type { Metadata } from "next";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  icons: {
    icon: "data:,",
    shortcut: "data:,",
  },
  verification: {
    other: {
      "facebook-domain-verification": "qatcv7wbd8705sc0rxiejrr9onfom1",
    },
  },
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
  preload: false,
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-roboto",
  preload: false,
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-montserrat",
  preload: false,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link
          rel="preconnect"
          href="https://k6-e4e4123be8e54363900a90353991ca93.ecs.us-west-1.on.aws"
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

              ttq.load('DAUK9G3C77U88MSODQM0');

              function guardarTtclid() {
                var params = new URLSearchParams(w.location.search);
                var ttclid = params.get('ttclid');
                if (ttclid) {
                  var expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
                  d.cookie = '_ttclid=' + encodeURIComponent(ttclid) + '; expires=' + expires + '; path=/; SameSite=Lax';
                }
              }

              guardarTtclid();
              ttq.page();

            }(window, document, 'ttq');
          `}
        </Script>

        {/* SCRIPT BASE DE META (SOLO CARGA LA LIBRERÍA) */}
        <Script id="meta-pixel-base" strategy="afterInteractive">
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
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}