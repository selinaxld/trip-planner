'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Plane, MapPin, Calendar, DollarSign, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatInterface({ onPlanGenerated }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your travel planning assistant. Tell me about your dream trip! I need to know:\n\n📍 **Destinations** - Where would you like to go?\n🎯 **Points of Interest** - Any specific attractions or activities?\n✈️ **Travel Type** - Business, leisure, adventure, family trip?\n💰 **Budget** - What's your budget range?\n📅 **Duration** - How long is your trip?\n\nJust describe your travel plans in natural language, and I'll create a personalized itinerary for you!"
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Add thinking message
      const thinkingMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Analyzing your travel requirements and creating a personalized plan...',
        isThinking: true
      }
      setMessages(prev => [...prev, thinkingMessage])

      // Call the API to generate travel plan
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userInput: inputValue })
      })

      if (!response.ok) {
        throw new Error('Failed to generate travel plan')
      }

      const travelPlan = await response.json()

      // Remove thinking message and add result
      setMessages(prev => prev.filter(msg => !msg.isThinking))

      const botResponse = {
        id: Date.now() + 2,
        type: 'bot',
        content: 'I\'ve created a personalized travel plan for you! Here\'s what I found:',
        travelPlan
      }

      setMessages(prev => [...prev, botResponse])
      
      // Notify parent component about the generated plan
      if (onPlanGenerated) {
        onPlanGenerated(travelPlan)
      }

    } catch (error) {
      console.error('Error generating plan:', error)
      
      // Remove thinking message and add error
      setMessages(prev => prev.filter(msg => !msg.isThinking))
      
      const errorMessage = {
        id: Date.now() + 3,
        type: 'bot',
        content: 'I apologize, but I encountered an error while generating your travel plan. Please try again with more specific details about your destination, travel dates, and preferences.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Plane className="text-blue-600" />
            TripPlanner AI
          </h1>
          <p className="text-gray-600 text-sm mt-1">Your intelligent travel planning assistant</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'bot' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div className={`max-w-3xl ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-white shadow-sm border'
                    }`}
                  >
                    {message.isThinking ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{message.content}</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                    
                    {message.travelPlan && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <TravelPlanPreview plan={message.travelPlan} />
                      </div>
                    )}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex justify-center">
          <div className="flex gap-3 w-[90vw] max-w-4xl">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your travel plans... (e.g., 'I want to visit Paris and Rome for 7 days with a $3000 budget for a romantic getaway')"
                className="w-full p-3 pr-12 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Destinations
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Dates
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Budget
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TravelPlanPreview({ plan }) {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: MapPin },
    { id: 'itinerary', label: 'Itinerary', icon: Calendar },
    { id: 'budget', label: 'Budget', icon: DollarSign }
  ]

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Your Travel Plan</h3>
      
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg p-4">
        {activeTab === 'overview' && (
          <div>
            <p className="text-gray-700 mb-4">{plan.summary}</p>
            {plan.tips && plan.tips.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Travel Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {plan.tips.slice(0, 3).map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div>
            {plan.itinerary && plan.itinerary.length > 0 ? (
              <div className="space-y-4">
                {plan.itinerary.slice(0, 3).map((day, index) => (
                  <div key={index} className="border-l-2 border-blue-200 pl-4">
                    <h4 className="font-medium text-gray-900">
                      Day {day.day} - {day.location}
                    </h4>
                    {day.activities && (
                      <div className="mt-2 space-y-1">
                        {day.activities.slice(0, 2).map((activity, actIndex) => (
                          <div key={actIndex} className="text-sm text-gray-600">
                            <span className="font-medium">{activity.time}:</span> {activity.activity}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {plan.itinerary.length > 3 && (
                  <p className="text-sm text-gray-500 italic">
                    ...and {plan.itinerary.length - 3} more days
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Detailed itinerary will be available in the full plan.</p>
            )}
          </div>
        )}

        {activeTab === 'budget' && (
          <div>
            {plan.budget_breakdown ? (
              <div className="space-y-2">
                {Object.entries(plan.budget_breakdown).map(([category, amount]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{category.replace('_', ' ')}:</span>
                    <span className="font-medium">{amount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Budget breakdown will be calculated in the full plan.</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          View Full Plan
        </button>
        <button className="flex-1 bg-gray-200 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
          Customize Plan
        </button>
      </div>
    </div>
  )
}
