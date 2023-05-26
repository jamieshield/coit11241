
# Usage: curl https://raw.githubusercontent.com/jamieshield/coit11241/main/configFilebeat.py | sudo python -
# Disable filebeat alerts.
import yaml
with open("/etc/filebeat/filebeat.yml.orig") as f:
    doc=yaml.safe_load(f)

#filebeat.modules:
#  - module: wazuh
#    alerts:
#      enabled: true
for mod in doc['filebeat.modules']:
    if mod['module']=='wazuh':
        mod['alerts']['enabled']=False

with open("/etc/filebeat/filebeat.yml","w") as f:
    yaml.dump(doc,f)
