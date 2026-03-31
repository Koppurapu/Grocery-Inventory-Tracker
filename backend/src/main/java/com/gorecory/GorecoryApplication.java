package com.gorecory;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GorecoryApplication {

	public static void main(String[] args) {
		// Load .env file from the project root (backend directory)
		Dotenv dotenv = Dotenv.configure()
				.directory("./")        // looks for .env in backend/
				.ignoreIfMissing()      // won't crash if .env is absent (e.g. in CI/prod)
				.load();

		// Push every .env entry into System properties so Spring can resolve ${VAR}
		dotenv.entries().forEach(entry ->
				System.setProperty(entry.getKey(), entry.getValue())
		);

		SpringApplication.run(GorecoryApplication.class, args);
	}
}
