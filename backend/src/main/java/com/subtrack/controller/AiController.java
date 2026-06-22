package com.subtrack.controller;

import com.subtrack.service.AiAssistantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiAssistantService aiAssistantService;

    public AiController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    @PostMapping("/query")
    public ResponseEntity<Map<String, String>> askAi(@RequestBody Map<String, String> payload) {
        String query = payload.get("query");
        return ResponseEntity.ok(aiAssistantService.answerQuery(query));
    }
}
