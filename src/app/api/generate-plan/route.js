import { NextResponse } from 'next/server'
import { travelPlannerAI } from '../../../lib/travel-ai'
import { amadeusClient } from '../../../lib/amadeus'
import { supabase } from '../../../lib/supabase'

export async function POST(request) {
  try {
    const { userInput } = await request.json()

    if (!userInput) {
      return NextResponse.json({ error: 'User input is required' }, { status: 400 })
    }

    // Generate AI travel plan
    console.log('Generating AI travel plan...')
    const aiPlan = await travelPlannerAI.generateTravelPlan(userInput)

    // Extract locations for API calls
    const extractedInfo = extractTravelInfo(userInput)
    
    // Fetch real data from Amadeus API (if configured)
    let flightData = null
    let hotelData = null
    let poiData = null

    try {
      if (extractedInfo.origin && extractedInfo.destination && extractedInfo.departureDate) {
        console.log('Fetching flight data...')
        flightData = await amadeusClient.searchFlights(
          extractedInfo.origin,
          extractedInfo.destination,
          extractedInfo.departureDate,
          extractedInfo.returnDate,
          extractedInfo.adults
        )
      }

      if (extractedInfo.destination && extractedInfo.checkInDate && extractedInfo.checkOutDate) {
        console.log('Fetching hotel data...')
        hotelData = await amadeusClient.searchHotels(
          extractedInfo.destination,
          extractedInfo.checkInDate,
          extractedInfo.checkOutDate,
          extractedInfo.adults
        )
      }

      if (extractedInfo.latitude && extractedInfo.longitude) {
        console.log('Fetching points of interest...')
        poiData = await amadeusClient.getPointsOfInterest(
          extractedInfo.latitude,
          extractedInfo.longitude
        )
      }
    } catch (amadeusError) {
      console.warn('Amadeus API error (continuing with AI-only plan):', amadeusError.message)
    }

    // Enhance AI plan with real data
    const enhancedPlan = await travelPlannerAI.enhancePlanWithRealData(
      aiPlan,
      flightData,
      hotelData,
      poiData
    )

    // Save plan to Supabase (optional)
    try {
      const { data, error } = await supabase
        .from('travel_plans')
        .insert([
          {
            user_input: userInput,
            plan_data: enhancedPlan,
            created_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) {
        console.warn('Supabase save error:', error.message)
      } else {
        enhancedPlan.id = data[0].id
      }
    } catch (supabaseError) {
      console.warn('Supabase error (plan not saved):', supabaseError.message)
    }

    return NextResponse.json(enhancedPlan)

  } catch (error) {
    console.error('Error generating travel plan:', error)
    
    // Return a fallback plan
    const fallbackPlan = {
      summary: "I understand you're planning a trip! While I couldn't generate a detailed plan due to a technical issue, here are some general recommendations based on your request.",
      itinerary: [
        {
          day: 1,
          date: new Date().toISOString().split('T')[0],
          location: "Destination",
          activities: [
            {
              time: "09:00",
              activity: "Arrival and check-in",
              location: "Hotel",
              category: "accommodation"
            },
            {
              time: "14:00",
              activity: "Explore city center",
              location: "Downtown area",
              category: "sightseeing"
            }
          ]
        }
      ],
      transportation: {
        flights: [],
        local_transport: ["Public transport", "Taxi", "Walking"],
        car_rental: false
      },
      accommodation: {
        recommendations: [],
        budget_range: "Contact travel agent for specific recommendations"
      },
      dining: {
        restaurants: [],
        local_cuisine: ["Try local specialties", "Visit local markets"]
      },
      budget_breakdown: {
        total: "Please provide more specific details for accurate budget estimation"
      },
      tips: [
        "Research local customs and etiquette",
        "Check visa requirements",
        "Consider travel insurance",
        "Pack according to local weather"
      ]
    }

    return NextResponse.json(fallbackPlan)
  }
}

function extractTravelInfo(userInput) {
  // Simple extraction logic - in a real app, you'd use more sophisticated NLP
  const input = userInput.toLowerCase()
  
  // Extract common airport codes or city names
  const airportCodes = input.match(/\b[A-Z]{3}\b/g) || []
  const cities = ['paris', 'london', 'tokyo', 'new york', 'rome', 'barcelona', 'amsterdam']
  const foundCities = cities.filter(city => input.includes(city))
  
  // Extract dates
  const datePatterns = [
    /\d{4}-\d{2}-\d{2}/g,
    /\d{1,2}\/\d{1,2}\/\d{4}/g,
    /\d{1,2}-\d{1,2}-\d{4}/g
  ]
  
  let dates = []
  datePatterns.forEach(pattern => {
    const matches = input.match(pattern)
    if (matches) dates.push(...matches)
  })

  // Extract number of adults
  const adultMatch = input.match(/(\d+)\s*(adult|person|people|passenger)/i)
  const adults = adultMatch ? parseInt(adultMatch[1]) : 1

  return {
    origin: airportCodes[0] || (foundCities[0] ? foundCities[0].toUpperCase().slice(0, 3) : null),
    destination: airportCodes[1] || (foundCities[1] ? foundCities[1].toUpperCase().slice(0, 3) : null),
    departureDate: dates[0],
    returnDate: dates[1],
    checkInDate: dates[0],
    checkOutDate: dates[1] || dates[0],
    adults,
    // Mock coordinates for major cities (in real app, use geocoding API)
    latitude: foundCities.includes('paris') ? 48.8566 : foundCities.includes('london') ? 51.5074 : null,
    longitude: foundCities.includes('paris') ? 2.3522 : foundCities.includes('london') ? -0.1278 : null
  }
}
