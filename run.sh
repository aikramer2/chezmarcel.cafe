projectpath=~/Code/personal-projects/kiras-photo-project
docker run --privileged -t -i -p 8889:8889 \
  -v $projectpath/.aws:/home/aaron/.aws \
  -v $projectpath/.mongo:/home/aaron/.mongo \
  -v $projectpath/application:/home/aaron/application \
  -v $projectpath/photos:/home/aaron/photos \
  -v $projectpath/data:/home/aaron/data \
  --env-file .mongo/.credentials \
  kiras-photo-project
# -v $projectpath/.credentials:/home/aaron/.aws/credentials \
# source .mongo/.credentials
