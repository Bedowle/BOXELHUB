import Link from 'next/link'

export default function Home() {
  return (
    <section className="recommendations">
      <div className="card">
        <img src="/models/model1.png" alt="Modelo 1" />
        <h3>Figura de Arte</h3>
      </div>
      <div className="card">
        <img src="/models/model2.png" alt="Modelo 2" />
        <h3>Accesorio para Hogar</h3>
      </div>
      <div className="card">
        <img src="/models/model3.png" alt="Modelo 3" />
        <h3>Objeto de Videojuego</h3>
      </div>
    </section>
  )
}
