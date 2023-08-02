#!/usr/bin/bash
# curl -s https://raw.githubusercontent.com/jamieshield/coit11241/main/configWazuh.sh | sudo bash -s -
# also used by 11241/vms/wazuhOVA

sudo cp --no-clobber /var/ossec/etc/ossec.conf /var/ossec/etc/ossec.conf.orig
#echo "Turn on vuln detection" 
#curl -s https://raw.githubusercontent.com/jamieshield/coit11241/main/configWazuh.py | sudo python -
sudo cp --no-clobber /var/ossec/etc/shared/default/agent.conf /var/ossec/etc/shared/default/agent.conf.orig
sudo cp --no-clobber /var/ossec/queue/vulnerabilities/dictionaries/cpe_helper.json  /var/ossec/queue/vulnerabilities/dictionaries/cpe_helper.json.orig
sudo curl -sO https://raw.githubusercontent.com/jamieshield/coit11241/main/cpe_helper.json
sudo mv cpe_helper.json /var/ossec/queue/vulnerabilities/dictionaries/cpe_helper.json
# https://github.com/wazuh/wazuh/discussions/14731
sudo curl -sO https://raw.githubusercontent.com/branchnetconsulting/wazuh-tools/master/flush-vd-state
sudo chmod u+x flush-vd-state
sudo curl -sO https://raw.githubusercontent.com/jamieshield/coit11241/main/restartWazuh.sh
sudo chmod u+x restartWazuh.sh
sudo curl -sO https://raw.githubusercontent.com/jamieshield/coit11241/main/wazuhTroubleshoot.sh
sudo chmod u+x wazuhTroubleshoot.sh
sudo curl -sO https://raw.githubusercontent.com/jamieshield/coit11241/main/triggerScan.sh
sudo chmod u+x triggerScan.sh
sudo curl -sO https://raw.githubusercontent.com/jamieshield/coit11241/main/checkCpeHelper.sh
sudo chmod u+x checkCpeHelper.sh
