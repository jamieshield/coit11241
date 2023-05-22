
#https://pypi.org/project/qrcode/
#https://pyauth.github.io/pyotp/
import pyotp
import time
ga = open('/home/opc/.google_authenticator').readline() #'JBSWY3DPEHPK3PXP'
ga=ga.strip()
qrUrl=pyotp.totp.TOTP(ga).provisioning_uri(name='opc@oracle', issuer_name='COIT11241')
import qrcode
img = qrcode.make(qrUrl)
type(img)  # qrcode.image.pil.PilImage
img.save("qr_cockpit.png")
print(ga+".")
totp = pyotp.TOTP(ga)
print("Current OTP:", totp.now())
