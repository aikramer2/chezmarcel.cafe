projectpath=~/Code/personal-projects/kiras-photo-project
docker run --privileged -t -i -p 5000:5000 -p 8889:8889 \
  -v $projectpath/.aws:/home/aaron/.aws \
  -v $projectpath/.mongo:/home/aaron/.mongo \
  -v $projectpath:/home/aaron/application \
  --env-file .mongo/.credentials \
  kiras-photo-project
# -v $projectpath/.credentials:/home/aaron/.aws/credentials \
# source .mongo/.credentials
