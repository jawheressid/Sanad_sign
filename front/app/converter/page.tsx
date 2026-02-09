'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import * as THREE from 'three'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'

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

interface PoseJson {
  frames: Array<Array<[number, number, number]>>
  edges: Array<[number, number]>
  bounds: { min_x: number; max_x: number; min_y: number; max_y: number }
  fps: number
}

function HumanPoseViewer({ jobId, apiBase }: { jobId: string; apiBase: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!jobId || !containerRef.current) return

    let renderer: THREE.WebGLRenderer | null = null
    let camera: THREE.PerspectiveCamera | null = null
    let scene: THREE.Scene | null = null
    let animId: number | null = null
    let resizeObserver: ResizeObserver | null = null
    let disposed = false

    const init = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${apiBase}/pose-json/${jobId}?stride=2`)
        if (!res.ok) {
          throw new Error('Failed to load pose data.')
        }
        const data = (await res.json()) as PoseJson
        if (!containerRef.current) return
        const width = containerRef.current.clientWidth
        const height = containerRef.current.clientHeight
        if (!width || !height) return

        scene = new THREE.Scene()
        scene.background = new THREE.Color('#0b1220')
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
        camera.position.set(0, 0, 3)

        renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio || 1)
        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(renderer.domElement)

        const numPoints = data.frames[0]?.length ?? 0
        const edges = data.edges ?? []

        const pointsGeometry = new THREE.BufferGeometry()
        const pointPositions = new Float32Array(numPoints * 3)
        pointsGeometry.setAttribute(
          'position',
          new THREE.BufferAttribute(pointPositions, 3)
        )
        const points = new THREE.Points(
          pointsGeometry,
          new THREE.PointsMaterial({ color: 0x7dd3fc, size: 0.045 })
        )
        scene.add(points)

        const lineGeometry = new THREE.BufferGeometry()
        const linePositions = new Float32Array(edges.length * 2 * 3)
        lineGeometry.setAttribute(
          'position',
          new THREE.BufferAttribute(linePositions, 3)
        )
        const lines = new THREE.LineSegments(
          lineGeometry,
          new THREE.LineBasicMaterial({ color: 0xf8fafc, linewidth: 2 })
        )
        scene.add(lines)

        const { min_x, max_x, min_y, max_y } = data.bounds
        const cx = (min_x + max_x) / 2
        const cy = (min_y + max_y) / 2
        const span = Math.max(max_x - min_x, max_y - min_y) || 1
        const scale = 2 / span
        const fps = data.fps || 24
        const frameDelay = 1000 / fps
        let frameIndex = 0
        let lastTs = 0

        const updateFrame = () => {
          const frame = data.frames[frameIndex]
          if (!frame) return
          for (let i = 0; i < numPoints; i++) {
            const [x, y, conf] = frame[i]
            const idx = i * 3
            if (conf > 0) {
              pointPositions[idx] = (x - cx) * scale
              pointPositions[idx + 1] = -(y - cy) * scale
              pointPositions[idx + 2] = 0
            } else {
              pointPositions[idx] = 0
              pointPositions[idx + 1] = 0
              pointPositions[idx + 2] = 0
            }
          }
          pointsGeometry.attributes.position.needsUpdate = true

          for (let e = 0; e < edges.length; e++) {
            const [a, b] = edges[e]
            const aIdx = a * 3
            const bIdx = b * 3
            const lIdx = e * 6
            linePositions[lIdx] = pointPositions[aIdx]
            linePositions[lIdx + 1] = pointPositions[aIdx + 1]
            linePositions[lIdx + 2] = pointPositions[aIdx + 2]
            linePositions[lIdx + 3] = pointPositions[bIdx]
            linePositions[lIdx + 4] = pointPositions[bIdx + 1]
            linePositions[lIdx + 5] = pointPositions[bIdx + 2]
          }
          lineGeometry.attributes.position.needsUpdate = true
        }

        const tick = (ts: number) => {
          if (disposed) return
          if (!lastTs || ts - lastTs >= frameDelay) {
            updateFrame()
            frameIndex = (frameIndex + 1) % data.frames.length
            lastTs = ts
          }
          if (renderer && scene && camera) {
            renderer.render(scene, camera)
          }
          animId = requestAnimationFrame(tick)
        }

        animId = requestAnimationFrame(tick)

        resizeObserver = new ResizeObserver(() => {
          if (!containerRef.current || !renderer || !camera) return
          const w = containerRef.current.clientWidth
          const h = containerRef.current.clientHeight
          renderer.setSize(w, h)
          camera.aspect = w / h
          camera.updateProjectionMatrix()
        })
        resizeObserver.observe(containerRef.current)
        setError(null)
      } catch (err: any) {
        setError(err?.message || 'Failed to load pose data.')
      } finally {
        setLoading(false)
      }
    }

    init()

    return () => {
      disposed = true
      if (animId) cancelAnimationFrame(animId)
      if (resizeObserver && containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
      if (renderer) {
        renderer.dispose()
        renderer.domElement.remove()
      }
    }
  }, [jobId, apiBase])

  return (
    <div className="space-y-3">
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-border/30 bg-[#0b1220]">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading 3D human preview...</p>
      ) : null}
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : null}
    </div>
  )
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export default function ConverterPage() {
  const [activeTab, setActiveTab] = useState('text')
  const [textInput, setTextInput] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('asl')
  const [avatarType, setAvatarType] = useState('human')
  const [glosser, setGlosser] = useState('simple')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

  const isGenerating =
    isSubmitting || job?.status === 'queued' || job?.status === 'running'
  const progress = job?.progress ?? 0
  const videoGenerated = job?.status === 'completed'
  const steps = job?.steps ?? []
  const result = job?.result ?? null
  const isRulesInvalid = glosser === 'rules' && selectedLanguage !== 'fsl'

  const apiBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
  const videoUrl = result?.files?.video ? `${apiBase}${result.files.video}` : null
  const poseUrl = result?.files?.pose ? `${apiBase}${result.files.pose}` : null

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

  const handleGenerate = async () => {
    setError(null)
    setJob(null)

    const lang = languageMap[selectedLanguage as keyof typeof languageMap]
    if (!lang) {
      setError('Selected sign language is not supported by the AI pipeline yet.')
      return
    }
    if (isRulesInvalid) {
      setError('Rules glosser only supports French input (FSL).')
      return
    }

    if (activeTab === 'text' && !textInput.trim()) return
    if (activeTab !== 'text' && !selectedFile) {
      setError('Please upload a file for audio or video conversion.')
      return
    }

    const form = new FormData()
    form.append('mode', activeTab)
    form.append('glosser', glosser)
    form.append('spoken_language', lang.spoken)
    form.append('signed_language', lang.signed)
    form.append('avatar_type', avatarType)

    if (activeTab === 'text') {
      form.append('text', textInput)
    } else if (selectedFile) {
      form.append('file', selectedFile)
    }

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
                <Link href="/converter" className="px-3 py-2 text-sm font-medium text-primary hover:text-primary transition-colors">
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

      {/* Page Header */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 border-b border-border">
        <div className="mx-auto max-w-7xl">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Convert to Sign Language</h1>
            <p className="text-lg text-foreground/80 font-medium max-w-2xl">
              Transform text, audio, or video into beautiful sign language animations in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Input Section */}
            <div className="lg:col-span-1">
              <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5">
                <h2 className="text-xl font-semibold text-foreground mb-6">Input Options</h2>

                <Tabs
                  value={activeTab}
                  onValueChange={(value) => {
                    setActiveTab(value)
                    setSelectedFile(null)
                    setError(null)
                  }}
                >
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="text">Text</TabsTrigger>
                    <TabsTrigger value="audio">Audio</TabsTrigger>
                    <TabsTrigger value="video">Video</TabsTrigger>
                  </TabsList>

                  {/* Text Tab */}
                  <TabsContent value="text" className="space-y-4">
                    <div>
                      <Label htmlFor="text-input" className="text-foreground mb-2 block">
                        Enter text to convert
                      </Label>
                      <Textarea
                        id="text-input"
                        placeholder="Type the text you want to convert to sign language..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="min-h-32 bg-background/50 border-border/30 text-foreground placeholder:text-muted-foreground/50"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {textInput.length} characters
                      </p>
                    </div>
                  </TabsContent>

                  {/* Audio Tab */}
                  <TabsContent value="audio" className="space-y-4">
                    <div>
                      <Label htmlFor="audio-file" className="text-foreground mb-2 block">
                        Upload audio file
                      </Label>
                      <Input
                        id="audio-file"
                        type="file"
                        accept="audio/*"
                        className="bg-background/50 border-border/30 text-foreground file:bg-primary file:text-primary-foreground file:border-0 file:rounded file:px-3 file:py-1 file:text-sm file:font-semibold"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null
                          setSelectedFile(file)
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Supports: MP3, WAV, M4A, OGG
                      </p>
                      {selectedFile ? (
                        <p className="text-xs text-foreground/80 mt-2">
                          Selected: {selectedFile.name}
                        </p>
                      ) : null}
                    </div>
                  </TabsContent>

                  {/* Video Tab */}
                  <TabsContent value="video" className="space-y-4">
                    <div>
                      <Label htmlFor="video-file" className="text-foreground mb-2 block">
                        Upload video file
                      </Label>
                      <Input
                        id="video-file"
                        type="file"
                        accept="video/*"
                        className="bg-background/50 border-border/30 text-foreground file:bg-primary file:text-primary-foreground file:border-0 file:rounded file:px-3 file:py-1 file:text-sm file:font-semibold"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null
                          setSelectedFile(file)
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Supports: MP4, WebM, MOV, AVI
                      </p>
                      {selectedFile ? (
                        <p className="text-xs text-foreground/80 mt-2">
                          Selected: {selectedFile.name}
                        </p>
                      ) : null}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Settings */}
                <div className="space-y-6 mt-8 pt-8 border-t border-border/30">
                  {/* Sign Language Selection */}
                  <div>
                    <Label className="text-foreground font-semibold mb-3 block">
                      Select Sign Language
                    </Label>
                    <RadioGroup value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="asl" id="asl" />
                        <Label htmlFor="asl" className="font-normal cursor-pointer">
                          American Sign Language (ASL)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fsl" id="fsl" />
                        <Label htmlFor="fsl" className="font-normal cursor-pointer">
                          French Sign Language (LSF)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="arsl" id="arsl" />
                        <Label htmlFor="arsl" className="font-normal cursor-pointer">
                          Arabic Sign Language (ArSL)
                        </Label>
                      </div>
                    </RadioGroup>
                    {selectedLanguage === 'arsl' ? (
                      <p className="text-xs text-muted-foreground mt-2">
                        ArSL is not supported by the current AI pipeline.
                      </p>
                    ) : null}
                  </div>

                  {/* Avatar Type Selection */}
                  <div>
                    <Label className="text-foreground font-semibold mb-3 block">
                      Avatar Type
                    </Label>
                    <RadioGroup value={avatarType} onValueChange={setAvatarType}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="skeleton" id="skeleton" />
                        <Label htmlFor="skeleton" className="font-normal cursor-pointer">
                          Skeleton View
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="human" id="human" />
                        <Label htmlFor="human" className="font-normal cursor-pointer">
                          Human Avatar
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Glosser Selection */}
                  <div>
                    <Label className="text-foreground font-semibold mb-3 block">
                      Glosser
                    </Label>
                    <select
                      value={glosser}
                      onChange={(event) => setGlosser(event.target.value)}
                      className="w-full rounded-md border border-border/30 bg-background/50 px-3 py-2 text-sm text-foreground"
                    >
                      <option value="simple">Simple (fast)</option>
                      <option value="spacylemma">SpaCy Lemma (better)</option>
                      <option value="rules">Rules (French only)</option>
                    </select>
                    {glosser === 'rules' && selectedLanguage !== 'fsl' ? (
                      <p className="text-xs text-muted-foreground mt-2">
                        Rules glosser is optimized for French input (FSL).
                      </p>
                    ) : null}
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={
                      isGenerating ||
                      (!textInput.trim() && activeTab === 'text') ||
                      (activeTab !== 'text' && !selectedFile) ||
                      !languageMap[selectedLanguage as keyof typeof languageMap] ||
                      isRulesInvalid
                    }
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Sign Language'}
                  </Button>
                  {error ? (
                    <p className="text-sm text-red-500 font-medium">
                      {error}
                    </p>
                  ) : null}
                </div>
              </Card>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-2">
              <Card className="p-8 border-2 border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5 min-h-96 flex flex-col items-center justify-center">
                {!videoGenerated ? (
                  <div className="text-center space-y-4 w-full">
                    {isGenerating ? (
                      <>
                        <h3 className="text-xl font-semibold text-foreground">
                          Generating Sign Language Animation
                        </h3>
                        <p className="text-muted-foreground">
                          Our AI is creating a beautiful sign language version of your content...
                        </p>
                        <div className="w-full space-y-2 mt-6">
                          <Progress value={progress} className="w-full" />
                          <p className="text-sm text-muted-foreground">
                            {Math.round(progress)}% complete
                          </p>
                        </div>
                        {steps.length > 0 ? (
                          <div className="mt-6 text-left space-y-3">
                            <p className="text-sm font-semibold text-foreground">Steps</p>
                            <div className="space-y-2">
                              {steps.map((step) => (
                                <div
                                  key={step.id}
                                  className="flex items-center justify-between rounded-md border border-border/30 bg-background/40 px-3 py-2"
                                >
                                  <span className="text-sm text-foreground">{step.label}</span>
                                  <span
                                    className={`text-xs font-semibold ${
                                      step.status === 'done'
                                        ? 'text-green-500'
                                        : step.status === 'running'
                                          ? 'text-primary'
                                          : step.status === 'error'
                                            ? 'text-red-500'
                                            : 'text-muted-foreground'
                                    }`}
                                  >
                                    {step.status.toUpperCase()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : job?.status === 'failed' ? (
                      <>
                        <h3 className="text-xl font-semibold text-foreground">
                          Conversion Failed
                        </h3>
                        <p className="text-sm text-red-500">
                          {job?.error || 'An unexpected error occurred.'}
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold text-foreground">
                          {activeTab === 'text'
                            ? 'Enter text to get started'
                            : 'Upload a file to convert'}
                        </h3>
                        <p className="text-muted-foreground">
                          Your sign language animation will appear here once generated.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full space-y-6">
                    {avatarType === 'human' && job?.id ? (
                      <HumanPoseViewer jobId={job.id} apiBase={apiBase} />
                    ) : videoUrl ? (
                      <div className="aspect-video bg-background/50 rounded-lg border border-border/30 overflow-hidden">
                        <video
                          src={videoUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-background/50 rounded-lg border border-border/30 flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <p className="text-muted-foreground font-semibold">
                            Video output not available.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                      <div className="rounded-lg border border-border/30 bg-background/40 p-4 text-left">
                        <p className="text-xs text-muted-foreground mb-2">Transcript</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {result?.text || 'No transcript.'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/30 bg-background/40 p-4 text-left">
                        <p className="text-xs text-muted-foreground mb-2">Gloss</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {result?.gloss || 'No gloss output.'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">Export Options</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {videoUrl ? (
                          <Button variant="outline" className="border-border/30 bg-transparent" asChild>
                            <a href={videoUrl} download>
                              Download Video
                            </a>
                          </Button>
                        ) : (
                          <Button variant="outline" className="border-border/30 bg-transparent" disabled>
                            Download Video
                          </Button>
                        )}
                        {poseUrl ? (
                          <Button variant="outline" className="border-border/30 bg-transparent" asChild>
                            <a href={poseUrl} download>
                              Download Pose
                            </a>
                          </Button>
                        ) : (
                          <Button variant="outline" className="border-border/30 bg-transparent" disabled>
                            Download Pose
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="border-border/30 col-span-2 bg-transparent"
                          disabled={!videoUrl}
                          onClick={() => {
                            if (!videoUrl) return
                            navigator.clipboard.writeText(videoUrl)
                          }}
                        >
                          Copy Share Link
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setJob(null)
                        setTextInput('')
                        setSelectedFile(null)
                        setError(null)
                      }}
                      variant="outline"
                      className="w-full border-border/30"
                    >
                      Create Another
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 border-t border-border">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-foreground mb-8">Tips for Best Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 hover:shadow-xl hover:border-primary/50 transition-all">
              <h3 className="font-semibold text-foreground mb-2">Clear & Concise</h3>
              <p className="text-sm text-foreground/80 font-medium">
                Use simple sentences and clear language for better sign language conversion.
              </p>
            </Card>
            <Card className="p-6 border-2 border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5 hover:shadow-xl hover:border-secondary/50 transition-all">
              <h3 className="font-semibold text-foreground mb-2">Quality Audio</h3>
              <p className="text-sm text-foreground/80 font-medium">
                For audio files, ensure good quality and minimal background noise.
              </p>
            </Card>
            <Card className="p-6 border-2 border-accent/30 bg-gradient-to-br from-accent/15 to-accent/5 hover:shadow-xl hover:border-accent/50 transition-all">
              <h3 className="font-semibold text-foreground mb-2">Customize Settings</h3>
              <p className="text-sm text-foreground/80 font-medium">
                Choose your preferred sign language and avatar type for personalized results.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
