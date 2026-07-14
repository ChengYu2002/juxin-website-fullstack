// src/app/App.jsx
import Header from '../components/Header'
import Footer from '../components/Footer'
import AppRouter from './router'

export default function App() {
  return (
    <>
      <Header />
      <div style={{ minHeight: '70vh' }}>
        <AppRouter />
      </div>
      <Footer />
    </>
  )
}
