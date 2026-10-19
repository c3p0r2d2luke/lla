import './globals.css';

export const metadata = {
  title: 'LLA Changelog',
  description: 'The official changelog of LLA',
};

export default function RootLayout({ children }) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <footer>All rights reserved © {currentYear}</footer>
      </body>
    </html>
  );
}
