
# Serve the Google Authenticator QR code and Cockpit and Wazuh passwd
# on https://:4443
# curl https://raw.githubusercontent.com/jamieshield/coit11241/main/qrrender.py | sudo python -
import pyotp, time, qrcode, base64, ssl
from http.server import HTTPServer, BaseHTTPRequestHandler
from io import BytesIO
ga = open('/home/opc/.google_authenticator').readline().strip() #'JPEXP'
passwd=open('/home/opc/passwd').readline().strip() # vagrant
qrUrl=pyotp.totp.TOTP(ga).provisioning_uri(name=passwd, issuer_name='COIT11241')
img = qrcode.make(qrUrl)
buffered = BytesIO()
img.save(buffered, format="JPEG")
img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')


class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        html="<html><h1>Google Authenticator</h1><img src='data:image/jpeg;base64,"+img_str+"'></img><h1>Cockpit opc and Wazuh admin password</h1>"+passwd+"<br/>Also saved in home directory. This page is only available when cockpit is setup."
        #totp = pyotp.TOTP(ga)
        #print("Current OTP:", totp.now())
        self.wfile.write(str.encode(html))
        exit()


httpd = HTTPServer(('', 4443), SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket (httpd.socket,
        keyfile="/etc/cockpit/ws-certs.d/0-self-signed.key",
        certfile='/etc/cockpit/ws-certs.d/0-self-signed.cert', server_side=True)
httpd.serve_forever()

#References
#https://pypi.org/project/qrcode/ 
#https://pyauth.github.io/pyotp/
#https://stackoverflow.com/questions/31826335/how-to-convert-pil-image-image-object-to-base64-string
