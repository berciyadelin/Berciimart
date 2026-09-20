# ============================================================
# BUILD STAGE
# ============================================================
FROM ubuntu:24.04 AS build

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    pkg-config \
    libpq-dev \
    libargon2-dev \
    libdrogon-dev \
    libjsoncpp-dev \
    default-libmysqlclient-dev \
    uuid-dev \
    zlib1g-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    libyaml-cpp-dev \
    libsqlite3-dev \
    libhiredis-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN cmake -S . -B build \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_BUILD_WITH_INSTALL_RPATH=ON \
    && cmake --build build -j$(nproc)


# ============================================================
# RUNTIME STAGE
# ============================================================
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    libpq5 \
    libargon2-1 \
    libdrogon1t64 \
    libjsoncpp25 \
    libmysqlclient21 \
    uuid-runtime \
    zlib1g \
    libssl3 \
    libcurl4 \
    libyaml-cpp0.8 \
    libsqlite3-0 \
    libhiredis1.1.0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend executable
COPY --from=build /app/build/BerciiMart /app/BerciiMart

# Frontend
COPY --from=build /app/frontend /app/frontend

# Render supplies PORT at runtime.
# The application itself reads PORT and binds to 0.0.0.0.
EXPOSE 10000

CMD ["./BerciiMart"]
