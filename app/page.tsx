import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Shield } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-white py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-xl font-bold">FindSafety</h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/dashboard" className="hover:underline">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:underline">
                  About
                </Link>
              </li>
              <li>
                <Button variant="secondary" className="text-primary">
                  Sign In
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary to-primary/80 text-white py-20">
          <div className="container mx-auto text-center px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Stay Informed. Stay Safe.</h1>
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto">
              Explore crime patterns in South Africa with advanced data visualization and AI-powered insights.
            </p>
            <Button asChild size="lg" variant="secondary" className="text-primary font-semibold">
              <Link href="/dashboard">
                Explore Crime Data <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-primary">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                title="Interactive Crime Maps"
                description="Visualize crime hotspots and patterns with interactive heatmaps and filters."
                icon="map"
              />
              <FeatureCard
                title="AI-Powered Insights"
                description="Get plain-language explanations of crime trends and patterns in your area."
                icon="brain"
              />
              <FeatureCard
                title="Personalized Alerts"
                description="Receive notifications about crime trends and safety concerns in areas you care about."
                icon="bell"
              />
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8 text-primary">How It Works</h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg mb-8">
                FindSafety aggregates official crime data from the South African Police Service (SAPS) and other trusted
                sources. Our platform uses advanced analytics and AI to help you understand crime patterns, identify
                trends, and make informed decisions about your safety.
              </p>
              <Button asChild variant="outline" className="border-primary text-primary">
                <Link href="/about">Learn More About Our Data</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Shield className="h-5 w-5" />
              <span className="font-bold">FindSafety</span>
            </div>
            <div className="text-sm">© {new Date().getFullYear()} FindSafety. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

interface FeatureCardProps {
  title: string
  description: string
  icon: string
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  const icons = {
    map: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 mb-4 text-primary mx-auto"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
    ),
    brain: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 mb-4 text-primary mx-auto"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
    bell: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 mb-4 text-primary mx-auto"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center">
      {icon === "map" && icons.map}
      {icon === "brain" && icons.brain}
      {icon === "bell" && icons.bell}
      <h3 className="text-xl font-bold mb-3 text-primary">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
