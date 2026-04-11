FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libespeak1 \
    espeak \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "src.main:combined_app", "--host", "0.0.0.0", "--port", "8000", "--reload"]