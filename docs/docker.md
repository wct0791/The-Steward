# Docker Model Runner Setup

This guide explains how to set up and run local LLMs in Docker for use with The Steward routing agent.

---

## 1. Overview

The Steward can route prompts to local LLMs running in Docker containers. Model endpoints and configuration are defined in `models/docker_runner.yaml`.

## 2. Example Docker Build & Run Commands

### SmolLM3 (Docker)
```sh
# Build (if needed)
docker build -t smollm3 .

# Run (ensure port matches YAML: 8080)
docker run -d -p 8080:8080 --name smollm3 smollm3
```

### Ollama Mistral (Docker)
```sh
# Pull or build the image as needed
docker pull ollama/mistral

# Run (ensure port matches YAML: 11434)
docker run -d -p 11434:11434 --name ollama-mistral ollama/mistral
```

### OpenChat (Docker)
```sh
# Build or pull the image
docker build -t openchat .

# Run (ensure port matches YAML: 8000)
docker run -d -p 8000:8000 --name openchat openchat
```

---

## 3. Port Matching Reminder

**Important:**
- The HTTP port you expose in your Docker run command (e.g., `-p 8080:8080`) must match the `endpoint` port in `models/docker_runner.yaml`.
- Example:
  - If your YAML says `endpoint: http://localhost:8080/v1/completions`, your Docker container must listen on port 8080.

---

## 4. Troubleshooting
- If The Steward cannot connect, check that the container is running and the port is open.
- Use `docker ps` to verify running containers.
- Use `curl http://localhost:<port>/v1/completions` to test the endpoint manually.

---

## 5. Updating Models
- Edit `models/docker_runner.yaml` to add, remove, or change model endpoints.
- Restart containers as needed after changes.

---

## 6. Security Note
- Do not expose these ports to the public internet unless you have secured the endpoints.

---

#end region
