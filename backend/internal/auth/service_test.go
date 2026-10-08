package auth

import (
	"context"
	"testing"

	"github.com/google/uuid"
)

type mockUserRepository struct {
	users      map[string]*User
	usersByID  map[uuid.UUID]*User
	countValue int
}

func newMockUserRepository() *mockUserRepository {
	return &mockUserRepository{
		users:     make(map[string]*User),
		usersByID: make(map[uuid.UUID]*User),
	}
}

func (m *mockUserRepository) GetByUsernameOrEmail(ctx context.Context, identifier string) (*User, error) {
	if u, ok := m.users[identifier]; ok {
		return u, nil
	}
	return nil, ErrUserNotFound
}

func (m *mockUserRepository) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	if u, ok := m.usersByID[id]; ok {
		return u, nil
	}
	return nil, ErrUserNotFound
}

func (m *mockUserRepository) CreateUser(ctx context.Context, user *User) error {
	if user.ID == uuid.Nil {
		user.ID = uuid.New()
	}
	m.users[user.Username] = user
	m.users[user.Email] = user
	m.usersByID[user.ID] = user
	m.countValue++
	return nil
}

func (m *mockUserRepository) CountUsers(ctx context.Context) (int, error) {
	return m.countValue, nil
}

func TestServiceAuthenticateSuccess(t *testing.T) {
	repo := newMockUserRepository()
	password := "guclu_parola_123"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}

	user := &User{
		ID:           uuid.New(),
		Username:     "admin",
		Email:        "admin@nizamlar.com",
		FullName:     "Sistem Yöneticisi",
		Role:         "admin",
		PasswordHash: hash,
	}
	_ = repo.CreateUser(context.Background(), user)

	tokenService := NewJWTTokenService("test-secret-at-least-32-characters-long")
	service := NewService(repo, tokenService)

	// Authenticate with username
	authenticatedUser, err := service.Authenticate(context.Background(), "admin", password)
	if err != nil {
		t.Fatalf("expected successful auth with username, got error: %v", err)
	}
	if authenticatedUser.ID != user.ID {
		t.Errorf("got user ID %v, want %v", authenticatedUser.ID, user.ID)
	}

	// Authenticate with email
	authenticatedUser, err = service.Authenticate(context.Background(), "admin@nizamlar.com", password)
	if err != nil {
		t.Fatalf("expected successful auth with email, got error: %v", err)
	}
	if authenticatedUser.ID != user.ID {
		t.Errorf("got user ID %v, want %v", authenticatedUser.ID, user.ID)
	}
}

func TestServiceAuthenticateInvalidPassword(t *testing.T) {
	repo := newMockUserRepository()
	hash, _ := HashPassword("dogru_parola")
	user := &User{
		ID:           uuid.New(),
		Username:     "admin",
		Email:        "admin@nizamlar.com",
		PasswordHash: hash,
	}
	_ = repo.CreateUser(context.Background(), user)

	tokenService := NewJWTTokenService("test-secret-at-least-32-characters-long")
	service := NewService(repo, tokenService)

	_, err := service.Authenticate(context.Background(), "admin", "yanlis_parola")
	if err != ErrInvalidCredentials {
		t.Fatalf("expected ErrInvalidCredentials, got %v", err)
	}
}

func TestServiceAuthenticateUserNotFound(t *testing.T) {
	repo := newMockUserRepository()
	tokenService := NewJWTTokenService("test-secret-at-least-32-characters-long")
	service := NewService(repo, tokenService)

	_, err := service.Authenticate(context.Background(), "olmayan_kullanici", "parola")
	if err != ErrInvalidCredentials {
		t.Fatalf("expected ErrInvalidCredentials, got %v", err)
	}
}
