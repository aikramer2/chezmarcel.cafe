# photoalbum
# local testing
Before deploying, you need to pass in credentials to .aws/config.json like:
```
{
"accessKeyId": "<key>",
"secretAccessKey": "<secret>",
"region": "us-west-2"
}
```
and .mongo/.credentials like:
```
db_url=<url>
```


# heroku
heroku config:set db_url=<URL>
download heroku cli
heroku login
heroku create
commit, git push heroku master
