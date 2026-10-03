package settings

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(group *gin.RouterGroup, service *Service) {
	group.GET("/settings", func(c *gin.Context) {
		s, err := service.Get(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Ayarlar yüklenirken sorun oluştu."})
			return
		}
		c.JSON(http.StatusOK, s)
	})

	group.POST("/settings", func(c *gin.Context) {
		var input CompanySettings
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçerli ayar bilgilerini girin."})
			return
		}
		s, err := service.Update(c.Request.Context(), input)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusOK, s)
	})
}
