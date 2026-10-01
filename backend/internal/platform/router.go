package platform

import (
	"net/http"

	"github.com/fethiaksit/nizamlar-erp/backend/internal/customers"
	"github.com/fethiaksit/nizamlar-erp/backend/internal/dashboard"
	"github.com/fethiaksit/nizamlar-erp/backend/internal/jobs"
	"github.com/fethiaksit/nizamlar-erp/backend/internal/ledger"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Dependencies are shared application resources passed to route modules.
type Dependencies struct {
	DB             *pgxpool.Pool
	FrontendOrigin string
}

func NewRouter(deps Dependencies) *gin.Engine {
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())
	router.Use(cors(deps.FrontendOrigin))

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := router.Group("/api/v1")
	if deps.DB != nil {
		customerRepository := customers.NewRepository(deps.DB)
		ledgerRepository := ledger.NewRepository(deps.DB)
		customers.RegisterRoutes(api, customers.NewService(customerRepository, ledgerRepository))
		jobs.RegisterRoutes(api, jobs.NewService(jobs.NewRepository(deps.DB)))
		dashboard.RegisterRoute(api, dashboard.NewService(dashboard.NewRepository(deps.DB)))
	}

	return router
}

func cors(origin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if origin != "" {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
		if c.Request.Method == http.MethodOptions {
			c.Status(http.StatusNoContent)
			c.Abort()
			return
		}
		c.Next()
	}
}
