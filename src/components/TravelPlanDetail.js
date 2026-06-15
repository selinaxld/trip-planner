'use client'

import { useState } from 'react'
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Plane, 
  Hotel, 
  Car, 
  Utensils, 
  Clock,
  Edit3,
  ExternalLink,
  Bookmark,
  Share2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function TravelPlanDetail({ plan, onBook, onCustomize }) {
  const [activeSection, setActiveSection] = useState('itinerary')
  const [bookingStatus, setBookingStatus] = useState({})

  const sections = [
    { id: 'itinerary', label: 'Itinerary', icon: Calendar },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'hotels', label: 'Hotels', icon: Hotel },
    { id: 'transport', label: 'Transport', icon: Car },
    { id: 'dining', label: 'Dining', icon: Utensils },
    { id: 'budget', label: 'Budget', icon: DollarSign }
  ]

  const handleBooking = async (type, item) => {
    setBookingStatus(prev => ({ ...prev, [type]: 'loading' }))
    
    try {
      // Simulate booking process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Here you would integrate with actual booking APIs
      const bookingResult = await onBook(type, item)
      
      setBookingStatus(prev => ({ ...prev, [type]: 'success' }))
    } catch (error) {
      setBookingStatus(prev => ({ ...prev, [type]: 'error' }))
    }
  }

  const getBookingLinks = (type, item) => {
    const links = {
      flight: {
        expedia: `https://www.expedia.com/Flights`,
        kayak: `https://www.kayak.com/flights`,
        skyscanner: `https://www.skyscanner.com/`
      },
      hotel: {
        booking: `https://www.booking.com/`,
        expedia: `https://www.expedia.com/Hotels`,
        hotels: `https://www.hotels.com/`
      },
      car: {
        hertz: `https://www.hertz.com/`,
        enterprise: `https://www.enterprise.com/`,
        budget: `https://www.budget.com/`
      },
      restaurant: {
        opentable: `https://www.opentable.com/`,
        resy: `https://resy.com/`,
        yelp: `https://www.yelp.com/`
      }
    }
    
    return links[type] || {}
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Travel Plan</h1>
            <p className="text-gray-600">{plan.summary}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onCustomize(plan)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Customize
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors">
              <Bookmark className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-6">
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeSection === 'itinerary' && (
              <ItinerarySection plan={plan} />
            )}
            
            {activeSection === 'flights' && (
              <FlightsSection 
                flights={plan.transportation?.flights || []} 
                onBook={handleBooking}
                bookingStatus={bookingStatus}
                getBookingLinks={getBookingLinks}
              />
            )}
            
            {activeSection === 'hotels' && (
              <HotelsSection 
                hotels={plan.accommodation?.recommendations || []} 
                onBook={handleBooking}
                bookingStatus={bookingStatus}
                getBookingLinks={getBookingLinks}
              />
            )}
            
            {activeSection === 'transport' && (
              <TransportSection 
                transport={plan.transportation || {}} 
                onBook={handleBooking}
                bookingStatus={bookingStatus}
                getBookingLinks={getBookingLinks}
              />
            )}
            
            {activeSection === 'dining' && (
              <DiningSection 
                dining={plan.dining || {}} 
                onBook={handleBooking}
                bookingStatus={bookingStatus}
                getBookingLinks={getBookingLinks}
              />
            )}
            
            {activeSection === 'budget' && (
              <BudgetSection budget={plan.budget_breakdown || {}} />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function ItinerarySection({ plan }) {
  return (
    <div className="space-y-4">
      {plan.itinerary && plan.itinerary.length > 0 ? (
        plan.itinerary.map((day, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {day.day}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{day.location}</h3>
                <p className="text-sm text-gray-600">{day.date}</p>
              </div>
            </div>
            
            {day.activities && (
              <div className="space-y-3">
                {day.activities.map((activity, actIndex) => (
                  <div key={actIndex} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      {activity.time}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{activity.activity}</h4>
                      <p className="text-sm text-gray-600">{activity.location}</p>
                      {activity.cost && (
                        <p className="text-sm text-green-600 font-medium mt-1">{activity.cost}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <p className="text-gray-500">No detailed itinerary available yet.</p>
        </div>
      )}
    </div>
  )
}

function FlightsSection({ flights, onBook, bookingStatus, getBookingLinks }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Flight Options</h2>
      
      {flights.length > 0 ? (
        flights.map((flight, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Plane className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{flight.airline}</h3>
                  <p className="text-sm text-gray-600">{flight.duration}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{flight.price}</p>
                <p className="text-sm text-gray-600">per person</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <div>
                <p className="font-medium">Departure</p>
                <p>{flight.departure?.iataCode} - {flight.departure?.at}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">Arrival</p>
                <p>{flight.arrival?.iataCode} - {flight.arrival?.at}</p>
              </div>
            </div>
            
            <BookingButtons
              type="flight"
              item={flight}
              onBook={onBook}
              bookingStatus={bookingStatus}
              getBookingLinks={getBookingLinks}
            />
          </div>
        ))
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <p className="text-gray-500">No flight options available yet.</p>
        </div>
      )}
    </div>
  )
}

function HotelsSection({ hotels, onBook, bookingStatus, getBookingLinks }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Hotel Recommendations</h2>
      
      {hotels.length > 0 ? (
        hotels.map((hotel, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Hotel className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{hotel.name}</h3>
                  <p className="text-sm text-gray-600">{hotel.distance} from center</p>
                </div>
              </div>
            </div>
            
            <BookingButtons
              type="hotel"
              item={hotel}
              onBook={onBook}
              bookingStatus={bookingStatus}
              getBookingLinks={getBookingLinks}
            />
          </div>
        ))
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <p className="text-gray-500">No hotel recommendations available yet.</p>
        </div>
      )}
    </div>
  )
}

function TransportSection({ transport, onBook, bookingStatus, getBookingLinks }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Local Transportation</h2>
      
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {transport.car_rental && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Car Rental</h3>
            <p className="text-gray-600 mb-4">Car rental recommended for this trip</p>
            <BookingButtons
              type="car"
              item={{ type: 'car_rental' }}
              onBook={onBook}
              bookingStatus={bookingStatus}
              getBookingLinks={getBookingLinks}
            />
          </div>
        )}
        
        {transport.local_transport && transport.local_transport.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Local Transport Options</h3>
            <ul className="space-y-2">
              {transport.local_transport.map((option, index) => (
                <li key={index} className="text-gray-600">• {option}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function DiningSection({ dining, onBook, bookingStatus, getBookingLinks }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Dining Recommendations</h2>
      
      {dining.restaurants && dining.restaurants.length > 0 ? (
        dining.restaurants.map((restaurant, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Utensils className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                  <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
                </div>
              </div>
            </div>
            
            <BookingButtons
              type="restaurant"
              item={restaurant}
              onBook={onBook}
              bookingStatus={bookingStatus}
              getBookingLinks={getBookingLinks}
            />
          </div>
        ))
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Local Cuisine</h3>
          {dining.local_cuisine && dining.local_cuisine.length > 0 ? (
            <ul className="space-y-2">
              {dining.local_cuisine.map((dish, index) => (
                <li key={index} className="text-gray-600">• {dish}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No dining recommendations available yet.</p>
          )}
        </div>
      )}
    </div>
  )
}

function BudgetSection({ budget }) {
  const total = budget.total || 'TBD'
  const categories = Object.entries(budget).filter(([key]) => key !== 'total')
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Budget Breakdown</h2>
      
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="space-y-4">
          {categories.map(([category, amount]) => (
            <div key={category} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
              <span className="text-gray-700 capitalize">{category.replace('_', ' ')}</span>
              <span className="font-semibold text-gray-900">{amount}</span>
            </div>
          ))}
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-blue-600">{total}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingButtons({ type, item, onBook, bookingStatus, getBookingLinks }) {
  const links = getBookingLinks(type, item)
  const status = bookingStatus[type]

  return (
    <div className="flex gap-2 flex-wrap">
      {Object.entries(links).map(([platform, url]) => (
        <a
          key={platform}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          Book on {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </a>
      ))}
      
      {status === 'success' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4" />
          Booked Successfully
        </div>
      )}
      
      {status === 'error' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm">
          <XCircle className="w-4 h-4" />
          Booking Failed
        </div>
      )}
    </div>
  )
}
