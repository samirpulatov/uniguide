package com.samir.uniguide;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// entry point; see project CLAUDE.md for the package-by-layer structure (controller/service/repository/etc.)
@SpringBootApplication
public class UniguideApplication {

	public static void main(String[] args) {
		SpringApplication.run(UniguideApplication.class, args);
	}

}
