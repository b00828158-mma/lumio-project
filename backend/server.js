// backend/server.js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { DINSimulator } from './din-simulator.js';

const fastify = Fastify({ logger: true });
fastify.register(cors, { origin: true });

// Create simulated DIN boxes for each zone
const cabinets = {
  1: new DINSimulator(1),
  2: new DINSimulator(2),
  3: new DINSimulator(3),
};

const zones = {
  1: { id: 1, name: 'Rue de Paris', cabinetId: 1 },
  2: { id: 2, name: 'Avenue de la Paix', cabinetId: 2 },
  3: { id: 3, name: 'Boulevard Main', cabinetId: 3 },
};

fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

fastify.get('/api/zones', async () => {
  const zonesList = Object.values(zones).map(zone => {
    const cabinet = cabinets[zone.cabinetId];
    return {
      ...zone,
      cabinetState: cabinet.state,
      relayOn: cabinet.relayOn,
      energy: cabinet.energy.toFixed(3),
    };
  });
  return zonesList;
});

fastify.get('/api/zones/:zoneId', async (request, reply) => {
  const { zoneId } = request.params;
  if (!zones[zoneId]) {
    reply.code(404).send({ error: 'Zone not found' });
    return;
  }
  const cabinet = cabinets[zones[zoneId].cabinetId];
  return {
    ...zones[zoneId],
    cabinetStatus: cabinet.getStatus(),
  };
});

// POST request to turn on lights
fastify.post('/api/zones/:zoneId/request', async (request, reply) => {
  const { zoneId } = request.params;
  if (!zones[zoneId]) {
    reply.code(404).send({ error: 'Zone not found' });
    return;
  }

  const cabinetId = zones[zoneId].cabinetId;
  const cabinet = cabinets[cabinetId];

  // Send MQTT ON command to simulator
  cabinet.receiveCommand('ON', 20);

  return {
    zoneId,
    cabinetId,
    status: 'lights on',
    duration: '20 minutes',
    message: 'Lights turned on! They will automatically turn off after 20 minutes.',
    cabinet: cabinet.getStatus(),
  };
});

// Get cabinet telemetry/status
fastify.get('/api/cabinets/:cabinetId', async (request, reply) => {
  const { cabinetId } = request.params;
  if (!cabinets[cabinetId]) {
    reply.code(404).send({ error: 'Cabinet not found' });
    return;
  }
  return cabinets[cabinetId].getStatus();
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '127.0.0.1' });
    console.log('✓ Backend running on http://127.0.0.1:3001');
    console.log('✓ Simulated DIN boxes initialized:');
    Object.values(zones).forEach(z => {
      console.log(`  - Zone ${z.id} (${z.name}) → Cabinet ${z.cabinetId}`);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();