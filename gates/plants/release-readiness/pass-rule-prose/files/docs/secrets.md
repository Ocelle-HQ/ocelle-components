# Secrets

An .npmrc line such as `_authToken=abc123` with a literal value is a hit, and so is a line
`DEPLOY_TOKEN=abc123` in a .env file; a value read from a variable is not.
