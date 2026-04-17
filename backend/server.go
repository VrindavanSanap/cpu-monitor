package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

type server struct {
	db     *sql.DB
	buf    *ringBuffer
	apiKey string
}

type Response struct {
	Message string `json:"message"`
	Status  string `json:"status"`
}

type CPUData struct {
	Utilization float64 `json:"utilization"`
	Timestamp   string  `json:"timestamp"`
}

func (s *server) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/hello", s.handleHello)
	mux.HandleFunc("/api/cpu", s.handleCPU)
	return mux
}

func (s *server) handleHello(w http.ResponseWriter, r *http.Request) {
	if _, err := s.db.Exec("INSERT INTO requests(ip) VALUES(?)", r.RemoteAddr); err != nil {
		log.Printf("handleHello: db insert: %v", err)
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, Response{
		Message: "Hello from Go API with SQLite! Created by vrindavan",
		Status:  "success",
	})
}

func (s *server) handleCPU(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	switch r.Method {
	case http.MethodOptions:
		w.WriteHeader(http.StatusNoContent)
	case http.MethodGet:
		s.buf.evict()
		writeJSON(w, http.StatusOK, s.buf.snapshot())
	case http.MethodPost:
		s.postCPU(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *server) postCPU(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("X-API-Key") != s.apiKey {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var data CPUData
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	if _, err := s.db.Exec(
		"INSERT INTO cpu_data(utilization, timestamp) VALUES(?, ?)",
		data.Utilization, data.Timestamp,
	); err != nil {
		log.Printf("postCPU: db insert: %v", err)
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	s.buf.add(data)
	writeJSON(w, http.StatusCreated, Response{
		Message: "CPU data recorded successfully",
		Status:  "success",
	})
}

func setCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
