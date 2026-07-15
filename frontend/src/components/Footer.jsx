// src/components/Footer.jsx
import { MapPin, Phone, Printer, Smartphone, Mail, Clock } from 'lucide-react'

function Item(props) {
  const { icon: Icon, label, children } = props

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0 text-white/70">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-white/60 text-xs tracking-wider">{label}</div>
        <div className="text-neutral-200 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

export default function Footer() {

  return (
    <footer className="bg-neutral-950 text-neutral-400">
      <div className="max-w-7xl mx-auto px-6 py-10 grid gap-10 md:grid-cols-3">
        {/* Contact */}
        <div className="space-y-5">
          <h4 className="text-white font-semibold tracking-wide">Contact</h4>

          <Item icon={Phone} label="TEL">
            <span className="tabular-nums">+86 579-82885508</span>
          </Item>

          <Item icon={Printer} label="FAX">
            <span className="tabular-nums">+86 579 82885501</span>
          </Item>

          <Item icon={Smartphone} label="MOBILE / WeChat">
            <div className="space-y-0.5">
              <a
                href="tel:+8613967945038"
                className="block hover:text-white transition tabular-nums"
              >
                +86 13967945038
              </a>
              <a
                href="tel:+8615067990314"
                className="block hover:text-white transition tabular-nums"
              >
                +86 15067990314
              </a>
            </div>
          </Item>

          <Item icon={Mail} label="EMAIL">
            <div className="space-y-0.5">
              <a
                href="mailto:sale01@cn-jason.net"
                className="block text-neutral-200 hover:text-white transition underline-offset-4 hover:underline break-all"
              >
                sale01@cn-jason.net
              </a>
              <a
                href="mailto:by3@bywycn.com"
                className="block text-neutral-200 hover:text-white transition underline-offset-4 hover:underline break-all"
              >
                by3@bywycn.com
              </a>
            </div>
          </Item>
        </div>

        {/* Address */}
        <div className="space-y-5">
          <h4 className="text-white font-semibold tracking-wide">Address</h4>

          <Item icon={MapPin} label="LOCATION">
            <div className="space-y-1">
              <div className="text-neutral-100 font-medium tracking-wide">
                浙江省金华市金东区曹宅镇镇东工业园区
              </div>
              <div className="text-neutral-200">
                Zhendong Industrial Zone, Caozhai Town,<br />
                Jindong District, Jinhua, Zhejiang, China
              </div>
            </div>
          </Item>
          <br/>
          <Item icon={Clock} label="BUSINESS HOURS">
            Mon–Sat, 08:00–17:00 (GMT+8)
          </Item>

          <div className="text-xs text-neutral-500 leading-relaxed pl-7">
            Typical response within 24 hours on business days.
          </div>
        </div>

        {/* Certifications */}
        <div>
          <h4 className="text-white font-semibold tracking-wide mb-4">Certifications</h4>

          <div className="grid grid-cols-3 gap-x-6 gap-y-5 items-center">
            <img
              src="/images/certs_footer/bsci.jpg"
              alt="BSCI"
              className="h-7 max-w-[140px] object-contain opacity-70 grayscale hover:opacity-95 hover:grayscale-0 transition"
            />

            <img
              src="/images/certs_footer/sgs.png"
              alt="SGS"
              className="h-7 max-w-[140px] object-contain opacity-70 grayscale hover:opacity-95 hover:grayscale-0 transition"
            />

            <img
              src="/images/certs_footer/ce.png"
              alt="CE"
              className="h-7 max-w-[140px] object-contain grayscale opacity-65 hover:opacity-95 transition"
            />

            <img
              src="/images/certs_footer/iso.png"
              alt="ISO 9001"
              className="h-7 max-w-[140px] object-contain opacity-70 grayscale hover:opacity-95 hover:grayscale-0 transition"
            />

            <img
              src="/images/certs_footer/wca.png"
              alt="WCA"
              className="h-7 max-w-[140px] object-contain opacity-70 grayscale hover:opacity-95 hover:grayscale-0 transition"
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-2 md:items-center md:justify-between text-xs text-neutral-500">
          <div>© {new Date().getFullYear()} JinHua JuXin Machinery Manufacture Co., Ltd.</div>
          <div className="text-neutral-600">Made in Jinhua · Zhejiang · China</div>
        </div>
      </div>
    </footer>
  )
}
