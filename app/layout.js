export const metadata = {
  title: 'Dental Practice Management System',
  description: 'AI-powered dental practice management software',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
