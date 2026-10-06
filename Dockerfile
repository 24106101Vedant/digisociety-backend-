# ─────────────────────────────────────────────────────────────────────────────
# DigiSociety College Edition — Dockerfile
# Multi-stage: build with Gradle + Java 21, run with slim JRE 21
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy gradle wrapper and build files first (layer caching)
COPY gradle/   gradle/
COPY gradlew   gradlew
COPY gradlew.bat gradlew.bat
COPY build.gradle.kts  build.gradle.kts
COPY settings.gradle   settings.gradle
COPY gradle.properties gradle.properties

# Make gradlew executable (required on Linux)
RUN chmod +x gradlew

# Download dependencies (cached layer)
RUN ./gradlew dependencies --no-daemon 2>/dev/null || true

# Copy source code
COPY src/ src/

# Build the fat JAR (skip tests — no DB available at build time)
RUN ./gradlew bootJar --no-daemon -x test

# ── Stage 2: Run ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runner

WORKDIR /app

# Copy only the built JAR from stage 1
COPY --from=builder /app/build/libs/digisociety-backend-*.jar app.jar

# Expose port
EXPOSE 8080

# Environment variables are injected by Render at runtime
# Never hardcode secrets here

ENTRYPOINT ["java", "-jar", "app.jar"]
