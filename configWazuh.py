#!/usr/bin/env python
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
vd=ossecConf.getElementsByTagName("vulnerability-detector")[0]
en=vd.getElementsByTagName("enabled")[0]
print(en.firstChild.nodeValue)
f=open("/var/ossec/etc/ossec.conf",'w')
# skip <a/>
for n in ossecConf.firstChild.childNodes:
    f.write(n.toxml())
#.writexml(f); 
f.close();
#help(en) #


