// Create a map object centered at coordinates [0,0]
var myMap = L.map("map", {
  center: [0, 0],
  zoom: 2
});

// Map of cities with their corresponding geographical coordinates
const cityCoordinates = {
  // [latitude, longitude]
  "amsterdam": [52.370216, 4.895168], 
  "athens": [37.983810, 23.727539], 
  "barcelona": [41.385064, 2.173404], 
  "berlin": [52.520008, 13.404954], 
  "budapest": [47.497913, 19.040236], 
  "lisbon": [38.722252, -9.139337], 
  "london": [51.509865, -0.118092], 
  "paris": [48.864716, 2.349014], 
  "rome": [41.902782, 12.496366], 
  "vienna": [48.208176, 16.373819]
};

// Add OpenStreetMap tiles to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);

// Fetch data from the JSON file *change to flask route*
url = 'http://127.0.0.1:5000/api/v1.0/bedrooms'
d3.json(url, {mode: 'no-cors'}).then(function(data) {
  console.log(data);
});

fetch(url, {mode: 'no-cors'})
  .then(response => response.json() )
  .then(jsonData => {
    // Display JSON data in the console
    console.log(jsonData);

    // Store the fetched JSON data as the initial data
    let initialData = jsonData.slice(0,100);

    // Function to update the markers on the map
    function updateMarkers(data) {
      // Clear existing markers
      myMap.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          myMap.removeLayer(layer);
        }
      });

      // Add a marker for each item in the filtered data
      for (var i = 0; i < data.length; i++) {
        var airbnb = data[i];
        L.marker([airbnb.lat, airbnb.lng])
          .bindPopup(`<h3>Price: ${airbnb.realSum}</h3> <hr> <h3>Bedrooms: ${airbnb.bedrooms.toLocaleString()}</h3>`)
          .addTo(myMap);
      }
    }

    // Get the slider and the display paragraph elements
    var priceRange = document.getElementById('priceRange');
    var selectedPrice = document.getElementById('selectedPrice');

    // Update the displayed price when the slider changes
    priceRange.addEventListener('input', function() {
      selectedPrice.textContent = priceRange.value;
      // console.log(selectedPrice.textContent, priceRange.value);
    });

    

    // Add a click event listener to the filter button
    document.getElementById("filter-btn").addEventListener("click", function () {
      // Get the selected city, price, and day type
      let selectedCity = document.getElementById("selCity").value;
      let price = Number(priceRange.value);
      let selectedWeekday = document.getElementById("weekday").checked;
      let selectedWeekend = document.getElementById("weekend").checked;
      console.log(selectedCity, price, selectedWeekday, selectedWeekend);
      // Filter the data based on user inputs
      var filteredData = initialData.filter(item => {
        //var correctDayType = (
        //  (item.day_type === 'weekday' && selectedWeekday) ||
        //  (item.day_type === 'weekend' && selectedWeekend)
        //);
    
        return (
          //item.city === selectedCity &&
          item.realsum <= price //&&
          //correctDayType
        );
      });
      console.log(filteredData)
      // Center the map to the selected city
      if (cityCoordinates[selectedCity]) {
        myMap.setView(cityCoordinates[selectedCity], 13);
      }

      // Update markers based on the filtered data
      updateMarkers(filteredData);

      // Create chart visualizations
      createBedroomsBurstChart(filteredData);
      drawScatterPlot(filteredData);
      drawHistogram(filteredData);
    });

    // Declare the chart variables outside of the functions
    let piechart;
    let barchart;
    let scatterplot;
    let histogram;

    // Function to create pie and bar chart for bedrooms and price
    function createBedroomsBurstChart(data) {
      // Initialize the bedroom sums and counts
      var bedroomsSum = {};
      var bedroomsCount = {};

      for (var i = 0; i < data.length; i++) {
        var numBedrooms = data[i].bedrooms;

        if (!bedroomsSum.hasOwnProperty(numBedrooms)) {
            bedroomsSum[numBedrooms] = 0;
            bedroomsCount[numBedrooms] = 0;
        }

        bedroomsSum[numBedrooms] += data[i].realSum;
        bedroomsCount[numBedrooms] += 1;
      }

      // Calculate the average price per bedroom
      var averagePrices = {};
      for (var key in bedroomsSum) {
        if (bedroomsSum.hasOwnProperty(key)) {
            averagePrices[key] = bedroomsSum[key] / bedroomsCount[key];
        }
      }

      console.log('averagePrices: ', averagePrices);
      console.log('averagePrices as Numbers: ', Object.values(averagePrices).map(Number));

      // Prepare data for the pie chart
      var piechartData = {
        labels: Object.keys(bedroomsCount),
        datasets: [
          {
            label: "Number of Airbnbs",
            data: Object.values(bedroomsCount),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF"
            ]
          }
        ]
      };

      // Get the context of the canvas element for the pie chart
      var ctx = document.getElementById('bedroomsChart').getContext('2d');

      // Destroy the previous pie chart if it exists
      if (piechart) {
        piechart.destroy();
      }

      // Create the pie chart
      piechart = new Chart(ctx, {
        type: 'pie',
        data: piechartData,
        options: {}
      });

      // Prepare data for the bar chart
      var priceChartData = {
        labels: Object.keys(averagePrices),
        datasets: [{
          label: 'Average Price',
          data: Object.values(averagePrices).map(Number),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      };

      // Configure options for the bar chart
      var priceOptions = {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Average Price'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Bedroom Type'
            }
          }
        }
      };

      // Get the context of the canvas element for the bar chart
      var priceCtx = document.getElementById('priceChart').getContext('2d');

      // Destroy the previous bar chart if it exists
      if (barchart) {
        barchart.destroy();
      }

      // Create the bar chart
      barchart = new Chart(priceCtx, {
        type: 'bar',
        data: priceChartData,
        options: priceOptions
      });
    }

    // Function to create a scatter plot
    function drawScatterPlot(data) {
      var ctx = document.getElementById('scatterChart').getContext('2d');

      // Destroy the previous scatter chart if it exists
      if (scatterplot) {
        scatterplot.destroy();
      }

      // Create the scatter plot
      scatterplot = new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Satisfaction vs Price',
            data: data.map(item => ({
              x: item.realSum,
              y: item.guest_satisfaction_overall
            })),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)'
          }]
        },
        options: {
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              title: {
                text: 'Price (realSum)',
                display: true
              }
            },
            y: {
              title: {
                text: 'Guest Satisfaction',
                display: true
              }
            }
          }
        }
      });
    }

    // Function to create a histogram
    function drawHistogram(data) {
      var ctx = document.getElementById('histogramChart').getContext('2d');

      // Destroy the previous histogram if it exists
      if (histogram) {
        histogram.destroy();
      }

      // Binning the data into ranges for cleanliness ratings
      var bins = Array.from({length: 11}, (_, i) => i);  // 11 bins for cleanliness ratings 0-10
      var counts = Array(11).fill(0);
      data.forEach(item => {
        if(item.cleanliness_rating >= 0 && item.cleanliness_rating <= 10) {
          counts[Math.floor(item.cleanliness_rating)]++;
        }
      });

      // Create the histogram
      histogram = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: bins,
          datasets: [{
            label: 'Count',
            data: counts,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            x: {
              title: {
                text: 'Cleanliness Rating',
                display: true
              }
            },
            y: {
              title: {
                text: 'Count',
                display: true
              }
            }
          }
        }
      });
    }
  });
