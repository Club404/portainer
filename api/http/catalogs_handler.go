package http

import (
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// CatalogsHandler represents an HTTP API handler for managing Catalogs.
type CatalogsHandler struct {
	*mux.Router
	Logger            *log.Logger
	middleWareService *middleWareService
	catalogsURL      string
}

// NewCatalogsHandler returns a new instance of CatalogsHandler.
func NewCatalogsHandler(middleWareService *middleWareService) *CatalogsHandler {
	h := &CatalogsHandler{
		Router:            mux.NewRouter(),
		Logger:            log.New(os.Stderr, "", log.LstdFlags),
		middleWareService: middleWareService,
	}
	h.Handle("/catalogs", middleWareService.addMiddleWares(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.handleGetCatalogs(w, r)
	})))
	return h
}

// handleGetCatalogs handles GET requests on /catalogs
func (handler *CatalogsHandler) handleGetCatalogs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		handleNotAllowed(w, []string{http.MethodGet})
		return
	}

	resp, err := http.Get(handler.catalogsURL)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}
