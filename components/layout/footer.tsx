"use client"

import { useAppSelector } from "@/lib/redux/hooks"
import { translations } from "@/lib/constants"
import Link from "next/link"
import Image from "next/image"
import { Instagram, Facebook, Mail, MapPin, Phone, LinkedinIcon } from "lucide-react"

export function Footer() {
  const { language } = useAppSelector((state) => state.app)
  const t = translations[language]

  return (
    <footer className="border-t border-primary/20 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo and Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center">
              {/* Logo */}
              <div className="relative h-12 w-36">
                <Image 
                  src="/logo.png" 
                  alt={t.platformName} 
                  fill 
                  className="object-contain" 
                  style={{ filter: "none" }}
                />
              </div>
            </div>
            <address className="not-italic text-sm space-y-2">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                <span>Datavägen 12b, 442 32 Askim</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                <a href="mailto:info@mrmerch.se" className="hover:text-primary transition-colors">
                  info@mrmerch.se
                </a>
              </div>
            </address>
            <div className="flex items-center space-x-4 pt-2">
              <Link href="https://www.instagram.com/mr.merch.se?igsh=bnkxMXI4azhqNHlz" aria-label="Instagram" className="bg-primary/10 hover:bg-primary/20 p-2 rounded-full transition-colors">
                <Instagram size={18} className="text-primary" />
              </Link>
              <Link href="https://www.facebook.com/share/1ANBooptVJ/?mibextid=wwXIfr" aria-label="Facebook" className="bg-primary/10 hover:bg-primary/20 p-2 rounded-full transition-colors">
                <Facebook size={18} className="text-primary" />
              </Link>
              <Link href="https://www.linkedin.com/company/mr.merch/" aria-label="Facebook" className="bg-primary/10 hover:bg-primary/20 p-2 rounded-full transition-colors">
                <LinkedinIcon size={18} className="text-primary" />
              </Link>
            </div>
          </div>

          {/* Information Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Information</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy-policy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="hover:text-primary transition-colors">
                  Shipping & Return Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Purchase
                </Link>
              </li>
              <li>
                <Link href="/gift-card" className="hover:text-primary transition-colors">
                  Gift Card
                </Link>
              </li>
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Services</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/locations" className="hover:text-primary transition-colors">
                  Place
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-primary transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:text-primary transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Sign up for email</h3>
            <p className="mb-4 text-sm">
              Sign up to get first impressions on new arrivals, sales, exclusive content, events and more!
            </p>
            <form className="space-y-2">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-slate-800"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
    </footer>
  )
}
