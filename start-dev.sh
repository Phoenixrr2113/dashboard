NODE_ENV=development \
PAGE_SIZE=3 \
DASHBOARD_SERVER="http://localhost:8001" \
PORT=8001 \
STORAGE_PATH=/tmp/test-data \

# Dashboard startup parameters
# These ENV variables let you tweak certain parts of Dashboard to your preference.

# NODE_ENV=development 
# production | development | testing
# when in production strict configuration is required

# PAGE_SIZE=3 
# number
# the number of rows of data on object list pages

# DASHBOARD_SERVER="http://localhost:8001" 
# URL
# the URL to your dashboard server

# DOMAIN=localhost 
# web domain
# the domain of your application server

# IP=0.0.0.0 
# ip default localhost
# start server on a public IP address

# PORT=8001 
# number
# start server on a specific port

# STORAGE_PATH=/tmp/test-data
# storage path if using file system

# ID_LENGTH=6 
# number
# the length of random ids

# ALLOW_PUBLIC_API=false 
# false | true default false
# permits public access to the browser API

# REQUIRE_PROFILE_EMAIL=false 
# false | true default false
# requires email address when registering

# REQUIRE_PROFILE_NAME=false 
# false |true default false
# requires name when registering

# DELETE_DELAY=7 # number
# accounts are flagged for deletion after this many days

# MINIMUM_PASSWORD_LENGTH=10 
# number default 1
# minimum length for passwords 

# MAXIMUM_PASSWORD_LENGTH=100 
# number default 50
# maximum length for passwords

# MINIMUM_USERNAME_LENGTH=10 
# number default 1
# minimum length for usernames

# MAXIMUM_USERNAME_LENGTH=100 
# number default 50
# maximum length for usernames

# MINIMUM_RESET_CODE_LENGTH=1 
# number default 10
# minumum length for account reset codes

# MAXIMUM_RESET_CODE_LENGTH=100 
# number default 50
# maximum length for account reset codes

# MINIMUM_PROFILE_FIRST_NAME_LENGTH=1 
# number default 1
# minumum length for first name

# MAXIMUM_PROFILE_FIRST_NAME_LENGTH=50 
# number default 50
# minumum length for first name

# MINIMUM_PROFILE_LAST_NAME_LENGTH=1 
# number default 1
# minumum length for last name

# MAXIMUM_PROFILE_LAST_NAME_LENGTH=50 
# number default 50
# minumum length for last name