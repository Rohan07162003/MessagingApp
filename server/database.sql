CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(28) NOT NULL UNIQUE,
    passhash VARCHAR NOT NULL,
    userid VARCHAR NOT NULL UNIQUE
);

INSERT INTO users(username, passhash) values($1,$2);

-- Group Chat Table
CREATE TABLE group_chat(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by VARCHAR NOT NULL REFERENCES users(userid), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group Members Table (Mapping users to groups)
CREATE TABLE group_members(
    group_id INT NOT NULL REFERENCES group_chat(id),  -- Group reference
    user_id VARCHAR NOT NULL REFERENCES users(userid),  -- User reference
    role VARCHAR DEFAULT 'member',  -- Role in the group (e.g., member, admin)
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(group_id, user_id)
);

-- Group Messages Table (Same as before)
CREATE TABLE group_messages(
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES group_chat(id),
    from_user_id VARCHAR NOT NULL REFERENCES users(userid),  -- Reference `userid`
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message Reactions Table (Same as before)
CREATE TABLE message_reactions(
    id SERIAL PRIMARY KEY,
    message_id INT NOT NULL REFERENCES group_messages(id), //cascade
    user_id VARCHAR NOT NULL REFERENCES users(userid),  -- Reference `userid`
    emoji VARCHAR(5) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
