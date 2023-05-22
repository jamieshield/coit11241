#!/usr/bin/bash
# curl https://raw.githubusercontent.com/jamieshield/coit11241/main/i.sh | sudo PASSWD="pass" bash -s -
if [ ! -e /mnt/1GiB.swap ] ; then
	# Web console access? Not for terminal login
	echo -e "${PASSWD}\n${PASSWD}" | sudo passwd opc
	echo -e "${PASSWD}\n${PASSWD}" | sudo passwd ubuntu

	# https://help.ubuntu.com/community/SwapFaq
	sudo swapoff -a	
	sudo dd if=/dev/zero of=/mnt/1GiB.swap bs=1024 count=1048576
	sudo chmod 600 /mnt/1GiB.swap
	sudo mkswap /mnt/1GiB.swap
	sudo swapon /mnt/1GiB.swap
	echo '/mnt/1GiB.swap swap swap defaults 0 0' | sudo tee -a /etc/fstab
fi

if [ ! -e /etc/ajenti ] ; then
  # https://docs.ajenti.org/en/latest/man/install.html
  curl https://raw.githubusercontent.com/ajenti/ajenti/master/scripts/install.sh | sudo bash -s -
  sudo firewall-cmd --permanent --zone=public --add-port=8000/tcp
  sudo firewall-cmd --zone=public --add-port=8000/tcp
  echo -e "${PASSWD}\n${PASSWD}" | sudo passwd root
fi
