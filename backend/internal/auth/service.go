package auth

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("Kullanıcı adı veya şifre hatalı")
)

type Service struct {
	repo         Repository
	tokenService TokenService
	tokenTTL     time.Duration
}

func NewService(repo Repository, tokenService TokenService) *Service {
	return &Service{
		repo:         repo,
		tokenService: tokenService,
		tokenTTL:     24 * time.Hour,
	}
}

func (s *Service) Authenticate(ctx context.Context, identifier, password string) (*User, error) {
	cleanIdentifier := strings.TrimSpace(identifier)
	if cleanIdentifier == "" || password == "" {
		return nil, ErrInvalidCredentials
	}

	user, err := s.repo.GetByUsernameOrEmail(ctx, cleanIdentifier)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return user, nil
}

func (s *Service) GenerateToken(user *User) (string, error) {
	return s.tokenService.GenerateToken(user, s.tokenTTL)
}

func (s *Service) GetUserByID(ctx context.Context, id uuid.UUID) (*User, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) ValidateToken(tokenString string) (*TokenClaims, error) {
	return s.tokenService.ValidateToken(tokenString)
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
