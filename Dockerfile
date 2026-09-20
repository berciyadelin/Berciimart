FROM ubuntu:24.04 AS build

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    pkg-config \
    libpq-dev \
    libargon2-dev \
    libdrogon-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN cmake -S . -B build -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build -j$(nproc)


FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    libpq5 \
    libargon2-1 \
    libdrogon-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/build/BerciiMart /app/BerciiMart
COPY --from=build /app/frontend /app/frontend

CMD ["./BerciiMart"]