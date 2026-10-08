package auth

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestJWTTokenServiceGenerateAndValidate(t *testing.T) {
	secret := "test-secret-key-at-least-32-characters-long"
	tokenService := NewJWTTokenService(secret)

	user := &User{
		ID:       uuid.New(),
		Username: "testuser",
		Email:    "test@example.com",
		Role:     "admin",
	}

	token, err := tokenService.GenerateToken(user, 1*time.Hour)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	claims, err := tokenService.ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}

	if claims.UserID != user.ID {
		t.Errorf("got UserID %v, want %v", claims.UserID, user.ID)
	}
	if claims.Username != user.Username {
		t.Errorf("got Username %q, want %q", claims.Username, user.Username)
	}
	if claims.Email != user.Email {
		t.Errorf("got Email %q, want %q", claims.Email, user.Email)
	}
	if claims.Role != user.Role {
		t.Errorf("got Role %q, want %q", claims.Role, user.Role)
	}
}

func TestJWTTokenServiceRejectsExpiredToken(t *testing.T) {
	secret := "test-secret-key-at-least-32-characters-long"
	tokenService := NewJWTTokenService(secret)

	user := &User{
		ID:       uuid.New(),
		Username: "testuser",
		Email:    "test@example.com",
		Role:     "admin",
	}

	// Generate already expired token
	token, err := tokenService.GenerateToken(user, -1*time.Hour)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	_, err = tokenService.ValidateToken(token)
	if err == nil {
		t.Fatal("expected error for expired token, got nil")
	}
}

func TestJWTTokenServiceRejectsTamperedSignature(t *testing.T) {
	tokenService1 := NewJWTTokenService("secret-one-secret-one-secret-one-12")
	tokenService2 := NewJWTTokenService("secret-two-secret-two-secret-two-12")

	user := &User{
		ID:       uuid.New(),
		Username: "testuser",
		Email:    "test@example.com",
		Role:     "admin",
	}

	token, err := tokenService1.GenerateToken(user, 1*time.Hour)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	_, err = tokenService2.ValidateToken(token)
	if err == nil {
		t.Fatal("expected error for tampered secret, got nil")
	}
}
