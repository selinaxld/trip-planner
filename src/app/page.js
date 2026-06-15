'use client'

import TravelPlanningWorkflow from '../components/TravelPlanningWorkflow'
import TopBar from '../components/TopBar'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <TravelPlanningWorkflow />
    </div>
  )
}
