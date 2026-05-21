import "./globals.css";

export const metadata = {
  title: "TaxEasy — Pay Your 2026 Tax in 90 Seconds",
  description:
    "Nigeria's smartest tax filing app. Upload your bank statement, calculate your tax under the new 2026 Nigeria Tax Act, pay securely, and download an official Tax Clearance Certificate — all in under 90 seconds.",
  keywords: "Nigeria tax, tax clearance certificate, TCC, PAYE, personal income tax, 2026 tax act, bank statement tax",
  openGraph: {
    title: "TaxEasy — Pay Your 2026 Tax in 90 Seconds",
    description: "Upload your bank statement, see what you owe under the new Nigeria Tax Act 2025, and get instant proof.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#064e3b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-NG">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
