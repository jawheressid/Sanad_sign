'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'

interface JobStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'done' | 'error' | 'skipped'
  ts?: string | null
}

interface JobResult {
  text: string
  gloss: string
  files?: {
    pose?: string
    video?: string
  }
}

interface JobState {
  id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress: number
  steps: JobStep[]
  result?: JobResult | null
  error?: string | null
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export default function YouTubeConverterPage() {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('asl')
  const [preferCaptions, setPreferCaptions] = useState(true)
  const [includeTimestamps, setIncludeTimestamps] = useState(true)
  const [job, setJob] = useState<JobState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const languageMap = useMemo(
    () => ({
      asl: { spoken: 'en', signed: 'ase' },
      fsl: { spoken: 'fr', signed: 'fsl' },
    }),
    []
  )

  const apiBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
  const isProcessing =
    isSubmitting || job?.status === 'queued' || job?.status === 'running'
  const progress = job?.progress ?? 0
  const videoConverted = job?.status === 'completed'
  const steps = job?.steps ?? []
  const result = job?.result ?? null
  const videoUrl = result?.files?.video ? `${apiBase}${result.files.video}` : null

  useEffect(() => {
    if (!job?.id) return
    if (job.status === 'completed' || job.status === 'failed') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${apiBase}/jobs/${job.id}`)
        if (!res.ok) return
        const data = (await res.json()) as JobState
        setJob(data)
      } catch {
        // ignore polling errors
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [apiBase, job?.id, job?.status])

  const handleConvert = async () => {
    setError(null)
    setJob(null)

    if (!youtubeUrl.trim()) return
    const lang = languageMap[selectedLanguage as keyof typeof languageMap]
    if (!lang) {
      setError('Selected sign language is not supported by the backend yet.')
      return
    }

    const form = new FormData()
    form.append('mode', 'youtube')
    form.append('youtube_url', youtubeUrl.trim())
    form.append('spoken_language', lang.spoken)
    form.append('signed_language', lang.signed)
    form.append('prefer_captions', String(preferCaptions))
    form.append('caption_language', lang.spoken)

    try {
      setIsSubmitting(true)
      const res = await fetch(`${apiBase}/jobs`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.detail || 'Failed to start conversion.')
        return
      }
      const data = (await res.json()) as JobState
      setJob(data)
    } catch {
      setError('Failed to reach the backend API.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValidYoutubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

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
                <Link href="/youtube" className="px-3 py-2 text-sm font-medium text-primary hover:text-primary transition-colors">
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

      {/* Page Header */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 border-b border-border">
        <div className="mx-auto max-w-7xl">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">YouTube to Sign Language</h1>
            <p className="text-lg text-foreground/80 font-medium max-w-2xl">
              Convert any YouTube video into sign language synchronized with the original content.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8">
            {/* Input Card */}
            <Card className="p-8 border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5">
              <h2 className="text-2xl font-semibold text-foreground mb-6">Convert Your Video</h2>

              <div className="space-y-6">
                {/* URL Input */}
                <div>
                  <Label htmlFor="youtube-url" className="text-foreground font-semibold mb-2 block">
                    YouTube Video URL
                  </Label>
                  <Input
                    id="youtube-url"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="bg-background/50 border-border/30 text-foreground placeholder:text-muted-foreground/50 h-12"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Paste the full URL of the YouTube video you want to convert
                  </p>
                </div>

                {/* Settings Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border/30">
                  {/* Sign Language Selection */}
                  <div>
                    <Label className="text-foreground font-semibold mb-3 block">
                      Sign Language
                    </Label>
                    <RadioGroup value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="asl" id="asl" />
                        <Label htmlFor="asl" className="font-normal cursor-pointer text-foreground">
                          American Sign Language (ASL)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fsl" id="fsl" />
                        <Label htmlFor="fsl" className="font-normal cursor-pointer text-foreground">
                          French Sign Language (LSF)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Additional Options */}
                  <div>
                    <Label className="text-foreground font-semibold mb-3 block">
                      Display Options
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="captions"
                          checked={preferCaptions}
                          onCheckedChange={(value) => setPreferCaptions(Boolean(value))}
                        />
                        <Label htmlFor="captions" className="font-normal cursor-pointer text-foreground">
                          Prefer YouTube Captions (Faster)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="subtitles"
                          checked={includeTimestamps}
                          onCheckedChange={(value) => setIncludeTimestamps(Boolean(value))}
                        />
                        <Label htmlFor="subtitles" className="font-normal cursor-pointer text-foreground">
                          Include Timestamps
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Convert Button */}
                <Button
                  onClick={handleConvert}
                  disabled={!isValidYoutubeUrl(youtubeUrl) || isProcessing}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 mt-6"
                >
                  {isProcessing ? 'Converting...' : 'Convert to Sign Language'}
                </Button>
                {error ? (
                  <p className="text-sm text-red-500 font-medium">{error}</p>
                ) : null}
              </div>
            </Card>

            {/* Progress / Output Card */}
            {isProcessing || videoConverted ? (
              <Card className="p-8 border-border/30 bg-card/50 backdrop-blur">
                {isProcessing ? (
                  <div className="space-y-6">
                    <div className="text-center space-y-3">
                      <h3 className="text-xl font-semibold text-foreground">
                        Converting Your Video
                      </h3>
                      <p className="text-muted-foreground">
                        This may take a few moments depending on video length...
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-primary font-semibold">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>

                    {steps.length > 0 ? (
                      <div className="space-y-3 pt-4 border-t border-border/30">
                        <div className="text-sm">
                          <p className="text-muted-foreground mb-2">Processing steps:</p>
                          <ul className="space-y-2">
                            {steps.map((step) => (
                              <li key={step.id} className="flex items-center gap-3">
                                <span
                                  className={`text-sm font-semibold ${
                                    step.status === 'done'
                                      ? 'text-primary'
                                      : step.status === 'running'
                                        ? 'text-primary'
                                        : step.status === 'error'
                                          ? 'text-red-500'
                                          : 'text-muted-foreground'
                                  }`}
                                >
                                  {step.status === 'done' ? '✓' : '○'}
                                </span>
                                <span className="text-foreground">{step.label}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-semibold text-foreground">
                      Conversion Complete!
                    </h3>

                    {/* Video Preview */}
                    <div className="aspect-video bg-background/50 rounded-lg border border-border/30 flex items-center justify-center">
                      {videoUrl ? (
                        <video
                          src={videoUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center space-y-4">
                          <p className="text-muted-foreground font-semibold">Sign Language Video Preview</p>
                          <p className="text-sm text-muted-foreground">
                            The video is ready. Use the download button below.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-background/30 rounded-lg border border-border/30">
                      <div>
                        <p className="text-xs text-muted-foreground">Sign Language</p>
                        <p className="text-foreground font-semibold">
                          {selectedLanguage === 'asl'
                            ? 'American Sign Language'
                            : 'French Sign Language'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Format</p>
                        <p className="text-foreground font-semibold">MP4 (1080p)</p>
                      </div>
                    </div>

                    {/* Export Options */}
                    <div className="space-y-3">
                      <Label className="text-foreground font-semibold">Export Options</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="border-border/30 bg-transparent"
                          onClick={() => {
                            if (videoUrl) window.open(videoUrl, '_blank')
                          }}
                          disabled={!videoUrl}
                        >
                          Download Video
                        </Button>
                        <Button variant="outline" className="border-border/30 bg-transparent" disabled>
                          Download Subtitles
                        </Button>
                        <Button
                          variant="outline"
                          className="border-border/30 col-span-2 bg-transparent"
                          onClick={async () => {
                            if (!videoUrl) return
                            try {
                              await navigator.clipboard.writeText(videoUrl)
                            } catch {
                              // ignore clipboard errors
                            }
                          }}
                          disabled={!videoUrl}
                        >
                          Copy Share Link
                        </Button>
                      </div>
                    </div>

                    {/* Convert Another */}
                    <Button
                      onClick={() => {
                        setJob(null)
                        setYoutubeUrl('')
                      }}
                      variant="outline"
                      className="w-full border-border/30"
                    >
                      Convert Another Video
                    </Button>
                  </div>
                )}
              </Card>
            ) : null}
          </div>

          {/* Info Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 hover:shadow-xl hover:border-primary/50 transition-all">
              <h3 className="font-semibold text-foreground mb-2">Fast Processing</h3>
              <p className="text-sm text-foreground/80 font-medium">
                Most videos are processed in just a few minutes.
              </p>
            </Card>
            <Card className="p-6 border-2 border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5 hover:shadow-xl hover:border-secondary/50 transition-all">
              <h3 className="font-semibold text-foreground mb-2">High Quality</h3>
              <p className="text-sm text-foreground/80 font-medium">
                Crystal clear sign language animations up to 1080p.
              </p>
            </Card>
            <Card className="p-6 border-2 border-accent/30 bg-gradient-to-br from-accent/15 to-accent/5 hover:shadow-xl hover:border-accent/50 transition-all">
              <h3 className="font-semibold text-foreground mb-2">Privacy First</h3>
              <p className="text-sm text-foreground/80 font-medium">
                Your videos are processed securely and not stored.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
