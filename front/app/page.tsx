'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function Home() {
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
                <Link href="/about" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
                  <span className="text-sm font-semibold text-primary">Give a Hand</span>
                </div>
                <h1 className="text-balance text-5xl font-bold text-foreground lg:text-6xl">
                  To give everyone an equal chance to be understood
                </h1>
                <p className="text-xl text-muted-foreground">
                  Convert text, audio, and video to sign language using advanced AI. Learn Arabic Sign Language with interactive exercises and real-time feedback.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Start Converting
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border hover:bg-card bg-transparent"
                >
                  Learn More
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-8">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">3</div>
                  <p className="text-sm text-muted-foreground">Conversion Modes</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-secondary">100+</div>
                  <p className="text-sm text-muted-foreground">Learning Exercises</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-accent">2</div>
                  <p className="text-sm text-muted-foreground">Sign Languages</p>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">Real-time</div>
                  <p className="text-sm text-muted-foreground">AI Analysis</p>
                </div>
              </div>
            </div>

            {/* Right Side - Visual */}
            <div className="relative">
              <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 p-8 border border-border/30">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-3xl opacity-30 animate-pulse" />
                </div>

                <div className="relative flex h-full flex-col items-center justify-center gap-8">
                  <div className="space-y-4 text-center">
                    <h3 className="text-2xl font-semibold text-foreground">
                      AI-Powered Sign Language
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Convert any content to expressive sign language animations in seconds
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-8 w-full">
                    <div className="rounded-lg bg-card p-4 text-center border border-border/30">
                      <p className="text-xs text-muted-foreground font-semibold">Text</p>
                    </div>
                    <div className="rounded-lg bg-card p-4 text-center border border-border/30">
                      <p className="text-xs text-muted-foreground font-semibold">Audio</p>
                    </div>
                    <div className="rounded-lg bg-card p-4 text-center border border-border/30">
                      <p className="text-xs text-muted-foreground font-semibold">Video</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 border-t border-border">
        <div className="mx-auto max-w-7xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-foreground">
              Powerful Features for Accessibility
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to make content accessible to the deaf and hard-of-hearing community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="p-8 border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 hover:shadow-xl hover:border-primary/50 transition-all">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Text to Sign
              </h3>
              <p className="text-foreground/80 font-medium">
                Type any text and watch it transform into beautiful sign language animations powered by AI.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-8 border-2 border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5 hover:shadow-xl hover:border-secondary/50 transition-all">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Audio Processing
              </h3>
              <p className="text-foreground/80 font-medium">
                Upload audio files or record directly. AI transcribes and converts to sign language automatically.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-8 border-2 border-accent/30 bg-gradient-to-br from-accent/15 to-accent/5 hover:shadow-xl hover:border-accent/50 transition-all">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                YouTube Integration
              </h3>
              <p className="text-foreground/80 font-medium">
                Paste any YouTube link and get a sign language synchronized version of the content.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-8 border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 hover:shadow-xl hover:border-primary/50 transition-all">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Interactive Learning
              </h3>
              <p className="text-foreground/80 font-medium">
                Learn Arabic Sign Language with lessons, exercises, and camera-based real-time feedback.
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="p-8 border-2 border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5 hover:shadow-xl hover:border-secondary/50 transition-all">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                AI Avatar
              </h3>
              <p className="text-foreground/80 font-medium">
                Choose between skeleton view or human-like avatar for sign language visualization.
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="p-8 border-2 border-accent/30 bg-gradient-to-br from-accent/15 to-accent/5 hover:shadow-xl hover:border-accent/50 transition-all">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Progress Tracking
              </h3>
              <p className="text-foreground/80 font-medium">
                Monitor your learning progress with detailed analytics and achievement tracking.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 p-12 border border-border/30 text-center space-y-6">
            <h2 className="text-4xl font-bold text-foreground">
              Ready to Make Content Accessible?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of educators, content creators, and organizations making digital content accessible to everyone.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline">
                Book a Demo
              </Button>
            </div>
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
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
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
