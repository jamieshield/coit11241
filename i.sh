#!/usr/bin/bash
# Visit https:ip:4443 for your passwords
# curl https://raw.githubusercontent.com/jamieshield/coit11241/main/i.sh | sudo bash -s -

PASSWD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 40 ; echo 'V1@a')

function crontabPorts() {  # cloud-init struggles with firewall-cmd
  if ( ! sudo crontab -l | grep firewall-cmd >/dev/null ) ; then
      (sudo crontab -l ; echo "* * * * * sudo firewall-cmd --permanent --zone=public --add-port=4443/tcp 2>&1 2>/dev/null || true ;  sudo firewall-cmd --permanent --add-service=cockpit 2>&1 2>/dev/null || true ; sudo firewall-cmd --permanent --add-service=https 2>&1 2>/dev/null || true; sudo firewall-cmd --permanent --zone=public --add-port=1514/udp 2>&1 2>/dev/null || true; sudo firewall-cmd --permanent --zone=public --add-port=1514/tcp 2>&1 2>/dev/null || true; sudo firewall-cmd --zone=public --permanent --add-port=1515/tcp 2>&1 2>/dev/null || true; sudo firewall-cmd --reload || true; sudo crontab -l | grep -v firewall-cmd | sudo crontab -") | sudo crontab -
  fi
}

function rnice() {
	# osms and osms-agent
	sudo renice 20 $(ps -e | grep osms | cut -f1 -d"?")
	sudo systemctl stop packagekit
	sudo systemctl disable packagekit
	
}

function setupStatusServer() { # Arguments: PASSWD; Prereqs: google-authenticator setup
	if ( ! grep pam_google_authenticator.so /etc/pam.d/cockpit >/dev/null) ; then
		sudo pip3 install pyotp
		sudo pip3 install qrcode
		#sudo pip3 install Pillow
		sudo python -m pip install --upgrade pip
		sudo python3 -m pip install Pillow -v
		curl https://raw.githubusercontent.com/jamieshield/coit11241/main/qrrender.py | sudo python - & 
	fi # already satisfied: pip install qrcode; 
}

function enableSwap() {
	if [ ! -e /mnt/2GiB.swap ] ; then # https://help.ubuntu.com/community/SwapFaq
		sudo swapoff -a	
		sudo dd if=/dev/zero of=/mnt/2GiB.swap bs=1024 count=2097152  
		sudo chmod 600 /mnt/2GiB.swap
		sudo mkswap /mnt/2GiB.swap
		echo '/mnt/2GiB.swap swap swap defaults 0 0' | sudo tee -a /etc/fstab
		sudo systemctl daemon-reload
		sudo swapon -a
	fi
}

function setupGoogleAuthenticator() {
	if ( ! yum list installed google-authenticator 2>/dev/null >/dev/null ) ; then 
		sudo yum -y install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
		sudo yum -y install google-authenticator
		sudo -u opc google-authenticator -t -d -f -r 3 -R 30 -W 
	fi # https://www.ezeelogin.com/kb/article/how-to-install-google-authenticator-on-centos-ubuntu-323.html
	# time, no reuse, force, 3 attempts/30s, min window
}

function setupCockpitGoogleAuthenticator() {
	if ( ! grep pam_google_authenticator.so /etc/pam.d/cockpit >/dev/null ) ; then
		echo "auth required pam_google_authenticator.so" | sudo tee -a /etc/pam.d/cockpit  >/dev/null
	fi
}

function setOpcPasswd() {
	if [ ! -e /home/opc/passwd ] ; then
		echo -e "${PASSWD}" | sudo tee /home/opc/passwd >/dev/null
		# Web console access? Not for terminal login
		echo -e "${PASSWD}\n${PASSWD}" | sudo passwd opc
	fi
}

function enableCockpit() { # 9090
	if ( ! systemctl status cockpit.socket | grep running ) ; then 
		sudo systemctl enable --now cockpit.socket
	fi

}

function installNavigator() { #https://github.com/45Drives/cockpit-navigator
	if ( ! dnf list installed 2>/dev/null | grep cockpit-navigator >/dev/null ) ; then
		echo "Install cockpit-navigator" 
		curl -sSL https://repo.45drives.com/setup | sudo bash -s -
		sudo dnf -q -y install cockpit-navigator
	fi
}

