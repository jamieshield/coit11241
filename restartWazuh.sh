#!/usr/bin/env bash
sudo systemctl stop wazuh-dashboard
sudo systemctl stop wazuh-manager
sudo systemctl restart wazuh-indexer
sudo systemctl start wazuh-manager
sudo systemctl start wazuh-dashboard


