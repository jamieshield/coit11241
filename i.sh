#!/usr/bin/bash
# curl https://raw.githubusercontent.com/jamieshield/coit11241/main/i.sh | sudo bash -s -
PASSWD="V1@agrant"
if [ ! -e /home/opc/passwd ] ; then
	echo "Web console password: ${PASSWD}" | sudo tee /home/opc/passwd >/dev/null
	# Web console access? Not for terminal login
	#echo -e "${PASSWD}\n${PASSWD}" | sudo passwd ubuntu
	echo -e "${PASSWD}\n${PASSWD}" | sudo passwd opc
fi

if ( ! systemctl status cockpit | grep running ) ; then 
  sudo systemctl enable --now cockpit.socket	
  # https://docs.oracle.com/en/operating-systems/oracle-linux/cockpit/cockpit-install.html#logging-into-cockpit
  # 9090
  sudo firewall-cmd --add-service=cockpit --permanent
  sudo firewall-cmd --reload
fi

# osms and osms-agent
sudo renice 20 $(ps -e | grep osms | cut -f1 -d"?")
#sudo renice 20 $(ps -e | grep wazuh-syscheckd | cut -f1 -d"?")

if [ ! -e /mnt/2GiB.swap ] ; then
	# https://help.ubuntu.com/community/SwapFaq
	sudo swapoff -a	
	sudo dd if=/dev/zero of=/mnt/2GiB.swap bs=1024 count=2097152  
	sudo chmod 600 /mnt/2GiB.swap
	sudo mkswap /mnt/2GiB.swap
	sudo swapon /mnt/2GiB.swap
	echo '/mnt/2GiB.swap swap swap defaults 0 0' | sudo tee -a /etc/fstab
fi

if ( ! dnf list installed 2>/dev/null | grep cockpit-navigator >/dev/null ) ; then
  echo "Install cockpit-navigator"
  #https://github.com/45Drives/cockpit-navigator
  #sudo dnf install https://github.com/45Drives/cockpit-navigator/releases/download/v0.5.10/cockpit-navigator-0.5.10-1.el8.noarch.rpm
  curl -sSL https://repo.45drives.com/setup -o setup-repo.sh
  sudo bash setup-repo.sh
  sudo dnf -q -y install cockpit-navigator
fi
