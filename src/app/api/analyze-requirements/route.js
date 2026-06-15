import { travelPlannerAI } from '../../../lib/travel-ai'

export async function POST(request) {
  try {
    const { userInput } = await request.json()

    if (!userInput) {
      return Response.json({ error: 'User input is required' }, { status: 400 })
    }

    const analysis = await travelPlannerAI.analyzeRequirements(userInput)
    
    return Response.json(analysis)
  } catch (error) {
    console.error('Error in analyze-requirements:', error)
    return Response.json(
      { error: 'Failed to analyze requirements' }, 
      { status: 500 }
    )
  }
}
