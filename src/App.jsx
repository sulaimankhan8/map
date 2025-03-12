import React, { useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { kml } from "@mapbox/togeojson";
import { DOMParser } from "xmldom";

const FitBounds = ({ data }) => {
  const map = useMap();
  if (data) {
    const bounds = data.features
      .flatMap((feature) => feature.geometry.coordinates)
      .map((coord) => (Array.isArray(coord[0]) ? coord.flat() : coord))
      .map(([lng, lat]) => [lat, lng]); // Convert to Leaflet [lat, lng]

    if (bounds.length) {
      map.fitBounds(bounds);
    }
  }
  return null;
};

const App = () => {
  const [kmlData, setKmlData] = useState(null);
  const [summary, setSummary] = useState({});
  const [details, setDetails] = useState(null);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const kmlText = e.target.result;
        const kmlDom = new DOMParser().parseFromString(kmlText, "text/xml");
        const parsedData = kml(kmlDom);
        setKmlData(parsedData);
        calculateSummary(parsedData);
      };
      reader.readAsText(file);
    }
  };

  // Calculate summary of KML elements
  const calculateSummary = (data) => {
    const elementCounts = {};
    data.features.forEach((feature) => {
      const type = feature.geometry.type;
      elementCounts[type] = (elementCounts[type] || 0) + 1;
    });
    console.log("Summary Data:", elementCounts);
    setSummary(elementCounts);
  };

  // Calculate detailed information
  const calculateDetails = () => {
    if (!kmlData) return;
    const detailsData = kmlData.features.map((feature) => {
      const { type, coordinates } = feature.geometry;
      return {
        type,
        length: type.includes("LineString") ? calculateLength(coordinates) : null,
      };
    });
    setDetails(detailsData);
  };

  // Calculate length of LineString or MultiLineString
  const calculateLength = (coordinates) => {
    let totalLength = 0;
    const lines = Array.isArray(coordinates[0][0]) ? coordinates : [coordinates]; // Normalize to array of lines
    lines.forEach((line) => {
      for (let i = 1; i < line.length; i++) {
        const [x1, y1] = line[i - 1];
        const [x2, y2] = line[i];
        totalLength += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      }
    });
    return totalLength.toFixed(2);
  };

  return (
    <div>
      <h1>KML File Reader</h1>
      <input type="file" accept=".kml" onChange={handleFileUpload} />
      {summary && (
        <div>
          <button onClick={() => setDetails(null)}>Summary</button>
          <button onClick={calculateDetails}>Detailed</button>
        </div>
      )}
      {summary && !details && (
        <div>
          <h2>Summary</h2>
          <table border="1">
            <thead>
              <tr>
                <th>Element Type</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summary).map(([type, count]) => (
                <tr key={type}>
                  <td>{type}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {details && (
        <div>
          <h2>Detailed Information</h2>
          <table border="1">
            <thead>
              <tr>
                <th>Element Type</th>
                <th>Length (approx.)</th>
              </tr>
            </thead>
            <tbody>
              {details.map((detail, index) => (
                <tr key={index}>
                  <td>{detail.type}</td>
                  <td>{detail.length ? `${detail.length} units` : "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {kmlData && (
        <MapContainer center={[0, 0]} zoom={2} style={{ height: "500px", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeoJSON data={kmlData} />
          <FitBounds data={kmlData} />
        </MapContainer>
      )}
    </div>
  );
};

export default App;