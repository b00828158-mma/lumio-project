// backend/din-simulator.js
// Simulates the LumIO DIN Box (ESP32 firmware logic)

export class DINSimulator {
  constructor(cabinetId) {
    this.cabinetId = cabinetId;
    this.state = 'OFF'; // OFF, ASTRO_ON, CITIZEN_ON, DIM_30, FAULT
    this.relayOn = false;
    this.voltage = 230;
    this.current = 0;
    this.power = 0;
    this.energy = 0;
    this.daliLevel = 0; // 0-100%
    this.doorOpen = false;
    this.lastRequest = null;
    this.citizenTimer = null;
    this.telemetryLog = [];
    
    this.startTelemetryPublisher();
  }

  // Simulate receiving MQTT command
  receiveCommand(action, duration = 20) {
    console.log(`[DIN ${this.cabinetId}] Received MQTT command: ${action}`);

    if (action === 'ON') {
      this.state = 'CITIZEN_ON';
      this.relayOn = true;
      this.daliLevel = 100;
      this.current = 5.2; // Simulate 5.2A load
      this.power = 230 * 5.2; // P = V * I
      this.lastRequest = new Date();

      // Clear existing timer
      if (this.citizenTimer) clearTimeout(this.citizenTimer);

      // 20-minute auto-off (for demo: 10 seconds)
      this.citizenTimer = setTimeout(() => {
        console.log(`[DIN ${this.cabinetId}] Auto-off timer expired`);
        this.state = 'OFF';
        this.relayOn = false;
        this.daliLevel = 0;
        this.current = 0;
        this.power = 0;
      }, 10000); // 10 seconds for demo

      console.log(`[DIN ${this.cabinetId}] ✓ Lights ON, relay closed, waiting 20 min...`);
    } else if (action === 'OFF') {
      this.state = 'OFF';
      this.relayOn = false;
      this.daliLevel = 0;
      this.current = 0;
      this.power = 0;
      if (this.citizenTimer) clearTimeout(this.citizenTimer);
      console.log(`[DIN ${this.cabinetId}] ✓ Lights OFF, relay open`);
    }
  }

  // Simulate publishing telemetry every 60 seconds
  startTelemetryPublisher() {
    setInterval(() => {
      this.energy += (this.power / 1000) * (60 / 3600); // Accumulate kWh
      const telemetry = this.getTelemetry();
      this.telemetryLog.push(telemetry);
      console.log(`[DIN ${this.cabinetId}] Telemetry: state=${telemetry.state}, V=${telemetry.voltage}V, I=${telemetry.current}A, kWh=${telemetry.energy.toFixed(3)}`);
    }, 60000); // 60 seconds (for demo: could be 5s)
  }

  getTelemetry() {
    return {
      cabinetId: this.cabinetId,
      state: this.state,
      voltage: this.voltage,
      current: this.current,
      power: this.power,
      energy: this.energy,
      relayOn: this.relayOn,
      daliLevel: this.daliLevel,
      doorOpen: this.doorOpen,
      timestamp: new Date().toISOString(),
    };
  }

  getStatus() {
    return {
      cabinetId: this.cabinetId,
      state: this.state,
      relayOn: this.relayOn,
      lights: this.relayOn ? 'ON' : 'OFF',
      voltage: this.voltage,
      current: this.current,
      power: this.power,
      energy: this.energy.toFixed(3),
      daliLevel: this.daliLevel,
      timeRemaining: this.citizenTimer ? '~20 min' : 'none',
    };
  }
}