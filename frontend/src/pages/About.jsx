// src/pages/About.jsx
import { Link } from 'react-router-dom'
import PartnersMarquee from '../components/PartnersMarquee'
import Certifications from '../components/Certifications'
import Seo from '../components/Seo'

const COMPANY = {
  name: 'JUXIN',
  established: '2005',
  location: 'China',
  exportCountries: 60,
  primaryRegions: ['Europe', 'South Korea', 'Southeast Asia', 'North America', 'Russia'],
  categories: ['Shopping Trolley', 'Utility Cart', 'Camping Wagon'],
}

const WHAT_WE_DO = [
  'Factory-direct trolley manufacturing',
  'Retail-ready product solutions',
  'OEM / ODM based on existing models',
  'Export-oriented production',
]

const CAPABILITY = [
  'Multiple trolley assembly lines',
  'Container-level order support (20GP / 40HQ)',
  'In-house assembly & packing',
  'Export-oriented workflow and QC',
  'Stable long-term manufacturing capacity',
]

const CLIENT_TYPES = ['Retailers', 'Importers', 'Wholesalers']

const CAPABILITY_MEDIA = [
  {
    title: 'Assembly Lines 2',
    image: 'https://img.juxin-manufacturing.com/website/production_line2.webp',
  },
  {
    title: 'Assembly Lines 1',
    image: 'https://img.juxin-manufacturing.com/website/production_line1.webp',
  },
  {
    title: 'Container Loading',
    desc: 'Container-level order execution with practical loading experience.',
    image: 'https://img.juxin-manufacturing.com/website/container_loading.webp',
  },
]

function Container({ children }) {
  return <div className="mx-auto w-full max-w-6xl px-6 lg:px-8">{children}</div>
}

function Kicker({ children, dark = false }) {
  return (
    <p
      className={[
        'text-xs font-semibold tracking-[0.22em] uppercase',
        dark ? 'text-white/70' : 'text-slate-500',
      ].join(' ')}
    >
      {children}
    </p>
  )
}

function SectionTitle({ kicker, title, desc, dark = false }) {
  return (
    <div className="max-w-3xl">
      {kicker ? <Kicker dark={dark}>{kicker}</Kicker> : null}
      <h2
        className={[
          'mt-1 text-4xl sm:text-4xl lg:text-4xl font-semibold tracking-tight',
          dark ? 'text-white' : 'text-slate-900',
        ].join(' ')}
      >
        {title}
      </h2>
      {desc ? (
        <p
          className={[
            'mt-4 text-[15px] sm:text-sm leading-7',
            dark ? 'text-white/70' : 'text-slate-600',
          ].join(' ')}
        >
          {desc}
        </p>
      ) : null}
    </div>
  )
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
      {children}
    </span>
  )
}

