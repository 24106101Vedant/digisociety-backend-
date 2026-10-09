/*
 * build.gradle.kts  —  DigiSociety College Edition
 *
 * Run : .\gradlew.bat bootRun
 * JAR : .\gradlew.bat bootJar  →  build/libs/digisociety-backend-1.0.0.jar
 */

plugins {
    kotlin("jvm")                         version "2.0.21"
    kotlin("plugin.spring")               version "2.0.21"
    kotlin("plugin.jpa")                  version "2.0.21"
    id("org.springframework.boot")        version "3.4.5"
    id("io.spring.dependency-management") version "1.1.7"
}

group   = "com.digisociety"
version = "1.0.0"

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    compilerOptions {
        freeCompilerArgs.add("-Xjsr305=strict")
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // ── Spring Boot starters ────────────────────────────────────────────────
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // ── Kotlin ──────────────────────────────────────────────────────────────
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    // ── PostgreSQL JDBC driver ───────────────────────────────────────────────
    runtimeOnly("org.postgresql:postgresql:42.7.3")

    // ── JWT ─────────────────────────────────────────────────────────────────
    implementation("io.jsonwebtoken:jjwt-api:0.11.5")
    runtimeOnly ("io.jsonwebtoken:jjwt-impl:0.11.5")
    runtimeOnly ("io.jsonwebtoken:jjwt-jackson:0.11.5")

    // ── BCrypt (included via spring-security-crypto) ─────────────────────────
    implementation("org.springframework.security:spring-security-crypto")

    // ── Jackson Kotlin module ────────────────────────────────────────────────
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")

    // ── Amazon S3 (AWS SDK v2) ────────────────────────────────────────────────
    // Credentials read from AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars only
    implementation(platform("software.amazon.awssdk:bom:2.26.12"))
    implementation("software.amazon.awssdk:s3")
    implementation("software.amazon.awssdk:s3-transfer-manager")

    // ── Test ─────────────────────────────────────────────────────────────────
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
