import './App.css'
import Hero from '../components/hero.tsx'
import Usage from '../components/usage.tsx'
import Footer from '../components/footer.tsx'

function App() {
  return (
    <>
      <h3>Finn Skin Renderer</h3>
      <Hero />
      <hr />
      <Usage />
      <svg width="0" height="0">
        <filter id="blur-and-scale" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blurred" />
          <feColorMatrix type="saturate" in="blurred" values="10" />
          <feComposite in="SourceGraphic" operator="over" />
        </filter>
      </svg>
      <Footer />
    </>
  )
}

export default App
