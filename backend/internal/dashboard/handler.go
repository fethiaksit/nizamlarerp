package dashboard

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"time"
)

func RegisterRoute(group *gin.RouterGroup, service *Service) {
	group.GET("/dashboard", func(c *gin.Context) {
		summary, err := service.GetDashboard(c.Request.Context(), time.Now())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Ana sayfa bilgileri alınırken bir sorun oluştu."})
			return
		}
		c.JSON(http.StatusOK, summary)
	})
}
