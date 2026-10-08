cmake_minimum_required(VERSION 3.20)

project(BerciiMart)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Drogon CONFIG REQUIRED)
find_package(PostgreSQL REQUIRED)

find_library(ARGON2_LIBRARY NAMES argon2 libargon2 REQUIRED)
find_path(ARGON2_INCLUDE_DIR argon2.h)

add_executable(BerciiMart
    src/main.cpp
    src/database.cpp
)

target_include_directories(BerciiMart
    PRIVATE
    ${PostgreSQL_INCLUDE_DIRS}
    ${ARGON2_INCLUDE_DIR}
)

target_link_libraries(BerciiMart
    PRIVATE
    ${PostgreSQL_LIBRARIES}
    ${ARGON2_LIBRARY}
    Drogon::Drogon
)

add_executable(DatabaseTest
    src/db_test.cpp
)

target_include_directories(DatabaseTest
    PRIVATE
    ${PostgreSQL_INCLUDE_DIRS}
)

target_link_libraries(DatabaseTest
    PRIVATE
    ${PostgreSQL_LIBRARIES}
)