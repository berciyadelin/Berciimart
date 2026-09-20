cmake_minimum_required(VERSION 3.20)

project(BerciiMart)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(WIN32)

    # PostgreSQL installed through vcpkg
    set(PostgreSQL_INCLUDE_DIR "C:/vcpkg/installed/x64-windows/include")
    set(PostgreSQL_LIBRARY "C:/vcpkg/installed/x64-windows/lib/libpq.lib")

    # Argon2 installed through vcpkg
    set(ARGON2_INCLUDE_DIR "C:/vcpkg/installed/x64-windows/include")
    set(ARGON2_LIBRARY "C:/vcpkg/installed/x64-windows/lib/argon2.lib")

else()

    # Linux / GitHub Codespaces
    find_package(PostgreSQL REQUIRED)
    find_library(ARGON2_LIBRARY argon2 REQUIRED)

    set(PostgreSQL_INCLUDE_DIR ${PostgreSQL_INCLUDE_DIRS})
    set(PostgreSQL_LIBRARY ${PostgreSQL_LIBRARIES})

    set(ARGON2_INCLUDE_DIR /usr/include)

endif()

# Main application
add_executable(BerciiMart
    src/main.cpp
    src/database.cpp
)

target_include_directories(BerciiMart
    PRIVATE
    ${PostgreSQL_INCLUDE_DIR}
    ${ARGON2_INCLUDE_DIR}
)

target_link_libraries(BerciiMart
    PRIVATE
    ${PostgreSQL_LIBRARY}
    ${ARGON2_LIBRARY}
)

# PostgreSQL connection test
add_executable(DatabaseTest
    src/db_test.cpp
)

target_include_directories(DatabaseTest
    PRIVATE
    ${PostgreSQL_INCLUDE_DIR}
)

target_link_libraries(DatabaseTest
    PRIVATE
    ${PostgreSQL_LIBRARY}
)

if(WIN32)

    # Copy Argon2 DLL beside executable
    add_custom_command(TARGET BerciiMart POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "C:/vcpkg/installed/x64-windows/bin/argon2.dll"
        "$<TARGET_FILE_DIR:BerciiMart>"
    )

endif()