package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

const (
	addr   = ":8443"
	dbPath = "./app.db"
)

func main() {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	if err := migrate(db); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		log.Fatal("API_KEY environment variable is not set")
	}

	srv := &server{db: db, buf: &ringBuffer{}, apiKey: apiKey}

	log.Printf("Listening on %s", addr)
	if err := http.ListenAndServe(addr, srv.routes()); err != nil {
		log.Fatalf("listen: %v", err)
	}
}

func migrate(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS requests (
			id          INTEGER NOT NULL PRIMARY KEY,
			ip          TEXT
		);
		CREATE TABLE IF NOT EXISTS cpu_data (
			id          INTEGER NOT NULL PRIMARY KEY,
			utilization REAL,
			timestamp   TEXT
		);
	`)
	return err
}
