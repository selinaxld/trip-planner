import { travelPlannerAI } from '../../../lib/travel-ai'

export async function POST(request) {
  try {
    const { travelDetails } = await request.json()

    if (!travelDetails) {
      return Response.json({ error: 'Travel details are required' }, { status: 400 })
    }

    const itinerary = await travelPlannerAI.generateDetailedItinerary(travelDetails)
    
    return Response.json(itinerary)
  } catch (error) {
    console.error('Error in generate-itinerary:', error)
    return Response.json(
      { error: 'Failed to generate itinerary' }, 
      { status: 500 }
    )
  }
}
