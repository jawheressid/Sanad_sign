'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface Chapter {
  id: string
  title: string
  description: string
  completed: boolean
  progress: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  content: string
  completed: boolean
  videoUrl?: string
}

interface LanguageCourse {
  id: string
  label: string
  description: string
  chapters: Chapter[]
}

export default function LearnPage() {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [practiceMode, setPracticeMode] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [recognitionScore, setRecognitionScore] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState('asl')
  const [backendStatus, setBackendStatus] = useState<'idle' | 'running' | 'error'>('idle')
  const [backendError, setBackendError] = useState<string | null>(null)
  const [predictedLabel, setPredictedLabel] = useState<string>('—')
  const [top3, setTop3] = useState<Array<{ label: string; score: number }>>([])
  const [isMatch, setIsMatch] = useState<boolean | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastPredRef = useRef<number>(0)
  const isRunningRef = useRef(false)
  const isProcessingRef = useRef(false)
  const ROI_SCALE = 0.6
  const PRED_INTERVAL_MS = 180

  const IMG_SIZE = 160
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  const apiBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
  const getEmbedUrl = (url?: string) => {
    if (!url) return ''
    if (url.includes('/embed/') || url.includes('videoseries')) return url
    return url.replace('watch?v=', 'embed/')
  }

  const courses: LanguageCourse[] = [
    {
      id: 'asl',
      label: 'American Sign Language (ASL)',
      description: 'Focus on the ASL alphabet with curated YouTube lessons.',
      chapters: [
        {
          id: 'alphabet',
          title: 'ASL Alphabet (A-Z)',
          description: 'Learn the 26 letters of the ASL fingerspelling alphabet',
          completed: false,
          progress: 0,
          lessons: [
            {
              id: 'a',
              title: 'Letter A',
              content: 'Practice the A handshape and wrist orientation.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=1',
            },
            {
              id: 'b',
              title: 'Letter B',
              content: 'Keep fingers straight and thumb tucked across palm.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=2',
            },
            {
              id: 'c',
              title: 'Letter C',
              content: 'Form a clear C shape with curved fingers.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=3',
            },
            {
              id: 'd',
              title: 'Letter D',
              content: 'Index finger up, other fingers touch thumb.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=4',
            },
            {
              id: 'e',
              title: 'Letter E',
              content: 'Keep fingertips pressed to the thumb.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=5',
            },
            {
              id: 'f',
              title: 'Letter F',
              content: 'Form a circle with index and thumb.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=6',
            },
            {
              id: 'g',
              title: 'Letter G',
              content: 'Extend index finger and thumb horizontally.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=7',
            },
            {
              id: 'h',
              title: 'Letter H',
              content: 'Extend index and middle fingers together.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=8',
            },
            {
              id: 'i',
              title: 'Letter I',
              content: 'Pinky up, other fingers in a fist.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=9',
            },
            {
              id: 'j',
              title: 'Letter J',
              content: 'Draw a J with the pinky.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=10',
            },
            {
              id: 'k',
              title: 'Letter K',
              content: 'Index and middle up, thumb between.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=11',
            },
            {
              id: 'l',
              title: 'Letter L',
              content: 'Make an L with thumb and index.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=12',
            },
            {
              id: 'm',
              title: 'Letter M',
              content: 'Thumb under three fingers.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=13',
            },
            {
              id: 'n',
              title: 'Letter N',
              content: 'Thumb under two fingers.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=14',
            },
            {
              id: 'o',
              title: 'Letter O',
              content: 'Make a rounded O with fingers.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=15',
            },
            {
              id: 'p',
              title: 'Letter P',
              content: 'K handshape pointing down.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=16',
            },
            {
              id: 'q',
              title: 'Letter Q',
              content: 'G handshape pointing down.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=17',
            },
            {
              id: 'r',
              title: 'Letter R',
              content: 'Cross index and middle fingers.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=18',
            },
            {
              id: 's',
              title: 'Letter S',
              content: 'Make a fist with thumb over fingers.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=19',
            },
            {
              id: 't',
              title: 'Letter T',
              content: 'Thumb tucked between index and middle.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=20',
            },
            {
              id: 'u',
              title: 'Letter U',
              content: 'Index and middle together up.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=21',
            },
            {
              id: 'v',
              title: 'Letter V',
              content: 'Index and middle in a V shape.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=22',
            },
            {
              id: 'w',
              title: 'Letter W',
              content: 'Index, middle, ring up.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=23',
            },
            {
              id: 'x',
              title: 'Letter X',
              content: 'Hook index finger.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=24',
            },
            {
              id: 'y',
              title: 'Letter Y',
              content: 'Thumb and pinky extended.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/videoseries?list=PLQK2XiUY9C2iIuS_lQ5bq-awj5k7NBPKG&index=25',
            },
            {
              id: 'z',
              title: 'Letter Z',
              content: 'Trace a Z in the air with your index finger.',
              completed: false,
              videoUrl:
                'https://www.youtube.com/embed/8_JebEngKGQ',
            },
          ],
        },
      ],
    },
    {
      id: 'fsl',
      label: 'French Sign Language (LSF)',
      description: 'Coming soon. We will add LSF lessons and camera practice.',
      chapters: [],
    },
    {
      id: 'arsl',
      label: 'Arabic Sign Language (ArSL)',
      description: 'Coming soon. We will add Arabic sign lessons and practice.',
      chapters: [],
    },
  ]

  const activeCourse = courses.find((c) => c.id === selectedLanguage) || courses[0]
  const chapters = activeCourse.chapters

  const overallProgress = Math.round(
    chapters.length
      ? chapters.reduce((sum, ch) => sum + ch.progress, 0) / chapters.length
      : 0
  )

  const totalLessonsCompleted = chapters.reduce(
    (sum, ch) => sum + ch.lessons.filter((l) => l.completed).length,
    0
  )
  const totalLessons = chapters.reduce((sum, ch) => sum + ch.lessons.length, 0)
  const targetLabel = selectedLesson?.id ? selectedLesson.id.toUpperCase() : '—'

  const handlePractice = async () => {
    if (!selectedLesson) {
      setBackendStatus('error')
      setBackendError('Select a lesson before starting practice.')
      return
    }
    setPracticeMode(true)
    setCameraEnabled(true)
    setRecognitionScore(0)
    setPredictedLabel('—')
    setTop3([])
    setIsMatch(null)
    await startPractice()
  }

  const startCamera = async () => {
    if (streamRef.current) return
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    })
    streamRef.current = stream
    if (videoRef.current) {
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const predictFrame = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    if (video.readyState < 2) return

    const now = performance.now()
    if (now - lastPredRef.current < PRED_INTERVAL_MS) return
    lastPredRef.current = now
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    canvas.width = IMG_SIZE
    canvas.height = IMG_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      isProcessingRef.current = false
      return
    }
    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) {
      isProcessingRef.current = false
      return
    }
    const size = Math.floor(Math.min(vw, vh) * ROI_SCALE)
    const sx = Math.floor((vw - size) / 2)
    const sy = Math.floor((vh - size) / 2)
    ctx.drawImage(video, sx, sy, size, size, 0, 0, IMG_SIZE, IMG_SIZE)

    try {
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.6)
      )
      if (!blob) {
        isProcessingRef.current = false
        return
      }
      const form = new FormData()
      form.append('file', blob, 'frame.jpg')
      const res = await fetch(`${apiBase}/recognize`, { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'Recognition failed.')
      }
      const data = await res.json()
      setBackendStatus('running')
      setBackendError(null)
      const label = data?.label || '—'
      const confidence = typeof data?.confidence === 'number' ? data.confidence : 0
      const expected = selectedLesson?.id ? selectedLesson.id.toLowerCase() : null
      const normalized = String(label).trim().toLowerCase()
      const match = expected ? normalized === expected : null
      setPredictedLabel(label)
      setIsMatch(match)
      setRecognitionScore(match === null || match ? Math.round(confidence * 100) : 0)
      const top = Array.isArray(data?.top3) ? data.top3 : []
      setTop3(
        top.map((item: any) => ({
          label: item?.label || '?',
          score: typeof item?.score === 'number' ? item.score : 0,
        }))
      )
    } catch (err: any) {
      setBackendStatus('error')
      setBackendError(err?.message || 'Backend error.')
    } finally {
      isProcessingRef.current = false
    }
  }

  const loop = async () => {
    if (!isRunningRef.current) return
    await predictFrame()
    rafRef.current = requestAnimationFrame(loop)
  }

  const startPractice = async () => {
    try {
      isRunningRef.current = true
      setBackendStatus('running')
      setBackendError(null)
      await startCamera()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(loop)
    } catch (err) {
      isRunningRef.current = false
      setCameraEnabled(false)
      setBackendStatus('error')
      setBackendError('Failed to access camera.')
    }
  }

  const stopPractice = () => {
    isRunningRef.current = false
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    stopCamera()
    setBackendStatus('idle')
    setIsMatch(null)
  }

  useEffect(() => {
    return () => {
      stopPractice()
    }
  }, [])

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
                <Link href="/learn" className="px-3 py-2 text-sm font-medium text-primary hover:text-primary transition-colors">
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
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Learn Sign Language</h1>
              <p className="text-lg text-foreground/80 font-medium max-w-2xl">
                Choose a sign language and follow structured lessons with video demos and camera-based practice.
              </p>
            </div>

            {/* Language Selector */}
            <div className="flex flex-wrap gap-3">
              {courses.map((course) => (
                <Button
                  key={course.id}
                  variant={selectedLanguage === course.id ? 'default' : 'outline'}
                  className={
                    selectedLanguage === course.id
                      ? 'bg-primary hover:bg-primary/90'
                      : 'border-border/40'
                  }
                  onClick={() => {
                    setSelectedLanguage(course.id)
                    setSelectedChapter(null)
                    setSelectedLesson(null)
                    setPracticeMode(false)
                    setCameraEnabled(false)
                    stopPractice()
                  }}
                >
                  {course.label}
                </Button>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">{activeCourse.description}</p>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5">
                <p className="text-xs text-foreground/70 mb-1 font-medium">Overall Progress</p>
                <p className="text-2xl font-bold text-foreground">{overallProgress}%</p>
              </Card>
              <Card className="p-4 border-2 border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5">
                <p className="text-xs text-foreground/70 mb-1 font-medium">Lessons Completed</p>
                <p className="text-2xl font-bold text-foreground">
                  {totalLessonsCompleted}/{totalLessons}
                </p>
              </Card>
              <Card className="p-4 border-2 border-accent/30 bg-gradient-to-br from-accent/15 to-accent/5">
                <p className="text-xs text-foreground/70 mb-1 font-medium">Chapter Streak</p>
                <p className="text-2xl font-bold text-foreground">3 days</p>
              </Card>
              <Card className="p-4 border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5">
                <p className="text-xs text-foreground/70 mb-1 font-medium">Certificates Earned</p>
                <p className="text-2xl font-bold text-foreground">2</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {!selectedChapter ? (
            // Chapters List View
            <>
              {chapters.length === 0 ? (
                <Card className="p-6 border-2 border-border/40 bg-card">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Content coming soon</h3>
                  <p className="text-sm text-muted-foreground">
                    Lessons for this language are not available yet. Select ASL to start learning
                    now.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {chapters.map((chapter, index) => (
                <Card
                  key={chapter.id}
                  className={`p-6 border-2 ${
                        index % 2 === 0
                          ? 'border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5'
                          : 'border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5'
                      } hover:shadow-xl transition-all cursor-pointer`}
                  onClick={() => {
                    setSelectedChapter(chapter)
                    setSelectedLesson(chapter.lessons[0] || null)
                  }}
                >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{chapter.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {chapter.description}
                          </p>
                        </div>
                        {chapter.completed && (
                          <Badge className="bg-primary text-primary-foreground">Completed</Badge>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="text-foreground font-semibold">
                              {chapter.progress}%
                            </span>
                          </div>
                          <Progress value={chapter.progress} className="w-full" />
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground pt-2">
                          <span>
                            {chapter.lessons.filter((l) => l.completed).length}/
                            {chapter.lessons.length} lessons
                          </span>
                          <span>→</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Chapter Detail View
            <div className="space-y-6">
              {/* Back Button */}
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedChapter(null)
                  setSelectedLesson(null)
                  setPracticeMode(false)
                  setCameraEnabled(false)
                  stopPractice()
                }}
                className="border-border/30"
              >
                ← Back to Chapters
              </Button>

              {!practiceMode ? (
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Lessons List */}
                  <div className="lg:col-span-1">
                    <Card className="p-6 border-border/30 bg-card">
                      <h2 className="text-xl font-semibold text-foreground mb-4">Lessons</h2>
                      <div className="space-y-3">
                        {selectedChapter.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-colors ${
                              selectedLesson?.id === lesson.id
                                ? 'bg-primary/15 border-primary/40'
                                : 'bg-background/20 border-border/30 hover:bg-background/30'
                            }`}
                            onClick={() => setSelectedLesson(lesson)}
                          >
                            <span className="text-foreground font-semibold mt-0.5">
                              {lesson.completed ? '✓' : '○'}
                            </span>
                            <div>
                              <p className="font-medium text-foreground text-sm">{lesson.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{lesson.content}</p>
                              {lesson.videoUrl ? (
                                <p className="text-[11px] text-primary mt-1">Video available</p>
                              ) : (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  Video coming soon
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Lesson Content */}
                  <div className="lg:col-span-2">
                    <Card className="p-8 border-2 border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5">
                      <h2 className="text-2xl font-bold text-foreground mb-4">
                        {selectedChapter.title}
                      </h2>

                      {/* Demo Video */}
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg border border-border/30 flex items-center justify-center mb-8 overflow-hidden">
                        {selectedLesson?.videoUrl ? (
                          <iframe
                            className="w-full h-full"
                            src={getEmbedUrl(selectedLesson.videoUrl)}
                            title={`Demo: ${selectedLesson.title}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className="text-center space-y-4">
                            <p className="text-foreground font-semibold">
                              {selectedLesson ? `Demo: ${selectedLesson.title}` : 'Demo'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Select a lesson with a video to start
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="space-y-4 mb-8">
                        <h3 className="text-lg font-semibold text-foreground">How to Sign</h3>
                        <ol className="space-y-2 text-foreground/80 font-medium text-sm list-decimal list-inside">
                          <li>Position your hands at chest level</li>
                          <li>Watch the demonstration video above</li>
                          <li>Practice the hand shape and movements</li>
                          <li>Use camera to get real-time feedback</li>
                          <li>Repeat until the motion feels natural</li>
                        </ol>
                      </div>

                      {/* Practice Button */}
                      <Button
                        onClick={handlePractice}
                        size="lg"
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={!selectedLesson}
                      >
                        Start Practice with Camera
                      </Button>
                      {!selectedLesson ? (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Select a lesson to enable camera practice.
                        </p>
                      ) : null}
                    </Card>
                  </div>
                </div>
              ) : (
                // Practice Mode
                <Card className="p-8 border-2 border-accent/30 bg-gradient-to-br from-accent/15 to-accent/5">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-foreground">Practice Mode</h2>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPracticeMode(false)
                          stopPractice()
                        }}
                        className="border-border/30"
                      >
                        End Practice
                      </Button>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Camera View */}
                      <div>
                        <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg border border-border/30 overflow-hidden mb-4">
                          <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="h-[60%] w-[60%] rounded-md border-2 border-green-400/80 shadow-[0_0_12px_rgba(74,222,128,0.35)]" />
                          </div>
                          <canvas ref={canvasRef} className="hidden" />
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                          Position yourself in front of your camera
                        </p>
                      </div>

                      {/* Feedback Panel */}
                      <div className="space-y-4">
                        <div className="p-6 bg-background/30 rounded-lg border border-border/30">
                          <p className="text-sm text-muted-foreground mb-2">Recognition Score</p>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-4xl font-bold text-primary">{recognitionScore}%</p>
                            <Badge
                              className={
                                recognitionScore >= 80
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                  : recognitionScore >= 60
                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                              }
                            >
                              {recognitionScore >= 80
                                ? 'Excellent'
                                : recognitionScore >= 60
                                  ? 'Good'
                                  : 'Keep Trying'}
                            </Badge>
                          </div>
                          <Progress value={recognitionScore} className="w-full" />
                        </div>
                        <div className="p-4 bg-background/30 rounded-lg border border-border/30">
                          <p className="text-sm text-muted-foreground mb-2">Predicted Letter</p>
                          <p className="text-2xl font-bold text-foreground">{predictedLabel}</p>
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Target: {targetLabel}</span>
                            {isMatch === null ? (
                              <span>Waiting for prediction</span>
                            ) : isMatch ? (
                              <span className="text-green-400">Correct</span>
                            ) : (
                              <span className="text-red-400">Incorrect</span>
                            )}
                          </div>
                          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                            {top3.length === 0 ? (
                              <p>Top-3 will appear here.</p>
                            ) : (
                              top3.map((item) => (
                                <p key={item.label}>
                                  {item.label}: {(item.score * 100).toFixed(0)}%
                                </p>
                              ))
                            )}
                          </div>
                        </div>
                        {backendStatus !== 'running' && (
                          <div className="p-4 bg-background/30 rounded-lg border border-border/30 text-xs text-muted-foreground">
                            {backendStatus === 'idle' && 'Waiting for backend...'}
                            {backendStatus === 'error' && (backendError || 'Backend error.')}
                          </div>
                        )}

                        {/* Tips */}
                        <div className="p-4 bg-background/30 rounded-lg border border-border/30">
                          <p className="font-semibold text-foreground text-sm mb-3">Tips</p>
                          <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>• Keep your hands visible in the frame</li>
                            <li>• Make clear, deliberate movements</li>
                            <li>• Position arms at chest level</li>
                            <li>• Face the camera directly</li>
                          </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-primary hover:bg-primary/90"
                            onClick={() => {
                              lastPredRef.current = 0
                            }}
                          >
                            Try Again
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full border-border/30 bg-transparent"
                            onClick={() => {
                              lastPredRef.current = 0
                            }}
                          >
                            Analyze Again
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Tracker */}
                    <div className="pt-6 border-t border-border/30">
                      <p className="text-sm text-muted-foreground mb-3">Session Progress</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-3 flex-1 rounded-full ${
                              i <= 3
                                ? 'bg-primary'
                                : 'bg-background/50 border border-border/30'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">3/5 attempts completed</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 border-t border-border">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-foreground mb-8">Why Learn With Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 hover:shadow-lg transition-all">
              <h3 className="font-semibold text-foreground mb-2">Video Lessons</h3>
              <p className="text-sm text-foreground/80 font-medium">
                High-quality demonstrations by fluent instructors
              </p>
            </Card>
            <Card className="p-6 border-2 border-secondary/30 bg-gradient-to-br from-secondary/15 to-secondary/5 hover:shadow-lg transition-all">
              <h3 className="font-semibold text-foreground mb-2">AI Feedback</h3>
              <p className="text-sm text-foreground/80 font-medium">
                Real-time analysis of your hand movements
              </p>
            </Card>
            <Card className="p-6 border-2 border-accent/30 bg-gradient-to-br from-accent/15 to-accent/5 hover:shadow-lg transition-all">
              <h3 className="font-semibold text-foreground mb-2">Progress Tracking</h3>
              <p className="text-sm text-foreground/80 font-medium">
                Track your improvement over time
              </p>
            </Card>
            <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 hover:shadow-lg transition-all">
              <h3 className="font-semibold text-foreground mb-2">Certificates</h3>
              <p className="text-sm text-foreground/80 font-medium">
                Earn certificates upon completion
              </p>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
