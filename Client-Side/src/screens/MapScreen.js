import React, { useEffect, useState } from "react";
import { View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { GOOGLE_MAPS_API_KEY } from "@env"; // Ensure you have this in your .env file

export default function MapScreen({ route, navigation }) {
  const [routeCoords, setRouteCoords] = useState([]);
  const { stops } = route.params;

  const convertedStops = stops.map((stop, index) => ({
    latitude: parseFloat(stop.lat),
    longitude: parseFloat(stop.lon),
    longitude: stop.name,
  }));

  console.log("Route Stops: ", stops, convertedStops);

  useEffect(() => {
    const getRoute = async () => {
      const origin = convertedStops[0];
      const destination = convertedStops[convertedStops.length - 1];
      const waypoints = convertedStops
        .slice(1, -1)
        .map((p) => `${p.latitude},${p.longitude}`)
        .join("|");

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=${waypoints}&key=${GOOGLE_MAPS_API_KEY}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.routes && json.routes.length > 0) {
        const points = decodePolyline(json.routes[0].overview_polyline.points);
        setRouteCoords(points);
      } else {
        console.error("No routes found:", json);
      }
    };

    getRoute();
  }, []);

  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return points;
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: convertedStops[0].latitude,
          longitude: convertedStops[0].longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
      >
        {convertedStops.map((stop, i) => (
          <Marker key={i} coordinate={stop} title={stop.name} />
        ))}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="#1E90FF"
          />
        )}
      </MapView>
    </View>
  );
}

