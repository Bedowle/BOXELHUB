import '../styles/globals.css'
import Navbar from '../components/Navbar'
import Categories from '../components/Categories'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <Categories />
      <main>
        <div className="container">
          <Component {...pageProps} />
        </div>
      </main>
    </>
  )
}
