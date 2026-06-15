'use client'

import { useState } from 'react'
import { Calendar, Users, MapPin, DollarSign, Clock, Star, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const DEFAULT_TRAVEL_DETAILS = {
  travel_start_date: null,
  duration: null,
  number_of_people: null,
  destinations: [],
  points_of_interest: [],
  travel_type: null,
  budget: null,
}

export default function TravelPlanningWorkflow() {
  const [step, setStep] = useState(1)
  const [userInput, setUserInput] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [travelDetails, setTravelDetails] = useState(DEFAULT_TRAVEL_DETAILS)
  const [error, setError] = useState(null)
  const [itinerary, setItinerary] = useState(null)
  const [hoveredItem, setHoveredItem] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [alternatives, setAlternatives] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyzeRequirements = async () => {
    if (!userInput.trim()) return
    
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/analyze-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput })
      })
      
      const data = await response.json()
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to analyze requirements. Please try again.')
        return
      }

      setAnalysis(data)
      setTravelDetails({ ...DEFAULT_TRAVEL_DETAILS, ...data.extracted_details })
      setStep(2)
    } catch (error) {
      console.error('Error analyzing requirements:', error)
      setError('Failed to analyze requirements. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateItinerary = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ travelDetails })
      })
      
      const data = await response.json()
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to generate itinerary. Please try again.')
        return
      }

      if (!Array.isArray(data.itinerary) || data.itinerary.length === 0) {
        setError('Received an empty itinerary. Please try again.')
        return
      }

      setItinerary(data)
      setStep(3)
    } catch (error) {
      console.error('Error generating itinerary:', error)
      setError('Failed to generate itinerary. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetAlternatives = async (type, item, location) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/get-alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, item, location })
      })
      
      const data = await response.json()
      setAlternatives(data.alternatives)
      setSelectedItem({ type, item, location })
    } catch (error) {
      console.error('Error getting alternatives:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateTravelDetail = (key, value) => {
    setTravelDetails(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Step 1: User Input */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 shadow-sm border"
        >
          <h2 className="text-2xl font-bold mb-4">Tell us about your dream trip</h2>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Describe your travel plans... (e.g., 'I want to visit Paris and Rome for 7 days with my partner, budget around $3000, interested in museums and romantic restaurants')"
            className="w-full p-4 border rounded-lg h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}
          <button
            onClick={handleAnalyzeRequirements}
            disabled={!userInput.trim() || isLoading}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Requirements'}
          </button>
        </motion.div>
      )}

      {/* Step 2: Complete Missing Details */}
      {step === 2 && analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 shadow-sm border"
        >
          <h2 className="text-2xl font-bold mb-4">Complete your travel details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="inline w-4 h-4 mr-2" />
                Start Date
              </label>
              <input
                type="date"
                value={travelDetails.travel_start_date || ''}
                onChange={(e) => updateTravelDetail('travel_start_date', e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Clock className="inline w-4 h-4 mr-2" />
                Duration (days)
              </label>
              <input
                type="number"
                value={travelDetails.duration || ''}
                onChange={(e) => updateTravelDetail('duration', parseInt(e.target.value))}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 7"
              />
              {analysis.recommendations?.duration && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {analysis.recommendations.duration.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => updateTravelDetail('duration', option.split(' ')[0])}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-blue-100 rounded-full"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Number of People */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Users className="inline w-4 h-4 mr-2" />
                Number of Travelers
              </label>
              <input
                type="number"
                value={travelDetails.number_of_people || ''}
                onChange={(e) => updateTravelDetail('number_of_people', parseInt(e.target.value))}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <DollarSign className="inline w-4 h-4 mr-2" />
                Budget
              </label>
              <input
                type="text"
                value={travelDetails.budget || ''}
                onChange={(e) => updateTravelDetail('budget', e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., $3000"
              />
              {analysis.recommendations?.budget && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {analysis.recommendations.budget.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => updateTravelDetail('budget', option)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-blue-100 rounded-full"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destinations */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                <MapPin className="inline w-4 h-4 mr-2" />
                Destinations
              </label>
              <input
                type="text"
                value={travelDetails.destinations?.join(', ') || ''}
                onChange={(e) => updateTravelDetail('destinations', e.target.value.split(', '))}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Paris, Rome"
              />
              {analysis.recommendations?.destinations && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {analysis.recommendations.destinations.map((destination, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const current = travelDetails.destinations || []
                        if (!current.includes(destination)) {
                          updateTravelDetail('destinations', [...current, destination])
                        }
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-blue-100 rounded-full"
                    >
                      {destination}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Travel Type */}
            <div className="md:col-span-2">
			<label className="block text-sm font-medium mb-2">Travel Type</label>
              <div className="flex flex-wrap gap-2">
                {analysis.recommendations.travel_type?.map((type, index) => (
                  <button
                    key={index}
                    onClick={() => updateTravelDetail('travel_type', type)}
                    className={`px-4 py-2 rounded-lg border ${
                      travelDetails.travel_type === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-white hover:bg-blue-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={handleGenerateItinerary}
            disabled={isLoading || !travelDetails.travel_start_date || !travelDetails.duration}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Itinerary...
              </>
            ) : (
              'Generate Detailed Itinerary'
            )}
          </button>
        </motion.div>
      )}

      {/* Step 3: Detailed Itinerary Table */}
      {step === 3 && itinerary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 shadow-sm border"
        >
          <h2 className="text-2xl font-bold mb-4">Your Detailed Itinerary</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left">Date</th>
                  <th className="border border-gray-300 p-3 text-left">City</th>
                  <th className="border border-gray-300 p-3 text-left">Hotel</th>
                  <th className="border border-gray-300 p-3 text-left">Places of Interest</th>
                  <th className="border border-gray-300 p-3 text-left">Restaurants</th>
                </tr>
              </thead>
              <tbody>
                {itinerary.itinerary?.map((day, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3">{day.date}</td>
                    <td className="border border-gray-300 p-3 font-medium">{day.city}</td>
                    
                    {/* Hotel */}
                    <td className="border border-gray-300 p-3">
                      <div
                        className="relative cursor-pointer hover:text-blue-600"
                        onMouseEnter={() => setHoveredItem({ type: 'hotel', data: day.hotel })}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => handleGetAlternatives('hotel', day.hotel, day.city)}
                      >
                        <div className="font-medium">{day.hotel.name}</div>
                        <div className="text-sm text-gray-600">{day.hotel.price_range}</div>
                        <div className="flex items-center text-sm">
                          <Star className="w-3 h-3 text-yellow-500 mr-1" />
                          {day.hotel.rating}
                        </div>
                      </div>
                    </td>

                    {/* Places of Interest */}
                    <td className="border border-gray-300 p-3">
                      {day.places_of_interest?.map((poi, poiIndex) => (
                        <div
                          key={poiIndex}
                          className="mb-2 cursor-pointer hover:text-blue-600"
                          onMouseEnter={() => setHoveredItem({ type: 'poi', data: poi })}
                          onMouseLeave={() => setHoveredItem(null)}
                          onClick={() => handleGetAlternatives('attraction', poi, day.city)}
                        >
                          <div className="font-medium">{poi.name}</div>
                          <div className="text-sm text-gray-600">{poi.entry_fee}</div>
                          <div className="flex items-center text-sm">
                            <Star className="w-3 h-3 text-yellow-500 mr-1" />
                            {poi.rating}
                          </div>
                        </div>
                      ))}
                    </td>

                    {/* Restaurants */}
                    <td className="border border-gray-300 p-3">
                      {day.restaurants?.map((restaurant, restIndex) => (
                        <div
                          key={restIndex}
                          className="mb-2 cursor-pointer hover:text-blue-600"
                          onMouseEnter={() => setHoveredItem({ type: 'restaurant', data: restaurant })}
                          onMouseLeave={() => setHoveredItem(null)}
                          onClick={() => handleGetAlternatives('restaurant', restaurant, day.city)}
                        >
                          <div className="font-medium">{restaurant.name}</div>
                          <div className="text-sm text-gray-600">{restaurant.cuisine}</div>
                          <div className="text-sm text-gray-600">{restaurant.price_range}</div>
                          <div className="flex items-center text-sm">
                            <Star className="w-3 h-3 text-yellow-500 mr-1" />
                            {restaurant.rating}
                          </div>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Total Estimated Cost: {itinerary.total_estimated_cost}</h3>
            <div className="space-y-1">
              <h4 className="font-medium">Travel Tips:</h4>
              {itinerary.travel_tips?.map((tip, index) => (
                <div key={index} className="text-sm text-gray-700">• {tip}</div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Hover Popup */}
      <AnimatePresence>
        {hoveredItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-sm"
          >
            <h3 className="font-bold text-lg mb-2">{hoveredItem.data.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{hoveredItem.data.description}</p>
            <div className="space-y-1 text-sm">
              <div><strong>Price:</strong> {hoveredItem.data.price_range || hoveredItem.data.entry_fee}</div>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <strong>Rating:</strong> {hoveredItem.data.rating}
              </div>
              {hoveredItem.data.amenities && (
                <div><strong>Amenities:</strong> {hoveredItem.data.amenities.join(', ')}</div>
              )}
              {hoveredItem.data.visit_time && (
                <div><strong>Visit Time:</strong> {hoveredItem.data.visit_time}</div>
              )}
              {hoveredItem.data.cuisine && (
                <div><strong>Cuisine:</strong> {hoveredItem.data.cuisine}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alternatives Modal */}
      <AnimatePresence>
        {selectedItem && alternatives.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">
                Alternative {selectedItem.type}s in {selectedItem.location}
              </h3>
              <div className="space-y-4">
                {alternatives.map((alt, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <h4 className="font-medium text-lg">{alt.name}</h4>
                    <p className="text-gray-600 text-sm mb-2">{alt.description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span><strong>Price:</strong> {alt.price_range}</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        {alt.rating}
                      </div>
                    </div>
                    {alt.special_features && (
                      <div className="mt-2 text-sm">
                        <strong>Features:</strong> {alt.special_features.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
