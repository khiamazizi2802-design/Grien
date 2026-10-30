import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const syncFilePath = path.resolve(__dirname, 'driver_sync_cache.json')

function getSavedDriverData() {
    try {
        if (fs.existsSync(syncFilePath)) {
            const raw = fs.readFileSync(syncFilePath, 'utf8')
            if (raw) return JSON.parse(raw)
        }
    } catch(e) {}
    return {
        email: 'omarde65aa@gmail.com',
        name: 'Khiam Azizi',
        firstName: 'Khiam',
        lastName: 'Azizi',
        phone: '017662111103',
        address: 'Auf dem Schafberg 12 3',
        city: 'City',
        zip: '65933',
        role: 'driver',
        avatarApproved: true,
        idCardApproved: true,
        termsAccepted: true
    }
}

function saveDriverData(data) {
    try {
        fs.writeFileSync(syncFilePath, JSON.stringify(data, null, 2), 'utf8')
    } catch(e) {}
}

// Standalone Director Admin Portal (Runs on Port 5174)
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        {
            name: 'driver-sync-api',
            configureServer(server) {
                server.middlewares.use('/api/sync-driver', (req, res) => {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                    if (req.method === 'OPTIONS') {
                        res.statusCode = 200;
                        res.end();
                        return;
                    }
                    if (req.method === 'POST') {
                        let body = '';
                        req.on('data', chunk => { body += chunk; });
                        req.on('end', () => {
                            try {
                                const payload = JSON.parse(body || '{}');
                                const current = getSavedDriverData();
                                // Guard: Never allow driver syncs to overwrite approvals that were already granted
                                if (current.avatarApproved && payload.avatarApproved === false) {
                                    delete payload.avatarApproved;
                                }
                                if (current.idCardApproved && payload.idCardApproved === false) {
                                    delete payload.idCardApproved;
                                }
                                const updated = { ...current, ...payload };
                                saveDriverData(updated);
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ ok: true, data: updated }));
                            } catch(e) {
                                res.statusCode = 400;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ error: e.message }));
                            }
                        });
                        return;
                    }
                    if (req.method === 'GET') {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(getSavedDriverData()));
                    }
                });
            }
        }
    ],
    server: {
        port: 5174,
        open: true
    }
})
