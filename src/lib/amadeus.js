import axios from 'axios'

class AmadeusClient {
  constructor() {
    this.baseURL = 'https://api.amadeus.com/v1'
    this.testBaseURL = 'https://test.api.amadeus.com/v1'
    this.accessToken = null
  }

  async getAccessToken() {
    try {
      const response = await axios.post(`${this.testBaseURL}/security/oauth2/token`, {
        grant_type: 'client_credentials',
        client_id: process.env.AMADEUS_API_KEY,
        client_secret: process.env.AMADEUS_API_SECRET
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      
      this.accessToken = response.data.access_token
      return this.accessToken
    } catch (error) {
      console.error('Error getting Amadeus access token:', error)
      throw error
    }
  }

  async searchFlights(origin, destination, departureDate, returnDate = null, adults = 1) {
    if (!this.accessToken) {
      await this.getAccessToken()
    }

    try {
      const params = {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate,
        adults,
        max: 10
      }

      if (returnDate) {
        params.returnDate = returnDate
      }

      const response = await axios.get(`${this.testBaseURL}/shopping/flight-offers`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        params
      })

      return response.data
    } catch (error) {
      console.error('Error searching flights:', error)
      throw error
    }
  }

  async searchHotels(cityCode, checkInDate, checkOutDate, adults = 1, radius = 5) {
    if (!this.accessToken) {
      await this.getAccessToken()
    }

    try {
      const response = await axios.get(`${this.testBaseURL}/reference-data/locations/hotels/by-city`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: {
          cityCode,
          radius
        }
      })

      return response.data
    } catch (error) {
      console.error('Error searching hotels:', error)
      throw error
    }
  }

  async getPointsOfInterest(latitude, longitude, radius = 1) {
    if (!this.accessToken) {
      await this.getAccessToken()
    }

    try {
      const response = await axios.get(`${this.testBaseURL}/reference-data/locations/pois`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: {
          latitude,
          longitude,
          radius
        }
      })

      return response.data
    } catch (error) {
      console.error('Error getting points of interest:', error)
      throw error
    }
  }
}

export const amadeusClient = new AmadeusClient()
