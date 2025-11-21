require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.AVIATION_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

function handleError(res, error, message) {
  console.error(message, error.response ? error.response.data : error.message);
  res.status(500).json({
    error: message,
    details: error.response ? error.response.data : error.message,
  });
}

app.get("/api/flights/live", async (req, res) => {
  try {
    const { flight_status, airline, limit } = req.query;

    const params = {
      access_key: API_KEY,
      limit: limit || 20,
    };

    if (flight_status) params.flight_status = flight_status;
    if (airline) params.airline_name = airline;

    const response = await axios.get(
      "http://api.aviationstack.com/v1/flights",
      {
        params: params,
        timeout: 10000,
      }
    );

    if (!response.data || !response.data.data) {
      return res.status(404).json({ error: "No flight data available" });
    }

    res.json(response.data);
  } catch (error) {
    handleError(res, error, "Failed to fetch live flights");
  }
});

app.get("/api/flights/search", async (req, res) => {
  try {
    const { flight_iata, flight_number } = req.query;

    if (!flight_iata && !flight_number) {
      return res
        .status(400)
        .json({ error: "Flight IATA or flight number required" });
    }

    const params = {
      access_key: API_KEY,
    };

    if (flight_iata) params.flight_iata = flight_iata;
    if (flight_number) params.flight_number = flight_number;

    const response = await axios.get(
      "http://api.aviationstack.com/v1/flights",
      {
        params: params,
        timeout: 10000,
      }
    );

    if (
      !response.data ||
      !response.data.data ||
      response.data.data.length === 0
    ) {
      return res.status(404).json({ error: "Flight not found" });
    }

    res.json(response.data);
  } catch (error) {
    handleError(res, error, "Failed to search flight");
  }
});

app.get("/api/airports", async (req, res) => {
  try {
    const { search, limit } = req.query;

    const params = {
      access_key: API_KEY,
      limit: limit || 50,
    };

    const response = await axios.get(
      "http://api.aviationstack.com/v1/airports",
      {
        params: params,
        timeout: 10000,
      }
    );

    if (!response.data || !response.data.data) {
      return res.status(404).json({ error: "No airports found" });
    }

    let airportData = response.data.data;

    if (search) {
      const searchLower = search.toLowerCase();
      airportData = airportData.filter(
        (airport) =>
          (airport.airport_name &&
            airport.airport_name.toLowerCase().includes(searchLower)) ||
          (airport.iata_code &&
            airport.iata_code.toLowerCase().includes(searchLower)) ||
          (airport.city_iata_code &&
            airport.city_iata_code.toLowerCase().includes(searchLower)) ||
          (airport.country_name &&
            airport.country_name.toLowerCase().includes(searchLower))
      );
    }

    res.json({ ...response.data, data: airportData });
  } catch (error) {
    handleError(res, error, "Failed to fetch airports");
  }
});

app.get("/api/airlines", async (req, res) => {
  try {
    const { search, limit } = req.query;

    const params = {
      access_key: API_KEY,
      limit: limit || 50,
    };

    const response = await axios.get(
      "http://api.aviationstack.com/v1/airlines",
      {
        params: params,
        timeout: 10000,
      }
    );

    if (!response.data || !response.data.data) {
      return res.status(404).json({ error: "No airlines found" });
    }

    let airlineData = response.data.data;

    if (search) {
      const searchLower = search.toLowerCase();
      airlineData = airlineData.filter(
        (airline) =>
          (airline.airline_name &&
            airline.airline_name.toLowerCase().includes(searchLower)) ||
          (airline.iata_code &&
            airline.iata_code.toLowerCase().includes(searchLower)) ||
          (airline.icao_code &&
            airline.icao_code.toLowerCase().includes(searchLower)) ||
          (airline.country_name &&
            airline.country_name.toLowerCase().includes(searchLower))
      );
    }

    res.json({ ...response.data, data: airlineData });
  } catch (error) {
    handleError(res, error, "Failed to fetch airlines");
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Flight Tracker API running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});
