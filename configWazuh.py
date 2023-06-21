#!/usr/bin/env python3
# Configuration of Wazuh server ossec.conf
#  including default 11241/vms/wazuhOVA
# Agents' ossec.conf need configuration too - elsewhere


from xml.dom import minidom

# agent.conf needed too

f=open("/var/ossec/etc/ossec.conf",'r'); xml=f.read(); f.close();
xml="<a>"+xml+"</a>"
ossecConf=minidom.parseString(xml)
#<ossec_config>
#  <vulnerability-detector>
#    <enabled>yes</enabled>
vd=ossecConf.getElementsByTagName("vulnerability-detector")[0]
en=vd.getElementsByTagName("enabled")[0]
en.firstChild.nodeValue="yes"

# <sca>
#    <enabled>yes</enabled>
vd=ossecConf.getElementsByTagName("sca")[0]
en=vd.getElementsByTagName("enabled")[0]
en.firstChild.nodeValue="yes"

#   <provider name="nvd">
#      <enabled>yes</enabled>
#      <update_from_year>2010</update_from_year>
vdarr=ossecConf.getElementsByTagName("provider")
for vd in vdarr:
  if (vd.getAttribute('name')=='nvd'):
    en=vd.getElementsByTagName("enabled")[0]
    en.firstChild.nodeValue="yes"
    en=vd.getElementsByTagName("update_from_year")[0]
    en.firstChild.nodeValue="2019"


# FIM
# <syscheck>
#    <disabled>no</disabled>
vd=ossecConf.getElementsByTagName("syscheck")[0]
en=vd.getElementsByTagName("disabled")[0]
en.firstChild.nodeValue="no"


vd=ossecConf.getElementsByTagName("remote")[0]
en=vd.getElementsByTagName("protocol")[0]
en.firstChild.nodeValue="udp"

# Remove localfiles so no local events are forwarded to wazuh
vdarr=ossecConf.getElementsByTagName("ossec_config")
if (vdarr.length==2):
  vd=ossecConf.getElementsByTagName("ossec_config")[1]
  parent=vd.parentNode
  #parent.removeChild(vd)

f=open("/var/ossec/etc/ossec.conf",'w')
# skip <a/>
for n in ossecConf.firstChild.childNodes:
    f.write(n.toxml())
#.writexml(f); 
f.close();
#help(en) #


