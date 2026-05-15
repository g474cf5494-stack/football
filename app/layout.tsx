import "./globals.css";

export const metadata = {
  title: "Football Intelligence Dashboard",
  description:
    "Transfer rumours, market values, wages, stats and squad planning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
