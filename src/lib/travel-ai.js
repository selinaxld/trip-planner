const GEMINI_MODEL = 'gemini-2.5-flash'

function parseJsonFromLLM(text) {
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Empty LLM response')

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenced) return JSON.parse(fenced[1].trim())

  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }
    throw new Error('No JSON found in LLM response')
  }
}

function normalizeItineraryResponse(parsed, fallback) {
  if (!parsed || typeof parsed !== 'object') return fallback

  const itinerary = parsed.itinerary ?? parsed.days ?? parsed.schedule
  if (!Array.isArray(itinerary) || itinerary.length === 0) return fallback

  return {
    itinerary,
    total_estimated_cost: parsed.total_estimated_cost ?? parsed.total_cost ?? fallback.total_estimated_cost,
    travel_tips: parsed.travel_tips ?? parsed.tips ?? fallback.travel_tips,
  }
}

async function callGemini(apiKey, body, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()
    if (data.error) {
      const message = data.error.message || 'Gemini API error'
      const retryable = /high demand|overloaded|unavailable|try again/i.test(message)
      if (retryable && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }
      throw new Error(message)
    }
    return data
  }
}

export class TravelPlannerAI {
  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY
  }

  async analyzeRequirements(userInput) {
    const systemPrompt = `You are a travel requirements analyzer. Extract travel details from user input and identify missing information.

    Analyze the user input and extract the following details:
    - travel_start_date: YYYY-MM-DD format (if mentioned)
    - duration: number of days (if mentioned)
    - number_of_people: number of travelers (if mentioned)
    - destinations: array of cities/countries (if mentioned)
    - points_of_interest: array of specific attractions/activities (if mentioned)
    - travel_type: business/leisure/adventure/cultural/romantic/family/solo (if mentioned)
    - budget: budget amount and currency (if mentioned)

    Return JSON format:
    {
      "extracted_details": {
        "travel_start_date": "value or null",
        "duration": "value or null",
        "number_of_people": "value or null",
        "destinations": ["array or empty"],
        "points_of_interest": ["array or empty"],
        "travel_type": "value or null",
        "budget": "value or null"
      },
      "missing_details": ["list of missing required fields"],
      "recommendations": {
        "destinations": ["suggested destinations based on input"],
        "travel_type": ["suggested travel types"],
        "duration": ["suggested durations like 3-5 days, 1 week, etc."],
        "budget": ["budget ranges like $1000-2000, $2000-5000, etc."]
      }
    }`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: systemPrompt + '\n\nUser Input: ' + userInput }] }
            ]
          })
        }
      )

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error.message)
      }
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      try {
        return parseJsonFromLLM(resultText)
      } catch {
        return this.createDefaultAnalysis(userInput)
      }
    } catch (error) {
      console.error('Error analyzing requirements:', error)
      return this.createDefaultAnalysis(userInput)
    }
  }

  createDefaultAnalysis(userInput) {
    return {
      extracted_details: {
        travel_start_date: null,
        duration: null,
        number_of_people: null,
        destinations: [],
        points_of_interest: [],
        travel_type: null,
        budget: null
      },
      missing_details: ['travel_start_date', 'duration', 'number_of_people', 'destinations', 'travel_type', 'budget'],
      recommendations: {
        destinations: ['Paris', 'Tokyo', 'New York', 'Rome', 'London'],
        travel_type: ['leisure', 'cultural', 'adventure', 'romantic'],
        duration: ['3-5 days', '1 week', '2 weeks'],
        budget: ['$1000-2000', '$2000-5000', '$5000+']
      }
    }
  }

  async generateDetailedItinerary(travelDetails) {
    const destinations = travelDetails.destinations?.length
      ? travelDetails.destinations.join(', ')
      : 'Not specified'
    const pointsOfInterest = travelDetails.points_of_interest?.length
      ? travelDetails.points_of_interest.join(', ')
      : 'Not specified'

    const systemPrompt = `You are a detailed travel itinerary planner. Create a comprehensive day-by-day itinerary based on the provided travel details.

    Travel Details:
    - Start Date: ${travelDetails.travel_start_date}
    - Duration: ${travelDetails.duration} days
    - People: ${travelDetails.number_of_people ?? 'Not specified'}
    - Destinations: ${destinations}
    - Points of Interest: ${pointsOfInterest}
    - Travel Type: ${travelDetails.travel_type ?? 'Not specified'}
    - Budget: ${travelDetails.budget ?? 'Not specified'}

    Create exactly ${travelDetails.duration} day(s) of itinerary, one entry per day starting from the start date.

    Return JSON format:
    {
      "itinerary": [
        {
          "date": "YYYY-MM-DD",
          "city": "City Name",
          "hotel": {
            "name": "Hotel Name",
            "description": "Brief description",
            "price_range": "$100-200/night",
            "rating": 4.5,
            "amenities": ["WiFi", "Pool", "Gym"]
          },
          "places_of_interest": [
            {
              "name": "Attraction Name",
              "description": "Detailed description",
              "visit_time": "2-3 hours",
              "entry_fee": "$15",
              "best_time": "Morning",
              "rating": 4.8
            }
          ],
          "restaurants": [
            {
              "name": "Restaurant Name",
              "cuisine": "Local/International",
              "description": "Restaurant description",
              "price_range": "$20-40 per person",
              "meal_type": "breakfast/lunch/dinner",
              "rating": 4.6
            }
          ]
        }
      ],
      "total_estimated_cost": "$2500",
      "travel_tips": ["Tip 1", "Tip 2"]
    }`

    const fallback = this.createDefaultItinerary(travelDetails)

    try {
      const data = await callGemini(this.apiKey, {
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      })

      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      try {
        return normalizeItineraryResponse(parseJsonFromLLM(resultText), fallback)
      } catch {
        return fallback
      }
    } catch (error) {
      console.error('Error generating itinerary:', error)
      return fallback
    }
  }

  createDefaultItinerary(travelDetails) {
    const duration = Math.max(1, parseInt(travelDetails.duration, 10) || 1)
    const startDate = travelDetails.travel_start_date || new Date().toISOString().split('T')[0]
    const city = travelDetails.destinations?.[0] || 'Paris'

    const dayTemplate = {
      city,
      hotel: {
        name: 'Sample Hotel',
        description: 'Comfortable accommodation in city center',
        price_range: '$100-150/night',
        rating: 4.2,
        amenities: ['WiFi', 'Breakfast'],
      },
      places_of_interest: [
        {
          name: 'Main Attraction',
          description: 'Must-visit landmark',
          visit_time: '2-3 hours',
          entry_fee: '$15',
          best_time: 'Morning',
          rating: 4.5,
        },
      ],
      restaurants: [
        {
          name: 'Local Restaurant',
          cuisine: 'Local',
          description: 'Traditional local cuisine',
          price_range: '$25-35 per person',
          meal_type: 'dinner',
          rating: 4.3,
        },
      ],
    }

    const itinerary = Array.from({ length: duration }, (_, index) => {
      const date = new Date(startDate)
      date.setDate(date.getDate() + index)
      return {
        ...dayTemplate,
        date: date.toISOString().split('T')[0],
      }
    })

    return {
      itinerary,
      total_estimated_cost: travelDetails.budget || '$1500',
      travel_tips: ['Book accommodations in advance', 'Try local cuisine'],
    }
  }

  async getAlternatives(type, currentItem, location) {
    const systemPrompt = `Generate 5 alternative ${type} options in ${location} similar to "${currentItem.name}".

    Return JSON format:
    {
      "alternatives": [
        {
          "name": "Alternative Name",
          "description": "Description",
          "price_range": "Price range",
          "rating": 4.5,
          "distance_from_center": "2km",
          "special_features": ["Feature 1", "Feature 2"]
        }
      ]
    }`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: systemPrompt }] }
            ]
          })
        }
      )

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error.message)
      }
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      try {
        return parseJsonFromLLM(resultText)
      } catch {
        return { alternatives: [] }
      }
    } catch (error) {
      console.error('Error getting alternatives:', error)
      return { alternatives: [] }
    }
  }

  async generateTravelPlan(userInput) {
    const systemPrompt = `You are a professional travel planner AI. Analyze the user's travel requirements and generate a detailed, personalized travel plan.

    User Input Format:
    - Destinations: List of places to visit
    - Points of Interest: Specific attractions or activities
    - Travel Type: (Business, Leisure, Adventure, Cultural, Romantic, Family, Solo, etc.)
    - Budget: Budget range or specific amount
    - Duration: Length of trip
    - Preferences: Any specific requirements or preferences

    Output Format (JSON):
    {
      "summary": "Brief overview of the travel plan",
      "itinerary": [
        {
          "day": 1,
          "date": "YYYY-MM-DD",
          "location": "City/Location",
          "activities": [
            {
              "time": "HH:MM",
              "activity": "Activity description",
              "location": "Specific venue",
              "duration": "Duration in hours",
              "cost": "Estimated cost",
              "category": "sightseeing|dining|transport|accommodation|entertainment"
            }
          ]
        }
      ],
      "transportation": {
        "flights": [],
        "local_transport": [],
        "car_rental": boolean
      },
      "accommodation": {
        "recommendations": [],
        "budget_range": "price range"
      },
      "dining": {
        "restaurants": [],
        "local_cuisine": []
      },
      "budget_breakdown": {
        "accommodation": "amount",
        "transportation": "amount",
        "activities": "amount",
        "dining": "amount",
        "total": "amount"
      },
      "tips": ["Travel tips and recommendations"],
      "packing_list": ["Essential items to pack"],
      "emergency_info": {
        "contacts": [],
        "important_numbers": []
      }
    }

    Make the plan detailed, practical, and personalized based on the user's preferences.`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: systemPrompt + '\n' + userInput }] }
            ]
          })
        }
      )

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error.message)
      }
      const planText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      try {
        return JSON.parse(planText)
      } catch {
        return this.parseTextToPlan(planText)
      }
    } catch (error) {
      console.error('Error generating travel plan:', error)
      throw error
    }
  }

  parseTextToPlan(text) {
    // Fallback parser for non-JSON responses
    return {
      summary: text.substring(0, 200) + '...',
      itinerary: [],
      transportation: { flights: [], local_transport: [], car_rental: false },
      accommodation: { recommendations: [], budget_range: 'TBD' },
      dining: { restaurants: [], local_cuisine: [] },
      budget_breakdown: { total: 'TBD' },
      tips: [text],
      packing_list: [],
      emergency_info: { contacts: [], important_numbers: [] }
    }
  }

  async enhancePlanWithRealData(plan, amadeusFlight, amadeusHotels, amadeusActivities) {
    // Integrate real API data with AI-generated plan
    const enhancedPlan = { ...plan }

    if (amadeusFlight && amadeusFlight.data) {
      enhancedPlan.transportation.flights = amadeusFlight.data.slice(0, 3).map(flight => ({
        airline: flight.validatingAirlineCodes[0],
        duration: flight.itineraries[0].duration,
        price: flight.price.total,
        departure: flight.itineraries[0].segments[0].departure,
        arrival: flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival
      }))
    }

    if (amadeusHotels && amadeusHotels.data) {
      enhancedPlan.accommodation.recommendations = amadeusHotels.data.slice(0, 5).map(hotel => ({
        name: hotel.name,
        distance: hotel.distance?.value || 'N/A',
        chainCode: hotel.chainCode
      }))
    }

    return enhancedPlan
  }
}

export const travelPlannerAI = new TravelPlannerAI()
