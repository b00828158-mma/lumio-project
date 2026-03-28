// webapp/src/App.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://127.0.0.1:3001';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking...');
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState({});

  useEffect(() => {
    checkBackend();
    fetchZones();
    // Refresh zones every 5 seconds
    const interval = setInterval(fetchZones, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkBackend = async () => {
    try {
      await axios.get(`${API_BASE_URL}/api/health`);
      setBackendStatus('✓ Connected to backend');
    } catch {
      setBackendStatus('✗ Backend not running');
    }
  };

  const fetchZones = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/zones`);
      setZones(response.data);
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const handleLightRequest = async (zoneId) => {
    setLoading({ ...loading, [zoneId]: true });
    try {
      await axios.post(`${API_BASE_URL}/api/zones/${zoneId}/request`);
      await fetchZones(); // Refresh immediately
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading({ ...loading, [zoneId]: false });
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>⚡ LumIO – Citizen App</h1>
      
      <div style={{
        padding: '12px',
        marginBottom: '20px',
        backgroundColor: backendStatus.includes('✓') ? '#e8f5e9' : '#ffebee',
        borderRadius: '4px',
        color: backendStatus.includes('✓') ? '#2e7d32' : '#c62828',
        fontWeight: 'bold',
      }}>
        {backendStatus}
      </div>

      <h2>Street Zones (Currently Dark)</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {zones.map(zone => (
          <div
            key={zone.id}
            style={{
              padding: '16px',
              border: `2px solid ${zone.relayOn ? '#4caf50' : '#ccc'}`,
              borderRadius: '6px',
              backgroundColor: zone.relayOn ? '#f1f8f1' : '#fafafa',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0' }}>{zone.name}</h3>
                <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                  Cabinet {zone.cabinetId} – State: <strong>{zone.cabinetState}</strong>
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                  Energy: <strong>{zone.energy} kWh</strong>
                </p>
              </div>
              <button
                onClick={() => handleLightRequest(zone.id)}
                disabled={loading[zone.id] || zone.relayOn}
                style={{
                  padding: '10px 20px',
                  backgroundColor: zone.relayOn ? '#cccccc' : '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading[zone.id] ? 'not-allowed' : (zone.relayOn ? 'default' : 'pointer'),
                  fontWeight: 'bold',
                  opacity: loading[zone.id] ? 0.5 : 1,
                }}
              >
                {zone.relayOn ? '✓ On' : (loading[zone.id] ? 'Sending...' : 'Allumer ma rue')}
              </button>
            </div>
          </div>
        ))}
      </div>

      <hr />
      <p style={{ fontSize: '12px', color: '#999' }}>
        Backend: {API_BASE_URL} | Zones auto-refresh every 5s
      </p>
    </div>
  );
}

export default App;