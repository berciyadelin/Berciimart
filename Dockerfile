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

# Verify the MySQL development files exist.
RUN test -f /usr/include/mysql/mysql.h \
    && test -f /usr/lib/x86_64-linux-gnu/libmysqlclient.so

# Configure and build BerciiMart.
RUN cmake -S . -B build \
    -DCMAKE_BUILD_TYPE=Release \
    -DMYSQL_INCLUDE_DIR=/usr/include/mysql \
    -DMYSQL_LIBRARY=/usr/lib/x86_64-linux-gnu/libmysqlclient.so \
    -DMYSQL_INCLUDE_DIRS=/usr/include/mysql \
    -DMYSQL_LIBRARIES=/usr/lib/x86_64-linux-gnu/libmysqlclient.so \
    && cmake --build build -j$(nproc)


# ============================================================
# RUNTIME STAGE
# ============================================================
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    libdrogon1t64 \
    libargon2-1 \
    libpq5 \
    libmysqlclient21 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/build/BerciiMart /app/BerciiMart
COPY --from=build /app/frontend /app/frontend

EXPOSE 10000

CMD ["./BerciiMart"]
