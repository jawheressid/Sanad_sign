'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">SignBridge</span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                <Link href="/" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
                <Link href="/converter" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Convert to Sign
                </Link>
                <Link href="/youtube" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  YouTube Converter
                </Link>
                <Link href="/learn" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Learn ASL
                </Link>
                <Link href="/about" className="px-3 py-2 text-sm font-medium text-primary hover:text-primary transition-colors">
                  About
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 border-b border-border">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <h1 className="text-5xl font-bold text-foreground">About SignBridge AI</h1>
          <p className="text-xl text-foreground/80 font-medium">
            Our mission is to empower the deaf and hard-of-hearing community by making digital
            content universally accessible through AI-powered sign language.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">Our Mission</h2>
                <p className="text-lg text-foreground/80 font-medium">
                  SignBridge AI is dedicated to bridging communication gaps and promoting digital
                  inclusion. We believe everyone deserves equal access to information, education,
                  and entertainment.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">Accessibility</h3>
                  <p className="text-muted-foreground text-sm">
                    Making content accessible to the deaf and hard-of-hearing community
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Inclusion</h3>
                  <p className="text-muted-foreground text-sm">
                    Fostering a more inclusive digital world for everyone
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Innovation</h3>
                  <p className="text-muted-foreground text-sm">
                    Using cutting-edge AI technology to solve real-world problems
                  </p>
                </div>
              </div>
            </div>

            <Card className="p-8 border-2 border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg border border-border/30 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <p className="text-foreground font-semibold">Building Bridges</p>
                  <p className="text-sm text-muted-foreground">
                    Through technology and compassion
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 border-t border-border">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Our Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 text-center hover:shadow-lg transition-all">
              <p className="text-4xl font-bold text-foreground mb-2">50K+</p>
              <p className="text-foreground/80 font-medium">Videos Converted</p>
            </Card>
            <Card className="p-6 border-2 border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5 text-center hover:shadow-lg transition-all">
              <p className="text-4xl font-bold text-foreground mb-2">25K+</p>
              <p className="text-foreground/80 font-medium">Active Learners</p>
            </Card>
            <Card className="p-6 border-2 border-accent/30 bg-gradient-to-br from-accent/15 to-accent/5 text-center hover:shadow-lg transition-all">
              <p className="text-4xl font-bold text-foreground mb-2">150+</p>
              <p className="text-foreground/80 font-medium">Organizations</p>
            </Card>
            <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 text-center hover:shadow-lg transition-all">
              <p className="text-4xl font-bold text-foreground mb-2">15</p>
              <p className="text-foreground/80 font-medium">Countries Served</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-8 border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-foreground mb-3">Educators</h3>
              <p className="text-foreground/80 font-medium text-sm">
                Teachers are using SignBridge to create accessible educational content for their
                deaf and hard-of-hearing students.
              </p>
            </Card>
            <Card className="p-8 border-2 border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5 hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-foreground mb-3">Content Creators</h3>
              <p className="text-foreground/80 font-medium text-sm">
                YouTubers and podcasters are reaching new audiences by adding sign language to
                their content.
              </p>
            </Card>
            <Card className="p-8 border-2 border-accent/30 bg-gradient-to-br from-accent/15 to-accent/5 hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-foreground mb-3">Organizations</h3>
              <p className="text-foreground/80 font-medium text-sm">
                Corporate and non-profit organizations are improving accessibility of their digital
                platforms.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 border-t border-border">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Alex Chen',
                role: 'Founder & CEO',
                bio: 'AI specialist with 10+ years in computer vision',
              },
              {
                name: 'Fatima Al-Rashid',
                role: 'Head of Sign Language',
                bio: 'Deaf educator and ArSL expert',
              },
              {
                name: 'Marcus Johnson',
                role: 'CTO',
                bio: 'Full-stack engineer and accessibility advocate',
              },
              {
                name: 'Sarah Rodriguez',
                role: 'Head of Design',
                bio: 'Inclusive design specialist',
              },
            ].map((member, index) => (
              <Card key={index} className="p-6 border-border/30 bg-card text-center hover:shadow-lg transition-all">
                <h3 className="font-semibold text-foreground">{member.name}</h3>
                <p className="text-sm text-primary mt-1">{member.role}</p>
                <p className="text-xs text-muted-foreground mt-2">{member.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 border-t border-border">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-foreground mb-3">Accessibility First</h3>
              <p className="text-foreground/80 font-medium">
                We prioritize accessibility in every decision we make, ensuring our platform is
                usable by everyone.
              </p>
            </Card>
            <Card className="p-8 border-2 border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5 hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-foreground mb-3">Privacy & Security</h3>
              <p className="text-foreground/80 font-medium">
                User data is treated with utmost care. We never store or share personal
                information without consent.
              </p>
            </Card>
            <Card className="p-8 border-2 border-accent/30 bg-gradient-to-br from-accent/15 to-accent/5 hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-foreground mb-3">Community Impact</h3>
              <p className="text-foreground/80 font-medium">
                We're committed to serving the deaf community and supporting sign language
                education globally.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 border-t border-border">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-3xl font-bold text-foreground">Join Our Mission</h2>
          <p className="text-lg text-foreground/80 font-medium max-w-2xl mx-auto">
            Whether you're an educator, content creator, or organization, we invite you to help us
            make digital content accessible to everyone.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline">
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4">SignBridge</h3>
              <p className="text-sm text-muted-foreground">
                Making the web accessible to everyone through AI-powered sign language.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/converter" className="hover:text-foreground transition-colors">
                    Converter
                  </Link>
                </li>
                <li>
                  <Link href="/youtube" className="hover:text-foreground transition-colors">
                    YouTube Tool
                  </Link>
                </li>
                <li>
                  <Link href="/learn" className="hover:text-foreground transition-colors">
                    Learning Module
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>© 2024 SignBridge AI. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-foreground transition-colors">
                Twitter
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                LinkedIn
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
