import './globals.css'

export const metadata = {
  title: 'Safe City AI',
  description: 'Transforming cities into safer communities',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}