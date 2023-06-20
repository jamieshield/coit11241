#!/usr/bin/env bash
#agent=001
systemctl stop wazuh-manager.service
sqlite3 /var/ossec/queue/vulnerabilities/cve.db 'update metadata set timestamp = 0;'
for agent in 001 002 003 ; do
	sqlite3 /var/ossec/queue/db/${agent}.db 'update vuln_metadata set last_full_scan = 0;' >/dev/null 2>/dev/null
	sqlite3 /var/ossec/queue/db/${agent}.db 'update vuln_metadata set last_partial_scan = 0;' >/dev/null 2>/dev/null
done
systemctl start wazuh-manager.service
systemctl start wazuh-indexer.service
/var/ossec/bin/agent_control  -R -a

sleep 5
load=$(uptime | cut -f14 -d' ' | cut -f1 -d.)
echo -n "Load: ${load}"
for A in $(seq 1 10) ; do
	sleep 5
	load=$(uptime | cut -f14 -d' ' | cut -f1 -d.)
	echo -n ", ${load}"
done
echo
