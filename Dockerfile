# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder

WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend ./frontend
RUN cd frontend && npm run build

# Stage 2: Serve the application with Python FastAPI
FROM python:3.11-slim

WORKDIR /app

# Install dependencies layer
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the backend code
COPY backend ./backend

# Copy the static build from the builder container
COPY --from=builder /app/frontend/out ./backend/static

# Command to evaluate the dynamic port provided by Render
CMD sh -c "cd backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
