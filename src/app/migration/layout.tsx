import '../../../styles/globals.css'

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body>
        <div style={{display: "flex", flexFlow: "column", height: "100vh", overflow: "auto"}}>{children}</div>
        </body>
        </html>
    )
}

