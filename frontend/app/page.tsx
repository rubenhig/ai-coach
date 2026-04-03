export default function Home() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">GPTrainer</h1>
        <p className="text-muted-foreground text-lg">
          Planifica tus entrenamientos con IA
        </p>
        <a
          href="/auth/login"
          className="inline-flex items-center gap-2 bg-[#FC4C02] hover:bg-[#e04302] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Conectar con Strava
        </a>
      </div>
    </main>
  )
}
