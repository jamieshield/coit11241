#!/usr/bin/bash
# Visit https:ip:4443 for your passwords
# curl https://raw.githubusercontent.com/jamieshield/coit11241/main/i.sh | sudo bash -s -

# The password is exposed on boot if navigator is not installed
# LEAKAGE
PASSWD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 40 ; echo 'V1@a')

USE_GOOGLE_AUTHENTICATOR=false

# Open firewall ports for cockpit and Wazuh
function crontabPorts() {  # cloud-init struggles with firewall-cmd
  # 1514,1515 Wazuh registration and comms - in some order; udp seems to be let through
  # 4443 Temp status server
  # cockpit
  # https Wazuh
  if ( ! sudo crontab -l | grep firewall-cmd >/dev/null ) ; then
      (sudo crontab -l ; echo "* * * * * sudo firewall-cmd --permanent --zone=public --add-port=4443/tcp 2>&1 2>/dev/null || true ;  sudo firewall-cmd --permanent --add-service=cockpit 2>&1 2>/dev/null || true ; sudo firewall-cmd --permanent --add-service=https 2>&1 2>/dev/null || true; sudo firewall-cmd --permanent --zone=public --add-port=1514/udp 2>&1 2>/dev/null || true; sudo firewall-cmd --permanent --zone=public --add-port=1514/tcp 2>&1 2>/dev/null || true; sudo firewall-cmd --zone=public --permanent --add-port=1515/tcp 2>&1 2>/dev/null || true; sudo firewall-cmd --reload || true; sudo crontab -l | grep -v firewall-cmd | sudo crontab -") | sudo crontab -
  fi
}

function rnice() {
	# osms and osms-agent
	sudo renice 20 $(ps -e | grep osms | cut -f1 -d"?")
	sudo systemctl stop packagekit
	sudo systemctl disable packagekit
	sudo systemctl mask packagekit
}

# Simple server to feedback password and installation status
function setupStatusServer() { # Arguments: PASSWD; Prereqs: google-authenticator setup
	if [ "${USE_GOOGLE_AUTHENTICATOR}" = true ]; then
		if ( ! grep pam_google_authenticator.so /etc/pam.d/cockpit >/dev/null) ; then
			sudo pip3 install pyotp
			sudo pip3 install qrcode
			sudo python -m pip install --upgrade pip
			sudo python3 -m pip install Pillow -v
		fi # already satisfied: pip install qrcode; 
	fi
        # The password is exposed if no wazuh-passwords.txt
	if [ ! -e /wazuh-passwords.txt ] ; then
	   if [ ! -e /home/opc/passwd ] ; then
                # Start the status and password server
		curl https://raw.githubusercontent.com/jamieshield/coit11241/main/qrrender.py | sudo python - & 
           fi
        fi
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
	#if ( ! dnf list installed 2>/dev/null | grep cockpit-navigator >/dev/null ) ; then
	# dnf is corrupting
	if [[ ! -e /wazuh-passwords.txt ]] ; then
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

		if [[ ! -e /wazuh-passwords.txt ]] ; then 
			sudo tar -O -xvzf /wazuh-install-files.tar wazuh-install-files/wazuh-passwords.txt | grep 'indexer_password' | head -n1 > /wazuh-passwords.txt
		fi
		#if [[ ! -e /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh.orig ]] ; then 
			#echo "Setting wazuh password. Alt we could extract current password during setup." 
			#sudo cp -n /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh  /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh.orig 
			#echo "Remove wazuh password checks"
			#sudo sed -e 's/if ! echo.*/if false ; then/' /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh.orig | sudo tee /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh > /dev/null
			##sudo chown -R wazuh-indexer /etc/wazuh-indexer/backup 
			##sudo chgrp -R wazuh-indexer /etc/wazuh-indexer/backup 
			#sudo rm -rf /etc/wazuh-indexer/backup # Access denied errors
			##sudo mkdir /etc/wazuh-indexer/backup
			#sudo /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh --user wazuh --password "${PASSWD}"
			#sudo rm -rf /etc/wazuh-indexer/backup # Access denied errors
		#fi

		echo "Prevent Indexer not starting - add timeout" 
		if [[ ! -e /etc/systemd/system/wazuh-indexer.service.d ]] ; then
			sudo mkdir /etc/systemd/system/wazuh-indexer.service.d
			echo -e "[Service]\nTimeoutStartSec=300" | sudo tee /etc/systemd/system/wazuh-indexer.service.d/startup-timeout.conf > /dev/null
		fi # https://www.reddit.com/r/Wazuh/comments/107vup6/wazuhindexer_and_wazuhmanager_fails_with_timeout/

		sudo cp --no-clobber /var/ossec/etc/ossec.conf /var/ossec/etc/ossec.conf.orig
		echo "Turn on vuln detection" 
		curl https://raw.githubusercontent.com/jamieshield/coit11241/main/configWazuh.py | sudo python -

		sudo systemctl daemon-reload
		if ( ! sudo crontab -l | grep wazuh-indexer >/dev/null ) ; then
			echo "Add Cron job to restart Wazuh if it falls over"
			(sudo crontab -l ; echo "0-59/10 * * * * if (! /usr/bin/systemctl status wazuh-indexer | grep running); then sudo systemctl stop wazuh-dashboard; sudo systemctl stop wazuh-manager; sudo systemctl start wazuh-indexer && sudo systemctl start wazuh-manager && sudo systemctl start wazuh-dashboard; fi" ) | sudo crontab -
		fi
	fi
}	

echo "Nice some processes" | tee -a /tmp/init_status
rnice
echo "Crontab Ports" | tee -a /tmp/init_status
crontabPorts
echo "Enable Cockpit" | tee -a /tmp/init_status
enableCockpit
echo "Generate certs for cockpit access and status server" | tee -a /tmp/init_status
curl https://localhost:9090 2>&1 >/dev/null || true
ls /etc/cockpit/ws-certs.d/ | tee -a /tmp/init_status
echo "Setup status server" | tee -a /tmp/init_status
setupStatusServer
#enableSwap
if [ "${USE_GOOGLE_AUTHENTICATOR}" = true ]; then
	echo "setupGoogleAuthenticator" | tee -a /tmp/init_status
        touch /tmp/googleAuthenticator # tell qrrender to render a qr
	setupGoogleAuthenticator
fi
echo "Setup Opc Passwd" | tee -a /tmp/init_status
setOpcPasswd
if [ "${USE_GOOGLE_AUTHENTICATOR}" = true ]; then
	echo "Setup Cockpit google authen" | tee -a /tmp/init_status
	setupCockpitGoogleAuthenticator
fi
rm -f /tmp/init_status
installNavigator
setupWazuh
touch /tmp/cloudinitcomplete

sudo systemctl start wazuh-indexer
sudo systemctl start wazuh-dashboard
sudo systemctl start wazuh-manager

