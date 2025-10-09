import React, { useEffect, useRef } from 'react'
import L from 'leaflet'

// Ensure marker images resolve with Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

const MapPicker = ({ lat = 6.9271, lon = 79.8612, onChange }) => {
  const mapRef = useRef(null)
    const containerRef = useRef(null)
    const markerRef = useRef(null)

  // Initialize the Leaflet map once. We intentionally omit lat/lon from the
  // dependency array to avoid recreating the map on prop changes. Marker updates are
  // handled in a separate effect below. We include `onChange` here because it's stable
  // in our usage and avoids linter warnings.
  useEffect(() => {
    // If mapRef already contains a map instance, skip initialization
    if (mapRef.current) return
    const center = [Number(lat) || 6.9271, Number(lon) || 79.8612]
      const map = L.map(containerRef.current, { attributionControl: true }).setView(center, 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)

    const marker = L.marker(center, { draggable: false }).addTo(map)
    markerRef.current = marker

    function onMapClick(e) {
      const { lat: clickedLat, lng: clickedLng } = e.latlng
      marker.setLatLng([clickedLat, clickedLng])
      onChange && onChange({ latitude: clickedLat, longitude: clickedLng })
    }

    map.on('click', onMapClick)
    // store map instance so we can cleanup
      mapRef.current = map

    return () => {
      map.off('click', onMapClick)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    }, [onChange, lat, lon])

  // update marker if external lat/lon props change
  useEffect(() => {
    if (markerRef.current && lat != null && lon != null) {
      markerRef.current.setLatLng([Number(lat), Number(lon)])
      if (mapRef.current) mapRef.current.setView([Number(lat), Number(lon)])
    }
  }, [lat, lon])

  return <div ref={containerRef} style={{ height: 300, width: '100%' }} />
}

export default MapPicker