function Stat({ label, value }) {
  return (
    <div className="border-t-2 border-slate-900/90 pt-6">
      <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function FeatureBlock({ title, desc }) {
  return (
    <div className="bg-white">
      <div className="border-l border-slate-200 px-6 py-5">
        <p className="text-sm lg:text-[13px] font-semibold text-slate-900">{title}</p>
        {desc ? <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p> : null}
      </div>
    </div>
  )
}

function ImageCard({ title, image }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="aspect-[4/3] overflow-hidden">
        <img src={image} alt={title} className="h-full w-full object-cover" loading="lazy" />
      </div>

      <div className="p-4">
        <p className="text-xs font-semibold tracking-[0.22em] uppercase text-white/70">{title}</p>
      </div>
    </div>
  )
}

export default function About() {
  return (
    <main className="bg-white">
      <Seo
        title="About Us"
        description="Juxin Manufacturing is a China-based factory-direct manufacturer of shopping trolleys, utility carts and camping wagons, exporting to 60+ countries with OEM/ODM and container-level production."
        path="/about"
      />
      {/* HERO — German industrial vibe */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950">
        <div className="pointer-events-none absolute inset-0 opacity-[0.10]">
          <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <Container>
          {/* 手机端顶部少一点空，整体更紧凑 */}
          <div className="relative pt-[clamp(1.5rem,6vw,4rem)] pb-[clamp(3.5rem,8vw,6rem)]">
            <div className="flex flex-wrap gap-2">
              <Pill>Manufacturing</Pill>
              <Pill>Export-oriented</Pill>
              <Pill>{COMPANY.exportCountries}+ countries</Pill>
            </div>

            <h1 className="mt-6 max-w-4xl text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
              Factory-direct manufacturing of shopping trolleys and utility carts for global retail
              programs.
            </h1>

            <p className="mt-5 max-w-2xl text-[15px] sm:text-base leading-7 text-white/70">
              Exported to <span className="font-semibold text-white">{COMPANY.exportCountries}+ countries</span>,
              with strong coverage across{' '}
              <span className="font-semibold text-white">{COMPANY.primaryRegions.join(' · ')}</span>.
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/contact"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-100 transition"
              >
                Contact Sales
              </Link>
              <Link
                to="/products"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/25 bg-white/0 px-6 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                View Products
              </Link>
            </div>

            <div className="mt-10 sm:mt-12 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ImageCard image="https://img.juxin-manufacturing.com/website/factory_gate.webp" title="Factory" />
              <ImageCard image="https://img.juxin-manufacturing.com/website/exhibition.webp" title="INTERNATIONAL Exhibition" />
              <ImageCard image="https://img.juxin-manufacturing.com/website/container_loading.webp" title="Container Loading" />


            </div>
          </div>
        </Container>
      </section>

      {/* WHAT WE DO */}
      <section className="bg-white py-8">
        <Container>
          <div>
            <SectionTitle title="What we do" />

            <div className="mt-8 sm:mt-12 grid gap-8 sm:gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                  <ul className="grid gap-3">
                    {WHAT_WE_DO.map((t) => (
                      <li
                        key={t}
                        className="flex gap-3 text-[18px] sm:text-[22px] leading-7 font-medium text-slate-800"
                      >
                        <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 border-t border-slate-200 pt-6">
                    <p className="text-[16px] sm:text-[18px] font-semibold tracking-[0.22em] uppercase text-slate-500">
                      Product coverage
                    </p>
                    <p className="mt-3 text-[16px] sm:text-[18px] leading-7 text-slate-700">
                      {COMPANY.categories.join(' / ')}
                    </p>
                    <p className="mt-3 text-[14px] sm:text-[16px] leading-7 text-slate-700">
                      — Structured for retail operations and logistics. OEM/ODM support based on
                      existing models and clear specs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
                  <p className="text-[22px] sm:text-[28px] font-semibold text-slate-900">
                    Markets & client types
                  </p>

                  <p className="mt-3 text-[15px] sm:text-lg leading-7 text-slate-700">
                    Export coverage: <span className="font-semibold">{COMPANY.exportCountries}+ countries</span>
                  </p>

                  <p className="mt-2 text-[15px] sm:text-lg leading-7 text-slate-700">
                    Primary regions: <span className="font-semibold">{COMPANY.primaryRegions.join(' · ')}</span>
                  </p>

                  <p className="mt-2 text-[15px] sm:text-lg leading-7 text-slate-700">
                    Clients: <span className="font-semibold">{CLIENT_TYPES.join(' · ')}</span>
                  </p>

                  <p className="mt-3 text-[15px] sm:text-base leading-6 text-slate-600">
                    Typical cooperation includes retail programs, import distribution, and
                    container-level replenishment.
                  </p>

                  <div className="mt-7 sm:mt-8">
                    <Link
                      to="/products"
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800 transition"
                    >
                      Browse Products
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* PARTNERS — 用 Container 统一左右边距 */}
      <section className="bg-white ">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PartnersMarquee />
        </div>
      </section>


      {/* CERTIFICATIONS */}
      <Certifications />

      {/* SNAPSHOT */}
      <section className="bg-slate-100">
        <Container>
          <div className="py-12 sm:py-16 lg:py-20">
            <SectionTitle title="Background" />

            <div className="mt-10 sm:mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Established" value={COMPANY.established} />
              <Stat label="Location" value="Jinhua, Zhejiang" />
              <Stat label="Order Scale" value="Container-level" />
              <Stat label="Export Reach" value={`${COMPANY.exportCountries}+ Countries`} />
            </div>

            <div className="mt-10 sm:mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500">
                Cooperation statement
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                We focus on long-term cooperation with buyers across different scales. Our approach
                values clear communication, practical specifications, and reliable scheduling,
                helping both sides work smoothly and efficiently. We aim to build cooperative
                relationships based on mutual understanding, execution clarity, and sustainable
                supply.
              </p>

              <div className="mt-6 border-t border-slate-200 pt-6">
                <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500">
                  Primary regions
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Strong coverage across{' '}
                  <span className="font-semibold">{COMPANY.primaryRegions.join(' · ')}</span>.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CAPABILITY — big, blocky, industrial */}
      <section className="bg-white">
        <Container>
          <div className="py-12 sm:py-16 lg:py-18">
            <div className="grid gap-8 lg:gap-10 lg:grid-cols-12 lg:items-start">
              {/* 左侧：图片区（网页端更大） */}
              <div className="lg:col-span-6">
                <SectionTitle
                  kicker="Capability"
                  title="Production & delivery confidence"
                  // desc="This section reduces perceived risk: capacity, workflow, and delivery realism."
                />
                {/* 这个地方加生产线，包装图片   */}

                <div className="mt-7 grid gap-4">
                  {/* 大图 */}
                  {CAPABILITY_MEDIA?.[0] ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
                      <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                        <img
                          src={CAPABILITY_MEDIA[0].image}
                          alt={CAPABILITY_MEDIA[0].title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* 两张小图 */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {CAPABILITY_MEDIA?.slice(1, 3).map((x) => (
                      <div
                        key={x.title}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow"
                      >
                        <div className="aspect-[3/2] overflow-hidden bg-slate-100">
                          <img
                            src={x.image}
                            alt={x.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 右侧：文字区（网页端稍微收一点） */}
              <div className="lg:col-span-6">
                {/* 能力清单 */}
                <div className="grid gap-4 lg:gap-4 sm:grid-cols-2">
                  {CAPABILITY.map((t) => (
                    <FeatureBlock key={t} title={t} />
                  ))}
                </div>

                {/* 合作方式 */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:p-7 shadow-sm">
                  <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500">
                    How we work best
                  </p>
                  <p className="mt-3 text-sm lg:text-[13px] leading-7 text-slate-700">
                    We work best with clients seeking stable supply and clear specifications. For a fast
                    quotation, provide model, target market, quantity, and packaging requirements.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to="/contact"
                      className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800 transition"
                    >
                      Request a Quote
                    </Link>
                    <Link
                      to="/products"
                      className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
                    >
                      Choose a Model
                    </Link>
                  </div>

                  <div className="mt-8 border-t border-slate-200 pt-6">
                    <p className="text-xs font-semibold tracking-[0.22em] uppercase text-slate-500">
                      Patent note
                    </p>
                    <p className="mt-3 text-sm lg:text-[13px] leading-7 text-slate-700">
                      Some models are protected by design patents. Details available upon request.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>




      {/* CTA */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950">
        <Container>
          <div className="py-12 sm:py-14 lg:py-16">
            <div className="grid gap-8 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <Kicker dark>Next step</Kicker>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  Ready to discuss a sample or container order?
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  Send your target market, model, quantity, and packaging requirements. We’ll reply
                  with a clear, execution-ready quotation.
                </p>
              </div>

              <div className="lg:col-span-4">
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link
                    to="/contact"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-slate-950 hover:bg-slate-100 transition"
                  >
                    Contact
                  </Link>
                  <Link
                    to="/products"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-white/25 bg-white/0 px-6 text-sm font-semibold text-white hover:bg-white/10 transition"
                  >
                    Browse Products
                  </Link>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-white/50">
              © {new Date().getFullYear()} {COMPANY.name}. Manufacturing & Export.
            </p>
          </div>
        </Container>
      </section>
    </main>
  )
}
