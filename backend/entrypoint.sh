#!/bin/bash

# Get the user ID from the environment variable or default to 1000
USER_ID=${LOCAL_UID:-1000}
GROUP_ID=${LOCAL_GID:-1000}

echo "Starting with UID : $USER_ID, GID : $GROUP_ID"

# Create a group and user inside the container matching the host IDs
# We check if the group/user exists first to avoid errors
getent group node >/dev/null || groupadd -g "$GROUP_ID" node
getent passwd node >/dev/null || useradd --shell /bin/bash -u "$USER_ID" -g "$GROUP_ID" -m node

# Optional: Ensure the app directory is owned by this new user
chown -R node:node /app

# Use gosu to execute the CMD as the new 'node' user
exec gosu node "$@"
