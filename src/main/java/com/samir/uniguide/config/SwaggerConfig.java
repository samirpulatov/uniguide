package com.samir.uniguide.config;


import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// exposes Swagger UI at /swagger-ui/index.html; @SecurityScheme registers the "bearerAuth" scheme
// referenced by controllers' @SecurityRequirement(name = "bearerAuth") annotations
@Configuration
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)
public class SwaggerConfig {
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("UniGuide API")
                        .description("REST API for international students")
                        .version("1.0.0"));
    }
}
