CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(28) NOT NULL UNIQUE,
    passhash VARCHAR NOT NULL,
    userid VARCHAR NOT NULL UNIQUE
);

INSERT INTO users(username, passhash) values($1,$2);

CREATE TABLE group_chat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,  -- Changed from SERIAL to UUID
    name VARCHAR(255) NOT NULL,
    created_by VARCHAR NOT NULL REFERENCES users(userid), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group Members Table (Mapping users to groups)
CREATE TABLE group_members (
    group_id UUID NOT NULL REFERENCES group_chat(id) ON DELETE CASCADE,  -- Changed from INT to UUID
    user_id VARCHAR NOT NULL REFERENCES users(userid),  
    role VARCHAR DEFAULT 'member',  
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
);

-- Group Messages Table
CREATE TABLE group_messages (
    id SERIAL PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES group_chat(id) ON DELETE CASCADE,  -- Changed from INT to UUID
    from_user_id VARCHAR NOT NULL REFERENCES users(userid),  
    content TEXT NOT NULL,
    is_media BOOLEAN DEFAULT FALSE,
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

CREATE TABLE stories (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(userid),
    media_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
    likes_count INT DEFAULT 0;
);

CREATE TABLE story_views (
    id SERIAL PRIMARY KEY,
    story_id INT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id VARCHAR NOT NULL REFERENCES users(userid),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE story_likes (
    id SERIAL PRIMARY KEY,
    story_id INT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(userid) ON DELETE CASCADE,
    liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (story_id, user_id)  -- Ensures a user can like a story only once
);

