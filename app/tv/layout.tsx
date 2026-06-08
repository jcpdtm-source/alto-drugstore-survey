export default function TvLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #111827; }
      `}</style>
      {children}
    </>
  )
}
