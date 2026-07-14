// src/pages/Home.jsx
import Hero from '../components/Hero'
import PartnersMarquee from '../components/PartnersMarquee'
import HomeRecommendations from '../components/HomeRecommendations'
import Seo from '../components/Seo'
import JsonLd from '../components/JsonLd'
import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION, LOGO_URL } from '../lib/site'

export default function Home() {
  return (
    <>
      <Seo path="/" />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          logo: LOGO_URL,
          description: DEFAULT_DESCRIPTION,
        }}
      />
      <Hero/>
      <PartnersMarquee/>
      <HomeRecommendations/>

    </>
  )
}
