import "./globals.css"; // <- import global CSS here

export const metadata = {
  title: "Car Video Analysis",
  description: "Analyze car orientation from videos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
