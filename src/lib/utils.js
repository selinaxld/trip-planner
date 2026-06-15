import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  
  return new Date(date).toLocaleDateString('en-US', {
    ...defaultOptions,
    ...options,
  })
}

export function formatDateTime(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  
  return new Date(date).toLocaleDateString('en-US', {
    ...defaultOptions,
    ...options,
  })
}

export function calculateDaysBetween(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function extractEmailFromText(text) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  const match = text.match(emailRegex)
  return match ? match[0] : null
}

export function extractPhoneFromText(text) {
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/
  const match = text.match(phoneRegex)
  return match ? match[0] : null
}

export function generateTravelPlanId() {
  return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function sanitizeInput(input) {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
}

export function parseDurationToDays(text) {
  if (text == null || text === '') return null

  const normalized = String(text).toLowerCase().trim()

  const rangeMatch = normalized.match(/(\d+)\s*-\s*(\d+)\s*(day|days|night|nights)/)
  if (rangeMatch) {
    return parseInt(rangeMatch[2], 10)
  }

  const match = normalized.match(/(\d+)\s*(day|days|night|nights|week|weeks|month|months)/)
  if (!match) {
    const numericOnly = parseInt(normalized, 10)
    return Number.isNaN(numericOnly) ? null : numericOnly
  }

  const amount = parseInt(match[1], 10)
  const unit = match[2]

  if (unit.startsWith('week')) return amount * 7
  if (unit.startsWith('month')) return amount * 30
  return amount
}

export function parseUserInput(input) {
  const sanitizedInput = sanitizeInput(input)
  
  // Extract destinations
  const destinationKeywords = ['visit', 'go to', 'travel to', 'destination', 'city', 'country']
  const destinations = []
  
  // Extract budget
  const budgetRegex = /\$?([\d,]+)(?:\s*(?:dollar|usd|budget|spend))/gi
  const budgetMatch = sanitizedInput.match(budgetRegex)
  const budget = budgetMatch ? budgetMatch[0] : null
  
  // Extract travel type
  const travelTypes = {
    'business': ['business', 'work', 'conference', 'meeting'],
    'leisure': ['leisure', 'vacation', 'holiday', 'relax'],
    'adventure': ['adventure', 'hiking', 'outdoor', 'extreme'],
    'cultural': ['cultural', 'museum', 'history', 'art'],
    'romantic': ['romantic', 'honeymoon', 'anniversary', 'couple'],
    'family': ['family', 'kids', 'children', 'disney'],
    'solo': ['solo', 'alone', 'myself', 'individual']
  }
  
  let travelType = 'leisure' // default
  for (const [type, keywords] of Object.entries(travelTypes)) {
    if (keywords.some(keyword => sanitizedInput.toLowerCase().includes(keyword))) {
      travelType = type
      break
    }
  }
  
  // Extract duration
  const durationRegex = /(\d+)\s*(day|night|week|month)/gi
  const durationMatch = sanitizedInput.match(durationRegex)
  const duration = durationMatch ? durationMatch[0] : null
  
  return {
    originalInput: input,
    sanitizedInput,
    destinations,
    budget,
    travelType,
    duration,
    extractedData: {
      hasDestination: destinations.length > 0,
      hasBudget: !!budget,
      hasDuration: !!duration
    }
  }
}

export function validateTravelInput(parsedInput) {
  const errors = []
  const warnings = []
  
  if (!parsedInput.destinations || parsedInput.destinations.length === 0) {
    warnings.push('No specific destinations mentioned. Please specify where you\'d like to travel.')
  }
  
  if (!parsedInput.budget) {
    warnings.push('No budget mentioned. Including a budget will help create a more accurate plan.')
  }
  
  if (!parsedInput.duration) {
    warnings.push('No trip duration mentioned. Please specify how long you\'d like to travel.')
  }
  
  if (parsedInput.sanitizedInput.length < 10) {
    errors.push('Please provide more details about your travel plans.')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function generateShareableLink(planId) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/plan/${planId}`
  }
  return `/plan/${planId}`
}

export function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return Promise.resolve()
    } catch (err) {
      document.body.removeChild(textArea)
      return Promise.reject(err)
    }
  }
}

export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function throttle(func, limit) {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export const TRAVEL_CATEGORIES = {
  ACCOMMODATION: 'accommodation',
  TRANSPORTATION: 'transportation', 
  DINING: 'dining',
  ACTIVITIES: 'activities',
  SHOPPING: 'shopping',
  ENTERTAINMENT: 'entertainment'
}

export const BOOKING_PLATFORMS = {
  FLIGHTS: {
    expedia: 'https://www.expedia.com/Flights',
    kayak: 'https://www.kayak.com/flights',
    skyscanner: 'https://www.skyscanner.com/',
    google: 'https://www.google.com/travel/flights'
  },
  HOTELS: {
    booking: 'https://www.booking.com/',
    expedia: 'https://www.expedia.com/Hotels',
    hotels: 'https://www.hotels.com/',
    airbnb: 'https://www.airbnb.com/'
  },
  CARS: {
    hertz: 'https://www.hertz.com/',
    enterprise: 'https://www.enterprise.com/',
    budget: 'https://www.budget.com/',
    avis: 'https://www.avis.com/'
  },
  RESTAURANTS: {
    opentable: 'https://www.opentable.com/',
    resy: 'https://resy.com/',
    yelp: 'https://www.yelp.com/',
    tripadvisor: 'https://www.tripadvisor.com/'
  }
}
