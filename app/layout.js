import './globals.css';

export const metadata = {
  title: '2BOrder Social',
  description: 'Facebook publishing dashboard for 2BOrder',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
