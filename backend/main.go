package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	_ "github.com/mattn/go-sqlite3"
)

type Response struct {
	Message string `json:"message"`
	Status  string `json:"status"`
}

func main() {
	// Initialize SQLite Database
	db, err := sql.Open("sqlite3", "./app.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Create a simple table
	sqlStmt := `
	CREATE TABLE IF NOT EXISTS requests (id INTEGER NOT NULL PRIMARY KEY, ip TEXT);
	`
	_, err = db.Exec(sqlStmt)
	if err != nil {
		log.Printf("%q: %s\n", err, sqlStmt)
		return
	}

	http.HandleFunc("/api/hello", func(w http.ResponseWriter, r *http.Request) {
		// Log the incoming request to SQLite
		_, err = db.Exec("INSERT INTO requests(ip) VALUES(?)", r.RemoteAddr)
		if err != nil {
			log.Printf("Error inserting into DB: %v", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(Response{
			Message: "Hello from Go HTTPS API with SQLite! Created by vrindavan",
			Status:  "success",
		})
	})

	log.Println("Starting HTTPS server on https://localhost:8443 )")
	
	// Start HTTPS server using TLS certificates
	// You can generate local self-signed certs via:
	// go run $(go env GOROOT)/src/crypto/tls/generate_cert.go --host localhost
	err = http.ListenAndServe(":8443", nil)
	if err != nil {
		log.Fatal("ListenAndServeTLS error: ", err)
	}
}
