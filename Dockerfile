# Debian Jessie debootstrap from 2017-02-27
FROM ubuntu@sha256:84c334414e2bfdcae99509a6add166bbb4fa4041dc3fa6af08046a66fed3005f

# Install all OS dependencies for notebook server that starts but lacks all
# features (e.g., download as all possible file formats)
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get -yq dist-upgrade \
 && apt-get install -yq --no-install-recommends \
    wget \
    bzip2 \
    ca-certificates \
    sudo \
    locales \
    fonts-liberation \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*
RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && \
    locale-gen

# get curl
RUN apt-get update && apt-get install -y curl

### Install node
RUN curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
RUN apt-get install -y nodejs
RUN apt-get install -y build-essential

ENV HOME /home/aaron
ENV LC_ALL en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US.UTF-8
ENV WEB_USER aaron
ENV WEB_UID 1000


# set pass and add to sudoers
RUN useradd -m -s /bin/bash -N -u $WEB_UID $WEB_USER && \
    echo "$WEB_USER:$WEB_USER" | chpasswd && \
    adduser $WEB_USER sudo

RUN  apt-get install -y python-setuptools python-dev build-essential
RUN easy_install pip
RUN apt-get install -y awscli
RUN pip install --upgrade pip
RUN pip install jupyter
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
RUN echo "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.4 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list
RUN apt-get update
RUN apt-get install -y mongodb-org wget nano

# get heroku cli
RUN wget -qO- https://cli-assets.heroku.com/install-ubuntu.sh | sh


USER $WEB_USER
RUN echo "PATH=~/.local/bin:$PATH" >> ~/.bash_rc
WORKDIR $HOME

ENV PORT 8889
