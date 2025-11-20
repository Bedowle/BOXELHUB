import Link from 'next/link'

export default function Navbar() {
  return (
    <header>
      <div className="logo">
        <Link href="/">Voxelhub</Link>
      </div>
      <div className="search-bar">
        <input type="text" placeholder="Buscar modelos..." />
      </div>
      <div className="actions">
        <Link href="/cliente">
          <button>Registro / Iniciar Sesión</button>
        </Link>
        <Link href="/maker">
          <button>Tengo una Impresora 3D</button>
        </Link>
      </div>
    </header>
  )
}
