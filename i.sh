#!/usr/bin/bash
# Visit http:ip to view your passwords
# curl https://raw.githubusercontent.com/jamieshield/coit11241/main/i.sh | sudo bash -s -

PASSWD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 40 ; echo '')

function rnice() {
	# osms and osms-agent
	sudo renice 20 $(ps -e | grep osms | cut -f1 -d"?")
}

function setupStatusServer() {
	if [ ! -e /mnt/2GiB.swap ] ; then
		# Arguments: PASSWD; Prereqs: google-authenticator setup
		sudo firewall-cmd --zone=public --add-port=4443/tcp
		curl https://raw.githubusercontent.com/jamieshield/coit11241/main/qrrender.py | sudo python - & 
		# already satisfied: pip install qrcode; pip install pyotp
	fi
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
	if ( !  yum list installed google-authenticator 2>/dev/null >/dev/null ) ; then # https://www.ezeelogin.com/kb/article/how-to-install-google-authenticator-on-centos-ubuntu-323.html
		sudo yum -y install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
		sudo yum -y install google-authenticator
		sudo -u opc google-authenticator -t -d -f -r 3 -R 30 -W # time, no reuse, force, 3 attempts/30s, min window
	}
}

function setupCockpitGoogleAuthenticator() {
	if ( ! grep pam_google_authenticator.so /etc/pam.d/cockpit ) ; then
		echo "auth required pam_google_authenticator.so" | sudo tee -a /etc/pam.d/cockpit  >/dev/null
		rm -f /tmp/init_status
	fi
}

function setOpcPasswd() {
	if [ ! -e /home/opc/passwd ] ; then
		echo -e "${PASSWD}" | sudo tee /home/opc/passwd >/dev/null
		# Web console access? Not for terminal login
		echo -e "${PASSWD}\n${PASSWD}" | sudo passwd opc
	fi
}

function enableCockpit() {
	if ( ! systemctl status cockpit | grep running ) ; then 
		sudo systemctl enable --now cockpit.socket	
		sudo firewall-cmd --add-service=cockpit --permanent # 9090
		sudo firewall-cmd --reload
	fi
}	

function installNavigator() {
	if ( ! dnf list installed 2>/dev/null | grep cockpit-navigator >/dev/null ) ; then
		echo "Install cockpit-navigator" #https://github.com/45Drives/cockpit-navigator
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
echo "Enable status server" > /tmp/init_status # Used in status server
setupStatusServer
echo "Enable swap" > /tmp/init_status
enableSwap
echo "Setup google authenticator" > /tmp/init_status
setupGoogleAuthenticator
echo "Setup Opc Passwd" > /tmp/init_status
setOpcPasswd
echo "Setup Cockpit google authen" > /tmp/init_status
setupCockpitGoogleAuthenticator # Also serves PASSWD
echo "Enable Cockpit" > /tmp/init_status
enableCockpit
echo "Cockpit enabled. Install navigator" > /tmp/init_status
installNavigator
echo "Cockpit enabled. Install Wazuh" > /tmp/init_status
setupWazuh
echo "Cockpit enabled. Starting Wazuh" > /tmp/init_status

sudo systemctl start wazuh-indexer
sudo systemctl start wazuh-dashboard
sudo systemctl start wazuh-manager
