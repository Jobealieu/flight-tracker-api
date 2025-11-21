let currentFlights = [];
let currentSort = null;

document.addEventListener("DOMContentLoaded", function () {
  setupTabs();
  loadLiveFlights();
});

function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");

      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(targetTab).classList.add("active");
    });
  });
}

function showLoading() {
  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("error-message").classList.add("hidden");
}

function hideLoading() {
  document.getElementById("loading").classList.add("hidden");
}

function showError(message) {
  const errorElement = document.getElementById("error-message");
  errorElement.textContent = message;
  errorElement.classList.remove("hidden");
  hideLoading();
}

async function loadLiveFlights() {
  const status = document.getElementById("flight-status").value;
  const airline = document.getElementById("airline-filter").value;
  const resultsContainer = document.getElementById("live-flights-results");

  showLoading();
  resultsContainer.innerHTML = "";

  try {
    let url = "/api/flights/live?limit=20";
    if (status) url += `&flight_status=${status}`;
    if (airline) url += `&airline=${encodeURIComponent(airline)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    hideLoading();

    if (!data.data || data.data.length === 0) {
      resultsContainer.innerHTML =
        '<div class="no-results">No flights found matching your criteria.</div>';
      return;
    }

    currentFlights = data.data;
    displayFlights(currentFlights, resultsContainer);
  } catch (error) {
    console.error("Error loading flights:", error);
    showError(
      "Failed to load flights. Please check your connection and try again."
    );
  }
}

async function searchFlight() {
  const flightNumber = document
    .getElementById("flight-number-search")
    .value.trim();
  const resultsContainer = document.getElementById("search-flight-results");

  if (!flightNumber) {
    showError("Please enter a flight number or IATA code.");
    return;
  }

  showLoading();
  resultsContainer.innerHTML = "";

  try {
    const response = await fetch(
      `/api/flights/search?flight_iata=${encodeURIComponent(flightNumber)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    hideLoading();

    if (!data.data || data.data.length === 0) {
      resultsContainer.innerHTML =
        '<div class="no-results">Flight not found. Please check the flight number and try again.</div>';
      return;
    }

    displayFlights(data.data, resultsContainer);
  } catch (error) {
    console.error("Error searching flight:", error);
    showError(
      "Failed to search flight. Please check the flight number and try again."
    );
  }
}

async function searchAirports() {
  const searchTerm = document.getElementById("airport-search").value.trim();
  const resultsContainer = document.getElementById("airports-results");

  showLoading();
  resultsContainer.innerHTML = "";

  try {
    let url = "/api/airports?limit=50";
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    hideLoading();

    if (!data.data || data.data.length === 0) {
      resultsContainer.innerHTML =
        '<div class="no-results">No airports found. Try a different search term or load all airports.</div>';
      return;
    }

    displayAirports(data.data, resultsContainer);
  } catch (error) {
    console.error("Error searching airports:", error);
    showError("Failed to load airports. Please try again.");
  }
}

async function searchAirlines() {
  const searchTerm = document.getElementById("airline-search").value.trim();
  const resultsContainer = document.getElementById("airlines-results");

  showLoading();
  resultsContainer.innerHTML = "";

  try {
    let url = "/api/airlines?limit=50";
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    hideLoading();

    if (!data.data || data.data.length === 0) {
      resultsContainer.innerHTML =
        '<div class="no-results">No airlines found. Try a different search term or load all airlines.</div>';
      return;
    }

    displayAirlines(data.data, resultsContainer);
  } catch (error) {
    console.error("Error searching airlines:", error);
    showError("Failed to load airlines. Please try again.");
  }
}

function sortFlights(criteria) {
  if (!currentFlights || currentFlights.length === 0) return;

  const sortedFlights = [...currentFlights];

  switch (criteria) {
    case "airline":
      sortedFlights.sort((a, b) => {
        const nameA = a.airline?.name || "";
        const nameB = b.airline?.name || "";
        return nameA.localeCompare(nameB);
      });
      break;
    case "departure":
      sortedFlights.sort((a, b) => {
        const timeA = a.departure?.scheduled || "";
        const timeB = b.departure?.scheduled || "";
        return timeA.localeCompare(timeB);
      });
      break;
    case "status":
      sortedFlights.sort((a, b) => {
        const statusA = a.flight_status || "";
        const statusB = b.flight_status || "";
        return statusA.localeCompare(statusB);
      });
      break;
  }

  currentFlights = sortedFlights;
  const resultsContainer = document.getElementById("live-flights-results");
  displayFlights(currentFlights, resultsContainer);
}

function displayFlights(flights, container) {
  container.innerHTML = "";

  flights.forEach((flight) => {
    const flightCard = createFlightCard(flight);
    container.appendChild(flightCard);
  });
}

function createFlightCard(flight) {
  const card = document.createElement("div");
  card.className = "flight-card";

  const flightNumber = flight.flight?.iata || flight.flight?.number || "N/A";
  const airlineName = flight.airline?.name || "Unknown Airline";
  const status = flight.flight_status || "unknown";

  const departureAirport = flight.departure?.airport || "Unknown";
  const departureIata = flight.departure?.iata || "N/A";
  const departureTime = formatDateTime(flight.departure?.scheduled);

  const arrivalAirport = flight.arrival?.airport || "Unknown";
  const arrivalIata = flight.arrival?.iata || "N/A";
  const arrivalTime = formatDateTime(flight.arrival?.scheduled);

  const aircraftType = flight.aircraft?.registration || "N/A";

  card.innerHTML = `
        <div class="flight-header">
            <div class="flight-number">${flightNumber}</div>
            <div class="status-badge status-${status}">${status}</div>
        </div>
        
        <div class="detail-item">
            <div class="detail-label">Airline</div>
            <div class="detail-value">${airlineName}</div>
        </div>
        
        <div class="flight-route">
            <div class="route-point">
                <div class="airport-code">${departureIata}</div>
                <div class="airport-name">${departureAirport}</div>
            </div>
            <div class="route-arrow">→</div>
            <div class="route-point">
                <div class="airport-code">${arrivalIata}</div>
                <div class="airport-name">${arrivalAirport}</div>
            </div>
        </div>
        
        <div class="flight-details">
            <div class="detail-item">
                <div class="detail-label">Departure</div>
                <div class="detail-value">${departureTime}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Arrival</div>
                <div class="detail-value">${arrivalTime}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Aircraft</div>
                <div class="detail-value">${aircraftType}</div>
            </div>
        </div>
    `;

  return card;
}

function displayAirports(airports, container) {
  container.innerHTML = "";

  airports.forEach((airport) => {
    const card = document.createElement("div");
    card.className = "airport-card";

    card.innerHTML = `
            <div class="flight-header">
                <div class="flight-number">${airport.iata_code || "N/A"} - ${
      airport.airport_name || "Unknown Airport"
    }</div>
            </div>
            <div class="flight-details">
                <div class="detail-item">
                    <div class="detail-label">Country</div>
                    <div class="detail-value">${
                      airport.country_name || "N/A"
                    }</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">City</div>
                    <div class="detail-value">${
                      airport.city_iata_code || "N/A"
                    }</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">ICAO Code</div>
                    <div class="detail-value">${
                      airport.icao_code || "N/A"
                    }</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Timezone</div>
                    <div class="detail-value">${airport.timezone || "N/A"}</div>
                </div>
            </div>
        `;

    container.appendChild(card);
  });
}

function displayAirlines(airlines, container) {
  container.innerHTML = "";

  airlines.forEach((airline) => {
    const card = document.createElement("div");
    card.className = "airline-card";

    card.innerHTML = `
            <div class="flight-header">
                <div class="flight-number">${
                  airline.airline_name || "Unknown Airline"
                }</div>
            </div>
            <div class="flight-details">
                <div class="detail-item">
                    <div class="detail-label">IATA Code</div>
                    <div class="detail-value">${
                      airline.iata_code || "N/A"
                    }</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">ICAO Code</div>
                    <div class="detail-value">${
                      airline.icao_code || "N/A"
                    }</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Country</div>
                    <div class="detail-value">${
                      airline.country_name || "N/A"
                    }</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Fleet Size</div>
                    <div class="detail-value">${
                      airline.fleet_size || "N/A"
                    }</div>
                </div>
            </div>
        `;

    container.appendChild(card);
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return dateString;
  }
}