function setupWazuh() {
	if [[ ! -e ./wazuh-install.sh ]] ; then # https://documentation.wazuh.com/current/quickstart.html
		curl -sO https://packages.wazuh.com/4.4/wazuh-install.sh 
		sudo bash ./wazuh-install.sh -a -i

		sudo systemctl stop wazuh-dashboard
		sudo systemctl stop wazuh-manager
		sudo systemctl stop wazuh-indexer
		sudo systemctl stop filebeat
		sudo systemctl disable filebeat

		echo "Setting wazuh password. Alt we could extract current password during setup."
		# remove password checks
		if [[ ! -e /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh.orig ]] ; then 
			sudo cp -n /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh  /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh.orig 
			sudo sed -e 's/if ! echo.*/if false ; then/' /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh.orig | sudo tee /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh > /dev/null
			sudo rm -rf /etc/wazuh-indexer/backup # Access denied errors
			sudo /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh --user admin --password "${PASSWD}"
		fi

		# indexer not starting - timeout
		if [[ ! -e /etc/systemd/system/wazuh-indexer.service.d ]] ; then
			sudo mkdir /etc/systemd/system/wazuh-indexer.service.d
			echo -e "[Service]\nTimeoutStartSec=240" | sudo tee /etc/systemd/system/wazuh-indexer.service.d/startup-timeout.conf > /dev/null
		fi # https://www.reddit.com/r/Wazuh/comments/107vup6/wazuhindexer_and_wazuhmanager_fails_with_timeout/

		sudo cp --no-clobber /var/ossec/etc/ossec.conf /var/ossec/etc/ossec.conf.orig
		# Turn on vuln detection
		curl https://raw.githubusercontent.com/jamieshield/coit11241/main/configWazuh.py | sudo python -

		sudo systemctl daemon-reload
		if ( ! sudo crontab -l | grep wazuh-indexer >/dev/null ) ; then
			(sudo crontab -l ; echo "0-59/10 * * * * if (! /usr/bin/systemctl status wazuh-indexer | grep running); then sudo systemctl stop wazuh-dashboard; sudo systemctl stop wazuh-manager; sudo systemctl start wazuh-indexer && sudo systemctl start wazuh-manager && sudo systemctl start wazuh-dashboard; fi" ) | sudo crontab -
		fi

	fi
}	

rnice
crontabPorts
echo "Enable Cockpit" | tee -a /tmp/init_status
enableCockpit
echo "Generate certs" | tee -a /tmp/init_status
curl https://localhost:9090 2>&1 >/dev/null || true
ls /etc/cockpit/ws-certs.d/ | tee -a /tmp/init_status
echo "Enable status server" | tee -a /tmp/init_status
setupStatusServer
#enableSwap
echo "setupGoogleAuthenticator" | tee -a /tmp/init_status
setupGoogleAuthenticator
echo "Setup Opc Passwd" | tee -a /tmp/init_status
setOpcPasswd
echo "Setup Cockpit google authen" | tee -a /tmp/init_status
setupCockpitGoogleAuthenticator
rm -f /tmp/init_status
installNavigator
setupWazuh

sudo systemctl start wazuh-indexer
sudo systemctl start wazuh-dashboard
sudo systemctl start wazuh-manager

#








# OBASOLETE

if [ ! -e /etc/ajenti ] ; then
  # https://docs.ajenti.org/en/latest/man/install.html
  curl https://raw.githubusercontent.com/ajenti/ajenti/master/scripts/install.sh | sudo bash -s -
  #sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8000 -j ACCEPT
  #sudo netfilter-persistent save
  sudo firewall-cmd --permanent --zone=public --add-port=8000/tcp
  sudo firewall-cmd --zone=public --add-port=8000/tcp
  echo -e "${PASSWD}\n${PASSWD}" | sudo passwd root
fi

#

Install Wazuh
https://documentation.wazuh.com/current/quickstart.html
curl -sO https://packages.wazuh.com/4.4/wazuh-install.sh && sudo bash ./wazuh-install.sh -a -i


#sudo cp -n /etc/ajenti/config.yml /etc/ajenti/config.yml.orig
#sudo sed -e "s/provider: os/provider: users/" /etc/ajenti/config.yml.orig | sudo tee /etc/ajenti/config.yml >/dev/null
#sudo systemctl restart ajenti


export DEBIAN_FRONTEND=noninteractive
sudo apt-get install dialog apt-utils -yq
sudo apt install -yq vim


if ( dpkg -l ubuntu-desktop-minimal >/dev/null ); then 
	echo "desktop minimal installed"
else
		sudo apt update
		sudo apt-get install dialog apt-utils -yq
		sudo apt-get -yq install ubuntu-desktop-minimal
		sudo reboot
fi
		
if ( dpkg -l chrome-remote-desktop >/dev/null ); then 
	echo "desktop minimal installed"
else
		cd /home/ubuntu; wget https://dl.google.com/linux/direct/chrome-remote-desktop_current_amd64.deb
		sudo apt-get install -yq /home/ubuntu/chrome-remote-desktop_current_amd64.deb
		
		# TODO replace the following line - add --pin=123456 using your own pin
		# https://remotedesktop.google.com/home
		DISPLAY= /opt/google/chrome-remote-desktop/start-host --code="4/0AbUR2VN7BWUcgerseFwiMsavHjudPaTvyHDSZvQIi9F7BUnYA4PEY3yhqipSVMPdNtDCQw" --redirect-url="https://remotedesktop.google.com/_/oauthredirect" --name=$(hostname) --pin=123456
fi




if ( dpkg -l ubuntu-desktop-minimal >/dev/null );

if ( dpkg -l wazuh-dashboard >/dev/null ); then 
	echo "wazuh installed"
fi


