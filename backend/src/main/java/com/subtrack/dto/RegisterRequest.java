package com.subtrack.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Organization name is required")
    String organizationName,

    @NotBlank(message = "Admin name is required")
    String adminName,

    @NotBlank(message = "Admin email is required")
    @Email(message = "Invalid email format")
    String adminEmail,

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    String password
) {}
