import Link from 'next/link'
import { Activity, Map, MessageSquare, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col relative overflow-hidden text-foreground">
      {/* Ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[150px] opacity-10 bg-strava" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full blur-[150px] opacity-10 bg-blue-600" />

      <nav className="w-full px-6 py-4 flex justify-between items-center z-10 border-b border-border bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-strava flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">GPTrainer</span>
        </div>
        <Link
          href="/auth/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Iniciar sesión
        </Link>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-sm text-muted-foreground mb-8">
          <span className="w-2 h-2 rounded-full bg-strava animate-pulse" />
          Conectado con tus datos reales de Strava
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
          Tu Coach Personal de <br />
          Resistencia,{' '}
          <span className="text-strava">Potenciado por IA.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl">
          Conecta tu cuenta, importa tu historial y deja que nuestro coach
          diseñe planes dinámicos, analice tu carga y optimice cada kilómetro
          basándose en tus datos reales.
        </p>

        <Link
          href="/auth/login"
          className="inline-flex items-center gap-3 h-14 px-8 text-lg font-bold rounded-lg bg-strava text-white hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(252,76,2,0.3)]"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
          Conectar con Strava
        </Link>

        <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" /> Análisis de carga
          </div>
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4" /> Rutas y tiempos
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Ajustes en tiempo real
          </div>
        </div>
      </div>
    </main>
  )
}
