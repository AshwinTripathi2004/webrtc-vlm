# Real-time WebRTC VLM Multi-Object Detection (Phone → Browser → Inference → Overlay)

This is a minimal, reproducible demo that:
- Streams phone camera to a browser (no native app required).
- Runs multi-object detection **in-browser (WASM mode)** using TensorFlow.js COCO-SSD.
- Overlays bounding boxes in near real-time.
- Produces `metrics.json` after a 30s bench.

> Low-resource path is default (WASM; runs on modest laptops without GPU).

---

## Quick Start (one command)
  
```bash
./start.sh
```

Or, with Docker Compose:

```bash
docker-compose up --build
```

---

## Modes

- **WASM (default):** All detection runs in-browser (fastest for low-resource laptops).
- **Server:** Video frames are sent to the server for detection. To use, open the app with `?mode=server` in the URL (e.g., `http://localhost:3000/?mode=server`).

---

## Phone Join via QR/URL

1. Start the server (see above).
2. Scan the QR code shown in your terminal, or open the LAN URL on your phone.
3. **IMPORTANT:**
	- Camera access only works on `localhost` (HTTP or HTTPS), or on your LAN IP if you use HTTPS.
	- Browsers block camera/mic on HTTP for non-localhost addresses. For mobile, use HTTPS or test on your laptop.
	- For HTTPS setup, see below.

---

## Benchmark & Metrics

1. Click the "Run 30s Bench" button in the UI.
2. After 30 seconds, a `metrics.json` file will be written (median & P95 latency, FPS, bandwidth).

---

## HTTPS for Mobile Camera Access (Optional)

To use your phone's camera via LAN IP, you must serve the app over HTTPS. For local dev, you can use a self-signed certificate:

1. Generate certs (one-time):
	```bash
	openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
	```
2. Update your server to use HTTPS (ask for help if needed).
3. Access via `https://<LAN-IP>:3000` and accept the browser warning.

---
 
## Supported Objects

Detects 80+ common objects (COCO-SSD): person, car, dog, cat, bottle, etc.

---

## Design Choices, Low-Resource Mode, Backpressure

- **WASM mode** is default for best performance on low-resource laptops (quantized models, 320x240 @ 10–15 FPS).
- **Server mode** allows benchmarking server-side inference (WebSocket frame upload, bounding box return).
- **Backpressure** is handled by only sending/processing one frame at a time in server mode.

---

## Deliverables

1. Dockerfile, docker-compose.yml, start.sh 
2. README.md (this file)
3. metrics.json (after running benchmark)
4. 1-min Loom video (to be recorded)
5. Short report (see above)
