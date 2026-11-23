CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	username VARCHAR(15) UNIQUE NOT NULL,
	password_hash VARCHAR(60) NOT NULL
);

CREATE TABLE sessions (
	user_id INTEGER NOT NULL REFERENCES users(id),
	token VARCHAR(64) PRIMARY KEY,
	expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE exercises (
	id SERIAL PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users(id),
	language VARCHAR(20) NOT NULL,
	exercise_text TEXT NOT NULL,
	clarification JSONB NULL,
	function_signature TEXT NOT NULL,
	solution_code TEXT NOT NULL,
	approach_notes TEXT NOT NULL, 
	assumptions TEXT NOT NULL,
	test_cases JSONB NOT NULL,
	self_check_passed BOOLEAN NOT NULL,
	self_check_notes TEXT,
	current_stage VARCHAR(20) NOT NULL DEFAULT 'understanding',
	progress JSONB NOT NULL DEFAULT '{}'::jsonb,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

)