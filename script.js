// Advanced Real-Time Airplane Sound Intensity Map
class AdvancedSoundMap {
    constructor() {
        this.map = null;
        this.aircraftMarkers = new Map();
        this.soundMarkers = new Map();
        this.aircraftTrails = new Map();
        this.userLocationMarker = null;
        this.soundHistory = [];
        this.settings = {
            autoRefresh: true,
            showAircraft: true,
            updateInterval: 30,
            noiseThreshold: 70,
            notifications: false,
            trackHistory: false
        };
        this.currentLayer = 'street';
        this.isFullscreen = false;
        
        this.initMap();
        this.initControls();
        this.initGeocoder();
        this.startRealTimeUpdates();
        this.loadSettings();
    }
    
    initMap() {
        // Initialize map with multiple layers
        this.map = L.map('map', {
            center: [37.3541, -121.9552],
            zoom: 12,
            layers: []
        });
        
        // Street layer
        this.streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        });
        
        // Satellite layer
        this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri'
        });
        
        // Add default layer
        this.streetLayer.addTo(this.map);
        this.currentLayer = 'street';
        
        // Add click handler
        this.map.on('click', (e) => this.handleMapClick(e));
    }
    
    initGeocoder() {
        // Initialize geocoder for address search
        this.geocoder = L.Control.Geocoder.nominatim();
        
        // Add geocoder control to map
        L.Control.geocoder({
            geocoder: this.geocoder,
            position: 'topright',
            placeholder: 'Search for places...',
            showResultIcons: true
        }).addTo(this.map);
    }
    
    initControls() {
        // Address search
        document.getElementById('address-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchAddress();
            }
        });
        
        document.getElementById('search-btn').addEventListener('click', () => {
            this.searchAddress();
        });
        
        // My location button
        document.getElementById('my-location-btn').addEventListener('click', () => {
            this.getUserLocation();
        });
        
        // Map controls
        document.getElementById('layer-toggle').addEventListener('click', () => {
            this.toggleMapLayer();
        });
        
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });
        
        // Auto refresh toggle
        document.getElementById('toggle-auto-refresh').addEventListener('click', () => {
            this.settings.autoRefresh = !this.settings.autoRefresh;
            const btn = document.getElementById('toggle-auto-refresh');
            btn.textContent = `Auto Refresh: ${this.settings.autoRefresh ? 'ON' : 'OFF'}`;
            btn.className = this.settings.autoRefresh ? 'btn btn-primary' : 'btn btn-secondary';
            
            if (this.settings.autoRefresh) {
                this.startRealTimeUpdates();
            } else {
                this.stopRealTimeUpdates();
            }
        });
        
        // Manual refresh
        document.getElementById('refresh-now').addEventListener('click', () => {
            this.fetchRealTimeData();
        });
        
        // Toggle aircraft visibility
        document.getElementById('toggle-aircraft').addEventListener('click', () => {
            this.settings.showAircraft = !this.settings.showAircraft;
            const btn = document.getElementById('toggle-aircraft');
            btn.textContent = this.settings.showAircraft ? 'Hide Aircraft' : 'Show Aircraft';
            this.updateAircraftVisibility();
        });
        
        // Settings
        document.getElementById('noise-threshold').addEventListener('input', (e) => {
            this.settings.noiseThreshold = parseInt(e.target.value);
            document.getElementById('threshold-value').textContent = e.target.value;
            this.saveSettings();
        });
        
        document.getElementById('update-interval').addEventListener('change', (e) => {
            this.settings.updateInterval = parseInt(e.target.value);
            this.saveSettings();
            if (this.settings.autoRefresh) {
                this.startRealTimeUpdates();
            }
        });
        
        document.getElementById('notifications').addEventListener('change', (e) => {
            this.settings.notifications = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('sound-history').addEventListener('change', (e) => {
            this.settings.trackHistory = e.target.checked;
            this.saveSettings();
        });
        
        // Footer buttons
        document.getElementById('help-btn').addEventListener('click', () => {
            this.showHelp();
        });
        
        document.getElementById('about-btn').addEventListener('click', () => {
            this.showAbout();
        });
        
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });
        
        // Notification close
        document.getElementById('notification-close').addEventListener('click', () => {
            this.hideNotification();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    async searchAddress() {
        const query = document.getElementById('address-search').value.trim();
        if (!query) return;
        
        try {
            this.showLoading(true);
            const results = await this.geocoder.geocode(query);
            
            if (results && results.length > 0) {
                const result = results[0];
                this.map.setView([result.center.lat, result.center.lng], 15);
                this.showNotification(`Found: ${result.name}`, 'success');
                document.getElementById('location-text').textContent = `Search: ${result.name}`;
            } else {
                this.showNotification('Location not found', 'error');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            this.showNotification('Search failed', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    getUserLocation() {
        if (!navigator.geolocation) {
            this.showNotification('Geolocation not supported', 'error');
            return;
        }
        
        this.showLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                this.map.setView([lat, lng], 15);
                
                // Add user location marker
                if (this.userLocationMarker) {
                    this.map.removeLayer(this.userLocationMarker);
                }
                
                this.userLocationMarker = L.circleMarker([lat, lng], {
                    radius: 10,
                    fillColor: '#007bff',
                    color: 'white',
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.8,
                    className: 'user-location-marker'
                }).addTo(this.map);
                
                this.userLocationMarker.bindPopup(`
                    <div class="sound-info">
                        <h3>📍 Your Location</h3>
                        <p><strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
                        <p><strong>Accuracy:</strong> ±${Math.round(position.coords.accuracy)} meters</p>
                    </div>
                `).openPopup();
                
                // Get sound level at user location
                const soundLevel = this.getInterpolatedSoundLevel(lat, lng);
                this.updateLocationInfo(lat, lng, soundLevel);
                
                this.showNotification('Location found!', 'success');
                document.getElementById('location-text').textContent = 
                    `Your location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            },
            (error) => {
                console.error('Geolocation error:', error);
                let message = 'Location access denied';
                if (error.code === error.PERMISSION_DENIED) {
                    message = 'Please allow location access';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    message = 'Location unavailable';
                }
                this.showNotification(message, 'error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
        
        this.showLoading(false);
    }
    
    toggleMapLayer() {
        const btn = document.getElementById('layer-toggle');
        
        if (this.currentLayer === 'street') {
            this.map.removeLayer(this.streetLayer);
            this.satelliteLayer.addTo(this.map);
            this.currentLayer = 'satellite';
            btn.textContent = '🗺️ Street';
        } else {
            this.map.removeLayer(this.satelliteLayer);
            this.streetLayer.addTo(this.map);
            this.currentLayer = 'street';
            btn.textContent = '🛰️ Satellite';
        }
    }
    
    toggleFullscreen() {
        const mapContainer = document.getElementById('map');
        const btn = document.getElementById('fullscreen-btn');
        
        if (!this.isFullscreen) {
            if (mapContainer.requestFullscreen) {
                mapContainer.requestFullscreen();
            } else if (mapContainer.webkitRequestFullscreen) {
                mapContainer.webkitRequestFullscreen();
            } else if (mapContainer.msRequestFullscreen) {
                mapContainer.msRequestFullscreen();
            }
            this.isFullscreen = true;
            btn.textContent = '⛶ Exit Fullscreen';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            this.isFullscreen = false;
            btn.textContent = '⛶ Fullscreen';
        }
    }
    
    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            aircraft: Array.from(this.aircraftMarkers.keys()).map(icao24 => {
                const marker = this.aircraftMarkers.get(icao24);
                const latLng = marker.getLatLng();
                return {
                    icao24,
                    latitude: latLng.lat,
                    longitude: latLng.lng
                };
            }),
            soundHistory: this.soundHistory,
            settings: this.settings
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sound-map-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully!', 'success');
    }
    
    startRealTimeUpdates() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        if (this.settings.autoRefresh) {
            this.fetchRealTimeData(); // Initial fetch
            this.refreshInterval = setInterval(() => {
                this.fetchRealTimeData();
            }, this.settings.updateInterval * 1000);
        }
    }
    
    stopRealTimeUpdates() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    async fetchRealTimeData() {
        try {
            this.updateStatus('connecting', 'Fetching live data...');
            
            const response = await fetch('https://opensky-network.org/api/states/all?lamin=37.0&lomin=-122.5&lamax=37.8&lomax=-121.5');
            const data = await response.json();
            
            if (data.states) {
                this.processAircraftData(data.states);
                this.updateStatus('online', `Connected - ${data.states.length} aircraft`);
                this.updateAircraftCount(data.states.length);
                this.lastUpdate = new Date();
                this.updateLastUpdateTime();
                
                // Check for noise alerts
                this.checkNoiseAlerts();
            } else {
                throw new Error('No aircraft data received');
            }
        } catch (error) {
            console.error('Error fetching real-time data:', error);
            this.updateStatus('offline', 'Connection failed');
            this.updateAircraftCount(0);
        }
    }
    
    processAircraftData(aircraftStates) {
        // Clear existing markers
        this.aircraftMarkers.forEach(marker => this.map.removeLayer(marker));
        this.aircraftMarkers.clear();
        this.soundMarkers.forEach(marker => this.map.removeLayer(marker));
        this.soundMarkers.clear();
        
        const soundLevels = [];
        
        aircraftStates.forEach(state => {
            const [icao24, callsign, origin_country, time_position, last_contact, longitude, latitude, 
                   baro_altitude, on_ground, velocity, true_track, vertical_rate, sensors, geo_altitude, 
                   squawk, spi, position_source] = state;
            
            if (latitude && longitude && !on_ground) {
                const aircraftData = {
                    icao24,
                    callsign: callsign || 'Unknown',
                    altitude: baro_altitude || geo_altitude || 0,
                    velocity: velocity || 0,
                    track: true_track || 0,
                    country: origin_country || 'Unknown'
                };
                
                this.addAircraftMarker(latitude, longitude, aircraftData);
                
                const soundLevel = this.calculateSoundLevel(aircraftData.altitude, aircraftData.velocity);
                soundLevels.push(soundLevel);
                this.addSoundIntensityMarker(latitude, longitude, soundLevel);
            }
        });
        
        // Update sound statistics
        this.updateSoundStatistics(soundLevels);
        
        // Track sound history if enabled
        if (this.settings.trackHistory) {
            this.soundHistory.push({
                timestamp: new Date(),
                levels: soundLevels,
                average: soundLevels.length > 0 ? soundLevels.reduce((a, b) => a + b, 0) / soundLevels.length : 0
            });
            
            // Keep only last 100 entries
            if (this.soundHistory.length > 100) {
                this.soundHistory.shift();
            }
        }
    }
    
    addAircraftMarker(lat, lng, aircraftData) {
        if (!this.settings.showAircraft) return;
        
        const color = this.getAircraftColor(aircraftData.altitude);
        const marker = L.circleMarker([lat, lng], {
            radius: 6,
            fillColor: color,
            color: 'white',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.8,
            className: 'aircraft-marker'
        }).addTo(this.map);
        
        this.addAircraftTrail(lat, lng, aircraftData);
        
        marker.bindPopup(`
            <div class="aircraft-info">
                <h4>✈️ ${aircraftData.callsign}</h4>
                <div class="aircraft-details">
                    <div><strong>Altitude:</strong> ${Math.round(aircraftData.altitude)} ft</div>
                    <div><strong>Speed:</strong> ${Math.round(aircraftData.velocity * 1.94384)} knots</div>
                    <div><strong>Heading:</strong> ${Math.round(aircraftData.track)}°</div>
                    <div><strong>Country:</strong> ${aircraftData.country}</div>
                    <div><strong>ICAO24:</strong> ${aircraftData.icao24}</div>
                </div>
            </div>
        `);
        
        this.aircraftMarkers.set(aircraftData.icao24, marker);
    }
    
    addSoundIntensityMarker(lat, lng, soundLevel) {
        const color = this.getSoundColor(soundLevel);
        
        const marker = L.circleMarker([lat, lng], {
            radius: Math.max(8, Math.min(20, soundLevel / 5)),
            fillColor: color,
            color: 'white',
            weight: 1,
            opacity: 0.6,
            fillOpacity: 0.4,
            className: 'sound-marker'
        }).addTo(this.map);
        
        this.soundMarkers.set(`${lat}_${lng}`, marker);
    }
    
    calculateSoundLevel(altitude, velocity) {
        const baseLevel = 40;
        const altitudeFactor = Math.max(0, (10000 - altitude) / 1000);
        const velocityFactor = velocity / 100;
        const distanceFactor = 1;
        
        return Math.min(100, baseLevel + altitudeFactor * 10 + velocityFactor * 5 + distanceFactor * 10);
    }
    
    getAircraftColor(altitude) {
        if (altitude < 1000) return '#FF0000';
        if (altitude < 5000) return '#FF8C00';
        if (altitude < 15000) return '#FFD700';
        if (altitude < 30000) return '#32CD32';
        return '#4169E1';
    }
    
    getSoundColor(level) {
        if (level <= 30) return '#2E8B57';
        if (level <= 50) return '#FFD700';
        if (level <= 70) return '#FF8C00';
        if (level <= 90) return '#FF4500';
        return '#8B0000';
    }
    
    addAircraftTrail(lat, lng, aircraftData) {
        const trailKey = aircraftData.icao24;
        if (!this.aircraftTrails.has(trailKey)) {
            this.aircraftTrails.set(trailKey, []);
        }
        
        const trail = this.aircraftTrails.get(trailKey);
        trail.push([lat, lng]);
        
        if (trail.length > 10) {
            trail.shift();
        }
        
        if (trail.length > 1) {
            const polyline = L.polyline(trail, {
                color: '#007bff',
                weight: 2,
                opacity: 0.6,
                className: 'aircraft-trail'
            }).addTo(this.map);
        }
    }
    
    updateSoundStatistics(soundLevels) {
        if (soundLevels.length === 0) {
            document.getElementById('peak-level').textContent = '-- dB';
            document.getElementById('avg-level').textContent = '-- dB';
            document.getElementById('noise-trend').textContent = '--';
            return;
        }
        
        const peak = Math.max(...soundLevels);
        const average = soundLevels.reduce((a, b) => a + b, 0) / soundLevels.length;
        
        document.getElementById('peak-level').textContent = `${Math.round(peak)} dB`;
        document.getElementById('avg-level').textContent = `${Math.round(average)} dB`;
        
        // Calculate trend
        let trend = 'Stable';
        if (this.soundHistory.length >= 2) {
            const current = this.soundHistory[this.soundHistory.length - 1];
            const previous = this.soundHistory[this.soundHistory.length - 2];
            const diff = current.average - previous.average;
            
            if (diff > 5) trend = '↗️ Increasing';
            else if (diff < -5) trend = '↘️ Decreasing';
        }
        
        document.getElementById('noise-trend').textContent = trend;
    }
    
    checkNoiseAlerts() {
        if (!this.settings.notifications) return;
        
        const currentLevel = this.soundHistory.length > 0 ? 
            this.soundHistory[this.soundHistory.length - 1].average : 0;
        
        if (currentLevel > this.settings.noiseThreshold) {
            this.showNotification(
                `High noise level detected: ${Math.round(currentLevel)} dB`, 
                'warning'
            );
        }
    }
    
    getInterpolatedSoundLevel(lat, lng) {
        let totalWeight = 0;
        let weightedSum = 0;
        
        this.aircraftMarkers.forEach((marker, icao24) => {
            const markerLatLng = marker.getLatLng();
            const distance = Math.sqrt(
                Math.pow(lat - markerLatLng.lat, 2) + Math.pow(lng - markerLatLng.lng, 2)
            );
            const weight = 1 / (distance * distance + 0.001);
            weightedSum += this.calculateSoundLevel(0, 0) * weight;
            totalWeight += weight;
        });
        
        return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    }
    
    handleMapClick(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const soundLevel = this.getInterpolatedSoundLevel(lat, lng);
        
        this.updateLocationInfo(lat, lng, soundLevel);
        
        L.circleMarker([lat, lng], {
            radius: 12,
            fillColor: this.getSoundColor(soundLevel),
            color: 'white',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(this.map).bindPopup(`
            <div class="sound-info">
                <h3>Sound Level: ${soundLevel} dB</h3>
                <p><strong>Description:</strong> ${this.getSoundDescription(soundLevel)}</p>
                <p><strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
            </div>
        `).openPopup();
    }
    
    updateLocationInfo(lat, lng, soundLevel) {
        const color = this.getSoundColor(soundLevel);
        const description = this.getSoundDescription(soundLevel);
        
        document.getElementById('location-info').innerHTML = `
            <div class="sound-level" style="color: ${color};">
                Sound Level: ${soundLevel} dB
            </div>
            <div class="sound-description">
                ${description}
            </div>
            <p><strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
        `;
    }
    
    getSoundDescription(level) {
        if (level <= 30) return "Quiet - Minimal aircraft noise";
        if (level <= 50) return "Moderate - Occasional aircraft noise";
        if (level <= 70) return "Loud - Regular aircraft noise";
        if (level <= 90) return "Very Loud - Frequent aircraft noise";
        return "Extremely Loud - Constant aircraft noise";
    }
    
    updateStatus(status, message) {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        statusDot.className = `status-dot ${status}`;
        statusText.textContent = message;
    }
    
    updateAircraftCount(count) {
        document.getElementById('aircraft-number').textContent = count;
    }
    
    updateLastUpdateTime() {
        if (this.lastUpdate) {
            const timeString = this.lastUpdate.toLocaleTimeString();
            document.getElementById('update-time').textContent = timeString;
        }
    }
    
    updateAircraftVisibility() {
        this.aircraftMarkers.forEach(marker => {
            if (this.settings.showAircraft) {
                this.map.addLayer(marker);
            } else {
                this.map.removeLayer(marker);
            }
        });
    }
    
    showNotification(message, type = 'info') {
        const toast = document.getElementById('notification-toast');
        const messageEl = document.getElementById('notification-message');
        
        messageEl.textContent = message;
        toast.className = `notification-toast show ${type}`;
        
        setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }
    
    hideNotification() {
        const toast = document.getElementById('notification-toast');
        toast.classList.remove('show');
    }
    
    showLoading(show) {
        const mapContainer = document.getElementById('map');
        if (show) {
            mapContainer.classList.add('loading');
        } else {
            mapContainer.classList.remove('loading');
        }
    }
    
    showHelp() {
        alert(`Advanced Airplane Sound Intensity Map Help

🛩️ AIRCRAFT TRACKING:
• Green aircraft: High altitude (15,000+ ft)
• Red aircraft: Low altitude (<1,000 ft)
• Click aircraft for flight details

🔊 SOUND ANALYSIS:
• Click anywhere to see sound levels
• Color-coded intensity visualization
• Real-time statistics and trends

📍 LOCATION FEATURES:
• Search addresses with the search box
• Click "My Location" for GPS positioning
• Toggle between street and satellite views

⚙️ SETTINGS:
• Adjust noise alert threshold
• Change update intervals
• Enable/disable notifications
• Track sound history

⌨️ KEYBOARD SHORTCUTS:
• H - Show this help
• F - Toggle fullscreen
• R - Refresh data
• L - Toggle layers

📊 DATA EXPORT:
• Export sound data as JSON
• Includes aircraft positions and history
• Save settings and preferences`);
    }
    
    showAbout() {
        alert(`Advanced Airplane Sound Intensity Map v2.0

🛩️ Real-time aircraft tracking with sound analysis
📍 Address search and GPS location
🗺️ Multiple map layers and fullscreen mode
�� Data export and sound history tracking
🔔 Noise alerts and customizable settings

Built with:
• Leaflet.js for mapping
• OpenSky Network API for flight data
• Modern web technologies

Data source: OpenSky Network
Updates every 30 seconds automatically`);
    }
    
    showSettings() {
        // Scroll to settings panel
        document.querySelector('.settings-panel').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
    
    saveSettings() {
        localStorage.setItem('soundMapSettings', JSON.stringify(this.settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('soundMapSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
            
            // Update UI
            document.getElementById('noise-threshold').value = this.settings.noiseThreshold;
            document.getElementById('threshold-value').textContent = this.settings.noiseThreshold;
            document.getElementById('update-interval').value = this.settings.updateInterval;
            document.getElementById('notifications').checked = this.settings.notifications;
            document.getElementById('sound-history').checked = this.settings.trackHistory;
        }
    }
    
    handleKeyboard(e) {
        switch(e.key.toLowerCase()) {
            case 'h':
                this.showHelp();
                break;
            case 'f':
                this.toggleFullscreen();
                break;
            case 'r':
                this.fetchRealTimeData();
                break;
            case 'l':
                this.toggleMapLayer();
                break;
        }
    }
}

// Initialize the advanced sound map
document.addEventListener('DOMContentLoaded', () => {
    window.soundMap = new AdvancedSoundMap();
    console.log('Advanced Airplane Sound Intensity Map loaded!');
    console.log('🛩️ Live aircraft tracking active');
    console.log('🔊 Advanced sound analysis enabled');
    console.log('📍 Location services ready');
    console.log('⌨️ Press H for help');
});
