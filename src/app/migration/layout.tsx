import '../../../styles/globals.css'

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body style={{display: "flex", flexFlow: "column", height: "100vh", overflow: "hidden"}}>{children}</body>
        </html>
    )
}

