package auth

import (
	"time"

	"github.com/google/uuid"
)

// User represents an authenticated system user.
type User struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	Username     string    `json:"username"`
	FullName     string    `json:"full_name"`
	Role         string    `json:"role"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// UserPublicResponse is the safe user representation returned to API consumers.
type UserPublicResponse struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}

// ToPublic converts User to UserPublicResponse.
func (u *User) ToPublic() UserPublicResponse {
	return UserPublicResponse{
		ID:       u.ID.String(),
		Email:    u.Email,
		Username: u.Username,
		FullName: u.FullName,
		Role:     u.Role,
	}
}

// LoginRequest defines the payload for user login.
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse defines the response after successful login.
type LoginResponse struct {
	Token string             `json:"token"`
	User  UserPublicResponse `json:"user"`
}
