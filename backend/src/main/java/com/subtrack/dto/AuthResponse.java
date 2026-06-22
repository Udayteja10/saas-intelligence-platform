package com.subtrack.dto;

public record AuthResponse(
    String token,
    String refreshToken,
    Long userId,
    Long organizationId,
    String name,
    String email,
    String role
) {}
