cmake_minimum_required(VERSION 3.25)

project(BerciiMart VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# --------------------------------------------------
# Dependencies
# --------------------------------------------------

find_package(Drogon CONFIG REQUIRED)
find_package(PostgreSQL REQUIRED)
find_library(ARGON2_LIBRARY
    NAMES argon2
    REQUIRED
)

# --------------------------------------------------
# BerciiMart Web Application
# --------------------------------------------------

add_executable(BerciiMart

    src/main.cpp
    src/database.cpp
    src/model/Product.cpp
    src/controller/AuthController.cpp

)

# --------------------------------------------------
# Include directories
# --------------------------------------------------

target_include_directories(BerciiMart
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/src
        ${PostgreSQL_INCLUDE_DIRS}
)

# --------------------------------------------------
# Libraries
# --------------------------------------------------

target_link_libraries(BerciiMart
    PRIVATE
        Drogon::Drogon
        PostgreSQL::PostgreSQL
        ${ARGON2_LIBRARY}
)

# --------------------------------------------------
# Database test
# --------------------------------------------------

add_executable(DatabaseTest
    src/db_test.cpp
)

target_include_directories(DatabaseTest
    PRIVATE
        ${PostgreSQL_INCLUDE_DIRS}
)

target_link_libraries(DatabaseTest
    PRIVATE
        PostgreSQL::PostgreSQL
)

# --------------------------------------------------
# Windows: copy Argon2 DLL beside executable
# --------------------------------------------------

if(WIN32)
    find_file(ARGON2_DLL
        NAMES argon2.dll
        PATHS
            ${CMAKE_PREFIX_PATH}/bin
            C:/vcpkg/installed/x64-windows/bin
    )

    if(ARGON2_DLL)
        add_custom_command(TARGET BerciiMart POST_BUILD
            COMMAND ${CMAKE_COMMAND} -E copy_if_different
            "${ARGON2_DLL}"
            "$<TARGET_FILE_DIR:BerciiMart>"
        )
    endif()
endif()