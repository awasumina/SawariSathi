import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const GOOGLE_MAPS_APIKEY = 'YOUR_API_KEY';

export default function MultiStopMap() {
  const [routeCoords, setRouteCoords] = useState([]);

  const stops = [
    { latitude: 37.773972, longitude: -122.431297 }, // Stop 1
    { latitude: 37.7749, longitude: -122.4194 },      // Stop 2
    { latitude: 37.776, longitude: -122.417 },        // Stop 3
    { latitude: 37.778, longitude: -122.415 },        // Stop 4
  ];

  useEffect(() => {
    const getRoute = async () => {
      const origin = stops[0];
      const destination = stops[stops.length - 1];
      const waypoints = stops
        .slice(1, -1)
        .map(p => `${p.latitude},${p.longitude}`)
        .join('|');

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=${waypoints}&key=${GOOGLE_MAPS_APIKEY}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.routes.length) {
        const points = decodePolyline(json.routes[0].overview_polyline.points);
        setRouteCoords(points);
      }
    };

    getRoute();
  }, []);

  const decodePolyline = (t) => {
    let points = [], index = 0, lat = 0, lng = 0;

    while (index < t.length) {
      let b, shift = 0, result = 0;
      do { b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift; shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0; result = 0;
      do { b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift; shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
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
          latitude: stops[0].latitude,
          longitude: stops[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {stops.map((coord, index) => (
          <Marker key={index} coordinate={coord} title={`Stop ${index + 1}`} />
        ))}

        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
        )}
      </MapView>
    </View>
  );
}


