import Link from 'next/link'

export default function Home() {
  return (
    <>
      <h1>VOXELHUB</h1>
      <p>Marketplace de impresión 3D on-demand</p>
      <div className="actions">
        <Link href="/cliente">
          <button>Entrar como Cliente</button>
        </Link>
        <Link href="/maker">
          <button>Entrar como Maker</button>
        </Link>
      </div>
    </>
  )
}
