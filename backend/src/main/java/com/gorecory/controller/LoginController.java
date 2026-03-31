package com.gorecory.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LoginController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT * FROM users WHERE email = ? AND password = ?", email, password
        );

        Map<String, Object> response = new HashMap<>();
        if (!rows.isEmpty()) {
            Map<String, Object> user = rows.get(0);
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("name", user.get("name"));
            userInfo.put("email", user.get("email"));
            response.put("success", true);
            response.put("token", "demo-token-123");
            response.put("user", userInfo);
            return ResponseEntity.ok(response);
        }
        response.put("error", "Invalid credentials");
        return ResponseEntity.status(401).body(response);
    }
}
