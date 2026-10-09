/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Lab Outcome : Implement backend services in Kotlin with database integration
 *               and secure authentication.
 *
 * Aim 1       : Write Kotlin programs to demonstrate data types, collections,
 *               and OOP concepts (classes, inheritance).
 *
 * Aim 2       : Write Kotlin program to implement exception handling and use
 *               collection operations (map, filter, reduce).
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * build.gradle.kts  —  DigiSociety Kotlin/Spring Boot build file
 *
 * Replaces:  backend/package.json  +  backend/package-lock.json
 *
 * Run the app  :  ./gradlew bootRun
 * Build JAR    :  ./gradlew bootJar   → build/libs/digisociety-backend-1.0.0.jar
 * Run JAR      :  java -jar build/libs/digisociety-backend-1.0.0.jar
 */

// ── Plugins ──────────────────────────────────────────────────────────────────
plugins {
    // Kotlin JVM plugin — enables Kotlin compilation
    kotlin("jvm")                          version "1.9.24"
    // Kotlin Spring plugin — opens classes for Spring proxying automatically
    kotlin("plugin.spring")                version "1.9.24"
    // Spring Boot plugin — provides bootRun / bootJar tasks
    id("org.springframework.boot")         version "3.3.0"
    // Spring dependency-management plugin — aligns transitive versions
    id("io.spring.dependency-management")  version "1.1.5"
}

// ── Project metadata ─────────────────────────────────────────────────────────
group   = "com.digisociety"
version = "1.0.0"

// ── Kotlin / JVM target ───────────────────────────────────────────────────────
// Using Java 26 directly — skip toolchain auto-provisioning
tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs += listOf("-Xjsr305=strict")
        jvmTarget = "21"   // bytecode target; Java 26 can run Java 21 bytecode
    }
}

// ── Repositories ─────────────────────────────────────────────────────────────
repositories {
    mavenCentral()
}

// ── Dependencies ─────────────────────────────────────────────────────────────
dependencies {

    // ── Spring Boot starters ─────────────────────────────────────────────────
    // Web (embedded Tomcat, Spring MVC — replaces Express)
    implementation("org.springframework.boot:spring-boot-starter-web")

    // Spring Security (CORS, filter chain — replaces cors() + requireAuth)
    implementation("org.springframework.boot:spring-boot-starter-security")

    // ── Kotlin stdlib ─────────────────────────────────────────────────────────
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib")

    // ── Database ──────────────────────────────────────────────────────────────
    // SQLite JDBC driver (replaces sql.js / better-sqlite3)
    implementation("org.xerial:sqlite-jdbc:3.45.3.0")

    // ── Authentication ────────────────────────────────────────────────────────
    // JJWT — JWT creation & verification (replaces jsonwebtoken npm package)
    implementation("io.jsonwebtoken:jjwt-api:0.11.5")
    runtimeOnly ("io.jsonwebtoken:jjwt-impl:0.11.5")
    runtimeOnly ("io.jsonwebtoken:jjwt-jackson:0.11.5")

    // BCrypt password hashing (replaces bcryptjs npm package)
    // Already provided transitively by spring-boot-starter-security,
    // declared explicitly for clarity.
    implementation("org.springframework.security:spring-security-crypto")

    // ── Jakarta EE (Servlet API) ──────────────────────────────────────────────
    // Needed for HttpServletRequest / HttpServletResponse in filters
    implementation("jakarta.servlet:jakarta.servlet-api:6.0.0")

    // ── JSON ──────────────────────────────────────────────────────────────────
    // Jackson Kotlin module — serialises Kotlin data classes to JSON
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")

    // ── AWS S3 ────────────────────────────────────────────────────────────────
    // AWS SDK v2 for S3 — document upload / presigned URL / delete
    implementation("software.amazon.awssdk:s3:2.25.60")
    implementation("software.amazon.awssdk:s3-presigner:2.25.60")

    // ── Test ──────────────────────────────────────────────────────────────────
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
}

// ── Test task ─────────────────────────────────────────────────────────────────
tasks.withType<Test> {
    useJUnitPlatform()
}
