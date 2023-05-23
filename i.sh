#!/usr/bin/bash
# Visit https:ip:4443 for your passwords
# curl https://raw.githubusercontent.com/jamieshield/coit11241/main/i.sh | sudo bash -s -

PASSWD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 40 ; echo '')

function rnice() {
	# osms and osms-agent
	sudo renice 20 $(ps -e | grep osms | cut -f1 -d"?")
}

function setupStatusServer() { # Arguments: PASSWD; Prereqs: google-authenticator setup
	if ( ! grep pam_google_authenticator.so /etc/pam.d/cockpit >/dev/null) ; then
		sudo firewall-cmd --zone=public --add-port=4443/tcp
		sudo pip3 install pyotp
		sudo pip3 install qrcode
		curl https://raw.githubusercontent.com/jamieshield/coit11241/main/qrrender.py | sudo python - & 
	fi # already satisfied: pip install qrcode; 
}

function enableSwap() {
	if [ ! -e /mnt/2GiB.swap ] ; then # https://help.ubuntu.com/community/SwapFaq
		sudo swapoff -a	
		sudo dd if=/dev/zero of=/mnt/2GiB.swap bs=1024 count=2097152  
		sudo chmod 600 /mnt/2GiB.swap
		sudo mkswap /mnt/2GiB.swap
		sudo swapon /mnt/2GiB.swap
		echo '/mnt/2GiB.swap swap swap defaults 0 0' | sudo tee -a /etc/fstab
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
	if ( ! grep pam_google_authenticator.so /etc/pam.d/cockpit ) ; then
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
	echo "Enable Cockpit.1" | tee -a /tmp/init_status
	if ( ! systemctl status cockpit.socket | grep running ) ; then 
		echo "Enable Cockpit.enable" | tee -a /tmp/init_status
		sudo systemctl enable --now cockpit.socket
		echo "Enable Cockpit.stop" | tee -a /tmp/init_status		
		sudo systemctl stop firewalld
		echo "Enable Cockpit.fire" | tee -a /tmp/init_status		
		sudo firewall-cmd --add-service=cockpit --permanent 
		echo "Enable Cockpit.reload" | tee -a /tmp/init_status
		sudo firewall-cmd --reload
		echo "Enable Cockpit.start" | tee -a /tmp/init_status
		sudo systemctl start firewalld
	fi
	echo "Enable Cockpit.done" | tee -a /tmp/init_status
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
		# Disable dashboard every 6 hours
		if ( ! sudo crontab -l | grep wazuh-dashboard >/dev/null ) ; then
			(sudo crontab -l ; echo "30 0-23/4 * * * /usr/bin/systemctl stop wazuh-dashboard" ) | sudo crontab -
		fi

		curl -sO https://packages.wazuh.com/4.4/wazuh-install.sh 
		sudo bash ./wazuh-install.sh -a -i

		sudo systemctl stop wazuh-dashboard
		sudo systemctl stop wazuh-manager
		sudo systemctl stop wazuh-indexer

		echo "Setting wazuh password. Alt we could extract current password during setup."
		# remove password checks
		if [[ ! -e /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh.orig ]] ; then 
			sudo cp -n /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh  /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh.orig 
			sudo sed -e 's/if ! echo.*/if false ; then/' /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh.orig | sudo tee /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh > /dev/null
			sudo /usr/share/wazuh-indexer/plugins/opensearch-security/tools/wazuh-passwords-tool.sh --user admin --password ${PASSWD}
		fi

		# indexer not starting - timeout
		if [[ ! -e /etc/systemd/system/wazuh-indexer.service.d ]] ; then
			sudo mkdir /etc/systemd/system/wazuh-indexer.service.d
			echo -e "[Service]\nTimeoutStartSec=240" | sudo tee /etc/systemd/system/wazuh-indexer.service.d/startup-timeout.conf > /dev/null
		fi # https://www.reddit.com/r/Wazuh/comments/107vup6/wazuhindexer_and_wazuhmanager_fails_with_timeout/

		sudo cp --no-clobber /var/ossec/etc/ossec.conf /var/ossec/etc/ossec.conf.orig
	
		# Turn on vuln detection
		curl -sO https://raw.githubusercontent.com/jamieshield/coit11241/main/configWazuh.py
		sudo python configWazuh.py

		sudo firewall-cmd --add-service=https --permanent
		sudo firewall-cmd --reload
	fi
}	

rnice
echo "Enable Cockpit" | tee -a /tmp/init_status
enableCockpit
echo "Generate certs" | tee -a /tmp/init_status
curl https://localhost:9090 2>&1 >/dev/null || true
ls /etc/cockpit/ws-certs.d/ | tee -a /tmp/init_status
echo "Enable status server" | tee -a /tmp/init_status
setupStatusServer
echo "Enable swap" | tee -a /tmp/init_status
#enableSwap
echo "setupGoogleAuthenticator" | tee -a /tmp/init_status
setupGoogleAuthenticator
cat .google-authenticator | tee -a /tmp/init_status
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
