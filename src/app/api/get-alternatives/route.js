import { travelPlannerAI } from '../../../lib/travel-ai'

export async function POST(request) {
  try {
    const { type, item, location } = await request.json()

    if (!type || !item || !location) {
      return Response.json({ error: 'Type, item, and location are required' }, { status: 400 })
    }

    const alternatives = await travelPlannerAI.getAlternatives(type, item, location)
    
    return Response.json(alternatives)
  } catch (error) {
    console.error('Error in get-alternatives:', error)
    return Response.json(
      { error: 'Failed to get alternatives' }, 
      { status: 500 }
    )
  }
}
