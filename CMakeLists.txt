cmake_minimum_required(VERSION 3.20)

project(BerciiMart)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Drogon CONFIG REQUIRED)
find_package(PostgreSQL REQUIRED)

if(WIN32)

    find_package(unofficial-argon2 CONFIG REQUIRED)
    set(ARGON2_TARGET unofficial::argon2::libargon2)

    set(PostgreSQL_INCLUDE_DIR
        ${PostgreSQL_INCLUDE_DIRS}
    )

    set(PostgreSQL_LIBRARY
        ${PostgreSQL_LIBRARIES}
    )

else()

    find_library(ARGON2_LIBRARY argon2 REQUIRED)
    set(ARGON2_TARGET ${ARGON2_LIBRARY})

    set(PostgreSQL_INCLUDE_DIR
        ${PostgreSQL_INCLUDE_DIRS}
    )

    set(PostgreSQL_LIBRARY
        ${PostgreSQL_LIBRARIES}
    )

    set(ARGON2_INCLUDE_DIR
        /usr/include
    )

endif()

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
    ${ARGON2_TARGET}
    Drogon::Drogon
)

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

    add_custom_command(TARGET BerciiMart POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "$<TARGET_FILE:unofficial::argon2::libargon2>"
        "$<TARGET_FILE_DIR:BerciiMart>"
    )

endif()
