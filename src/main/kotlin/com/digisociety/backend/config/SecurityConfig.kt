package com.digisociety.backend.config

import com.digisociety.backend.middleware.JwtAuthFilter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
class SecurityConfig(private val jwtAuthFilter: JwtAuthFilter) {

    companion object {
        private val ALLOWED_METHODS = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
        private val ALLOWED_HEADERS = listOf("Content-Type", "Authorization")
        private val BASE_ORIGINS = listOf(
            "http://localhost:5173",
            "http://localhost:4173",
            "http://127.0.0.1:5173",
            "https://college.digisociety.in"
        )
    }

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .cors { it.configurationSource(corsConfigurationSource()) }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers(
                        "/api/health",
                        "/api/auth/register",
                        "/api/auth/login",
                        "/api/auth/forgot-password",
                        "/api/auth/send-otp",
                        "/api/auth/verify-otp",
                        "/api/auth/reset-password"
                    ).permitAll()
                    .anyRequest().permitAll()   // fine-grained guards are in the controllers
            }
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter::class.java)
        return http.build()
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val config = CorsConfiguration()
        val origins = BASE_ORIGINS.toMutableList()
        System.getenv("FRONTEND_URL")?.let { origins.add(it) }
        config.allowedOrigins   = origins
        config.allowedMethods   = ALLOWED_METHODS
        config.allowedHeaders   = ALLOWED_HEADERS
        config.allowCredentials = true
        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return source
    }

    @Bean
    fun passwordEncoder(): BCryptPasswordEncoder = BCryptPasswordEncoder(10)
}
