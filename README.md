# STT Model Deployment on Ace Cloud GPU VM

## 1. Project Overview

This project involves deploying an open-source Speech-to-Text (STT) model on an Ace Cloud GPU virtual machine. The server will provide the compute infrastructure required for speech transcription and can later expose the model through a FastAPI REST API.

## 2. Server Configuration

| Component | Details |
|---|---|
| Cloud Provider | Ace Cloud |
| Hostname | `ace-a2-server` |
| Operating System | Ubuntu 24.04 LTS |
| Architecture | x86_64 |
| CPU | 8 vCPUs (AMD EPYC Milan) |
| RAM | 32 GB |
| GPU | NVIDIA A2 |
| GPU Memory | Approximately 15 GB |
| NVIDIA Driver | 580.178.04 |
| Reported CUDA Compatibility | 13.0 |
| Root Disk | Approximately 100 GB |
| Application User | `ubuntu` |
| Authentication | SSH private key |

> **Security note:** Never commit SSH private keys, passwords, API tokens, or other secrets to the repository.

## 3. Server Access

Connect to the VM from your local machine:

```bash
ssh -i ~/.ssh/stt_gpu_ppk.pem ubuntu@103.189.172.76
```

Verify the GPU:

```bash
nvidia-smi
```

Check CPU and memory:

```bash
lscpu
free -h
df -h
```

Check the Ubuntu version:

```bash
lsb_release -a
```

## 4. Directory Structure

Recommended development directory:

```text
/home/ubuntu/stt-server/
├── README.md
├── app/
│   ├── main.py
│   ├── routes/
│   └── services/
├── models/
├── tests/
├── requirements.txt
├── .env
├── .gitignore
└── logs/
```

Create the initial directory structure:

```bash
mkdir -p ~/stt-server/{app/routes,app/services,models,tests,logs}
cd ~/stt-server
```

The `models/` directory can hold model artifacts when local storage is appropriate. Large model files should not be committed to Git.

## 5. Technology Stack

Planned technologies:

- **Operating System:** Ubuntu 24.04 LTS
- **GPU:** NVIDIA A2
- **Programming Language:** Python
- **API Framework:** FastAPI
- **Inference Acceleration:** PyTorch/CUDA or the selected model's supported runtime
- **Deployment:** To be finalized
- **API Testing:** curl or Postman

The final framework and dependencies will depend on the selected STT model.

## 6. Verify the Software Environment

Check the installed Python version:

```bash
python3 --version
python3 -m pip --version
```

Check whether the CUDA compiler is installed:

```bash
nvcc --version
```

The `nvcc` command may be unavailable even when the NVIDIA driver is working. The driver and CUDA toolkit are separate components.

Check PyTorch GPU availability after installing the compatible PyTorch build:

```bash
python3 -c "import torch; print(torch.__version__); print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CUDA unavailable')"
```

Do not install or replace NVIDIA drivers unnecessarily. First verify the selected model's compatibility requirements.

## 7. STT Model Configuration

| Setting | Status |
|---|---|
| Model name | To be finalized |
| Model source | To be finalized |
| Model format | To be finalized |
| Inference runtime | To be finalized |
| Supported languages | To be finalized |
| Input audio formats | To be finalized |
| GPU inference | GPU detected; model inference not yet verified |
| Model download location | `~/stt-server/models/` |

Before downloading a model, verify its license, hardware requirements, supported languages, and inference dependencies.

## 8. Planned API Endpoints

The following endpoints are proposed for a future FastAPI service.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Check whether the API is running |
| `GET` | `/health/gpu` | Check GPU availability |
| `POST` | `/transcribe` | Submit audio for transcription |

These endpoints are planned and are not available until implemented.

## 9. Deployment and Security

Before exposing the service publicly:

1. Restrict SSH access to trusted IP addresses.
2. Avoid exposing the application port directly to the internet.
3. Use HTTPS through a reverse proxy when public access is required.
4. Keep API credentials in environment variables or a secrets manager.
5. Configure application logging and monitor disk usage.
6. Verify the cloud firewall/security group rules before deployment.
7. Test GPU inference and API behavior before production use.

## 10. Current Status

- [x] Ace Cloud VM provisioned
- [x] SSH key-based access verified
- [x] Ubuntu environment accessible
- [x] NVIDIA GPU detected
- [x] NVIDIA driver detected
- [ ] Python environment verified
- [ ] Model selected and downloaded
- [ ] Compatible inference runtime installed
- [ ] GPU inference tested
- [ ] FastAPI service implemented
- [ ] API tested locally
- [ ] Production security and deployment configured

## 11. Next Steps

1. Confirm the STT model to be hosted.
2. Check its hardware and software requirements.
3. Set up an isolated Python virtual environment.
4. Install the compatible inference dependencies.
5. Download the model and test transcription on the GPU.
6. Implement and test the FastAPI endpoints.
7. Configure secure production access.

---

**Project status:** Infrastructure provisioned; STT model deployment pending.

**Last updated:** October 2026