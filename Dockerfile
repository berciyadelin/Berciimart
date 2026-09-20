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
    libbrotli-dev \
    libhiredis-dev \
    libsqlite3-dev \
    libyaml-cpp-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    uuid-dev \
    zlib1g-dev \
    libc-ares-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN cmake -S . -B build \
    -DCMAKE_BUILD_TYPE=Release \
    -DMYSQL_INCLUDE_DIR=/usr/include/mysql \
    -DMYSQL_INCLUDE_DIRS=/usr/include/mysql \
    -DMYSQL_LIBRARY=/usr/lib/x86_64-linux-gnu/libmysqlclient.so \
    -DMYSQL_LIBRARIES=/usr/lib/x86_64-linux-gnu/libmysqlclient.so \
    -DBROTLI_INCLUDE_DIR=/usr/include \
    -DBROTLIDEC_LIBRARY=/usr/lib/x86_64-linux-gnu/libbrotlidec.so \
    -DBROTLIENC_LIBRARY=/usr/lib/x86_64-linux-gnu/libbrotlienc.so \
    -DBROTLICOMMON_LIBRARY=/usr/lib/x86_64-linux-gnu/libbrotlicommon.so \
    && cmake --build build -j$(nproc)


# ============================================================
# RUNTIME STAGE
# ============================================================
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    libdrogon1t64 \
    libpq5 \
    libargon2-1 \
    libmysqlclient21 \
    libbrotli1 \
    libhiredis1.1.0 \
    libsqlite3-0 \
    libyaml-cpp0.8 \
    libssl3 \
    libcurl4 \
    libuuid1 \
    zlib1g \
    libc-ares2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/build/BerciiMart /app/BerciiMart
COPY --from=build /app/frontend /app/frontend

EXPOSE 10000

CMD ["./BerciiMart"]