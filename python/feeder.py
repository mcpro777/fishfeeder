import RPi.GPIO as GPIO
import time
import sys

feedUnits = sys.argv[1]

print 'Feeding ', str(feedUnits), ' unit(s)...'

GPIO.setmode(GPIO.BCM)
 
coil_A_1_pin = 5
coil_A_2_pin = 6
coil_B_1_pin = 13
coil_B_2_pin = 19
 
GPIO.setup(coil_A_1_pin, GPIO.OUT)
GPIO.setup(coil_A_2_pin, GPIO.OUT)
GPIO.setup(coil_B_1_pin, GPIO.OUT)
GPIO.setup(coil_B_2_pin, GPIO.OUT)
 

def forward(delay, steps):  
  for i in range(0, steps):
    setStep(1, 0, 1, 0)
    time.sleep(delay)
    setStep(0, 1, 1, 0)
    time.sleep(delay)
    setStep(0, 1, 0, 1)
    time.sleep(delay)
    setStep(1, 0, 0, 1)
    time.sleep(delay)
 
def backwards(delay, steps):  
  for i in range(0, steps):
    setStep(1, 0, 0, 1)
    time.sleep(delay)
    setStep(0, 1, 0, 1)
    time.sleep(delay)
    setStep(0, 1, 1, 0)
    time.sleep(delay)
    setStep(1, 0, 1, 0)
    time.sleep(delay)
 
  
def setStep(w1, w2, w3, w4):
  GPIO.output(coil_A_1_pin, w1)
  GPIO.output(coil_A_2_pin, w2)
  GPIO.output(coil_B_1_pin, w3)
  GPIO.output(coil_B_2_pin, w4)

try:
  for i in range(0, int(feedUnits)):
    backwards(int(5) / 1000.0, int(256))
    forward(int(5) / 1000.0, int(128))
    backwards(int(5) / 1000.0, int(128))

  setStep(0,0,0,0)
  GPIO.cleanup()
  print 'done.'

except KeyboardInterrupt:
  setStep(0,0,0,0)
  GPIO.cleanup()
  print 'script killed, cleaning up.'
