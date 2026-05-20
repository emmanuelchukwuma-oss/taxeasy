import "./globals.css";

export const metadata = {
  title: "TaxEasy — Pay tax from your bank statement",
  description:
    "A mobile-first MVP for Nigerian taxpayers to upload bank statements, calculate tax, pay, and get verifiable proof.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
