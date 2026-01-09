CREATE TABLE users_identity (
    user_id           BIGINT PRIMARY KEY,
    email_blind_index CHAR(64) NOT NULL UNIQUE,
    email_encrypted   BYTEA   NOT NULL,
    password_hash     TEXT    NOT NULL,
    created_at        TIMESTAMP DEFAULT now()
);



CREATE TABLE refresh_tokens (
    token_hash   CHAR(64) PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    device_id    TEXT NOT NULL,
    expires_at   TIMESTAMP NOT NULL,
    created_at   TIMESTAMP DEFAULT now(),
    revoked      BOOLEAN DEFAULT false,
    FOREIGN KEY (user_id) REFERENCES users_identity(user_id)
);


CREATE TABLE user_profiles (
    user_id      BIGINT PRIMARY KEY,
    username     VARCHAR(30) UNIQUE NOT NULL,
    avatar_url   TEXT,
    bio          TEXT,
    account_type VARCHAR(10) CHECK (account_type IN ('public','private','verified')),
    created_at   TIMESTAMP DEFAULT now()
);


CREATE TABLE follows (
    follower_id BIGINT,
    followee_id BIGINT,
    status      VARCHAR(10) CHECK (status IN ('pending','accepted')),
    created_at  TIMESTAMP DEFAULT now(),
    PRIMARY KEY (follower_id, followee_id)
);


CREATE TABLE blocks (
    blocker_id BIGINT,
    blocked_id BIGINT,
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users_identity(user_id),
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL
);
