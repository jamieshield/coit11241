
# Serve the Google Authenticator QR code and Cockpit and Wazuh passwd
# on https://:4443
# curl https://raw.githubusercontent.com/jamieshield/coit11241/main/qrrender.py | sudo python -

# Assumes cockpit certificates are installed
import ssl, os, time
from http.server import HTTPServer, BaseHTTPRequestHandler
from io import BytesIO

# Progress bar
start_time = time.time()

passwordServed=False # opc
wazuh_passwordServed=False

def qrCode():
  import pyotp, qrcode, base64
  ga = open('/home/opc/.google_authenticator').readline().strip() #'JPEXP'
  passwd=open('/home/opc/passwd').readline().strip() # vagrant

  # Get base64 string of Google authenticator QR code
  qrUrl=pyotp.totp.TOTP(ga).provisioning_uri(name=passwd, issuer_name='COIT11241')
  img = qrcode.make(qrUrl)
  buffered = BytesIO()
  img.save(buffered, format="JPEG")
  qr_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
  return qr_str

def timeElapsed():
   global start_time
   time_elapsed=time.time()-start_time
   return time_elapsed

def progressBarHtml():
   html="<html><meta http-equiv='refresh' content='30'><body><h1>Status</h1>"
   # How long does it take? 
   FULL_TIME=3000
   progress=timeElapsed()/FULL_TIME*100
   progress=str(progress)
   html+='<progress value="'+progress+'" max="100">'+progress+'% </progress>'
   return html


class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global passwordServed # I think a new handler is created for each request?
        global wazuh_passwordServed 
        self.send_response(200)
        self.end_headers()

        STAGE_SHOWCLOUD=1
        STAGE_OPC=2 # serve opc password
        STAGE_WAZUH=3 # serve wazuh admin password
        STAGE_COMPLETE=4

        stage=STAGE_SHOWCLOUD
        #if (os.path.isfile('/tmp/init_status')):
        if (passwordServed):
           if (wazuh_passwordServed):
             if (os.path.isfile('/tmp/cloudinitcomplete')):
               stage=STAGE_COMPLETE
           elif (os.path.isfile('/wazuh-passwords.txt')):
               stage=STAGE_WAZUH
        elif (not(os.path.isfile('/tmp/init_status'))):
          stage=STAGE_OPC

        #html=progressBarHtml()
        #status=open('/tmp/init_status').read().replace('\n','<br/>')
        #html+=status
        if (stage==STAGE_COMPLETE):
              html="<html><h1>Installation complete</h1>"
              html+=str(timeElapsed())
              self.wfile.write(str.encode(html))
              exit()
        elif (stage==STAGE_OPC):
            passwordServed=True
            passwd=open('/home/opc/passwd').readline().strip() # vagrant
            html="<html>"
            # Is Authenticator being installed?
            if (os.path.isfile('/tmp/googleAuthenticator')):
                qr_str=qrCode() 
                html+="<h1>Google Authenticator</h1><img src='data:image/jpeg;base64,"+qr_str+"'></img>"
            html+="<h1>Cockpit opc password</h1>"+passwd+"<br/>Also saved in home directory. This page is only available when cockpit is setup."
            #totp = pyotp.TOTP(ga)
            #print("Current OTP:", totp.now())

            # hack tack on wazuh passwd
            if (os.path.isfile('/wazuh-passwords.txt')):
              wazuh_passwordServed=True
              passwd=open('/wazuh-passwords.txt').readline()
              html+="<h1>Wazuh admin password</h1>"+passwd+"<br/>Also saved in root directory. This page is only available when cockpit is setup."

        elif (stage==STAGE_WAZUH):
            wazuh_passwordServed=True
            passwd=open('/wazuh-passwords.txt').readline()
            html="<html>"
            html+="<h1>Wazuh admin password</h1>"+passwd+"<br/>Also saved in root directory. This page is only available when cockpit is setup."
        else:
              html=progressBarHtml()
              status=open('/var/log/cloud-init-output.log').read() #.replace('\n','<br/>')
              html+="<br/>"
              html+=status.splitlines()[-1]
              html+="<br/><hr/>"
              html+="<div style='height:400px; overflow: scroll;'>"
              html+=status.replace('\n','<br/>')
              html+="</div>"
              if (stage!=STAGE_SHOWCLOUD):
                 html="<html><h1>Unknown stage</h1>"

        self.wfile.write(str.encode(html))

httpd = HTTPServer(('', 4443), SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket (httpd.socket,
        keyfile="/etc/cockpit/ws-certs.d/0-self-signed.key",
        certfile='/etc/cockpit/ws-certs.d/0-self-signed.cert', server_side=True)
httpd.serve_forever()

#References
#https://pypi.org/project/qrcode/ 
#https://pyauth.github.io/pyotp/
#https://stackoverflow.com/questions/31826335/how-to-convert-pil-image-image-object-to-base64-string
