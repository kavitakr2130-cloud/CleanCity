import React, { useState } from "react";
import { getCurrentLocation } from "../services/locationService";

const LocationTest: React.FC = () => {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleLocation = async () => {
    try {
      const position = await getCurrentLocation();

      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      setAccuracy(position.coords.accuracy);
      setError("");
    } catch (err: any) {
     console.log(err);
setError(JSON.stringify(err));
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>📍 Location Test</h2>

      <button onClick={handleLocation}>
        Detect My Location
      </button>

      <br />
      <br />

      {latitude && (
        <>
          <p><b>Latitude:</b> {latitude}</p>
          <p><b>Longitude:</b> {longitude}</p>
          <p><b>Accuracy:</b> {accuracy} meters</p>
        </>
      )}

      {error && (
        <p style={{ color: "red" }}>{error}</p>
      )}
    </div>
  );
};

export default LocationTest;