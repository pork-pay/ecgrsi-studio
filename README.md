# ECG-RSI Studio

Public web client for a password-protected ECG waveform research service.

The page runs on GitHub Pages. Waveform editing, FeatureDB measurements, iterative model review and independent blind reading run on an owner-operated backend. No model API keys, backend source, datasets or user history are included.

## Connecting

Configure `backend_url` in `config.json` with the HTTPS URL of the authenticated gateway, or enter the URL on the connection screen. Enter the gateway access password; never enter a MatrixLLM API key. The password is held in page memory and is not stored in GitHub or browser storage.

A running Mac, authenticated gateway and configured HTTPS tunnel are required. This is a single shared workspace for trusted users, not a multi-tenant service. Model review and blind reading are research outputs, not clinical certification.

The private backend and local deployment tools are maintained separately.
