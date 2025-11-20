import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <main>
      <div className="container">
        <Component {...pageProps} />
      </div>
    </main>
  )
}
