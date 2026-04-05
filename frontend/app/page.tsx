import Link from 'next/link'
import Image from 'next/image'
import { Activity, Map, MessageSquare } from 'lucide-react'
import { DuxLogo } from '@/components/dux-logo'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col relative overflow-hidden text-foreground">
      {/* Ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[150px] opacity-10 bg-strava" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full blur-[150px] opacity-10 bg-blue-600" />

      <nav className="w-full px-6 py-4 flex justify-between items-center z-10 border-b border-border bg-background/50 backdrop-blur-md">
        <DuxLogo size={32} />
        <Link
          href="/auth/login"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Iniciar sesión
        </Link>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10 text-center">
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

        <Link href="/auth/login">
          <Image
            src="/connect-with-strava.png"
            alt="Connect with Strava"
            width={237}
            height={48}
            priority
          />
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

      <footer className="z-10 py-8 flex justify-center items-center">
        <p className="text-xs text-muted-foreground">Powered by <span className="text-strava font-semibold">Strava</span></p>
      </footer>
    </main>
  )
}
