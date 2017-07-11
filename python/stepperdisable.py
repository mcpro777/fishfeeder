import RPi.GPIO as GPIO
import time
 
GPIO.setmode(GPIO.BCM)
 
enable_pin = 18
coil_A_1_pin = 4
coil_A_2_pin = 17
coil_B_1_pin = 23
coil_B_2_pin = 24
 
GPIO.setup(enable_pin, GPIO.OUT)
GPIO.setup(coil_A_1_pin, GPIO.OUT)
GPIO.setup(coil_A_2_pin, GPIO.OUT)
GPIO.setup(coil_B_1_pin, GPIO.OUT)
GPIO.setup(coil_B_2_pin, GPIO.OUT)
 
GPIO.output(enable_pin, 0)
GPIO.output(coil_A_1_pin, 0)
GPIO.output(coil_A_2_pin, 0)
GPIO.output(coil_B_1_pin, 0)
GPIO.output(coil_B_2_pin, 0)
 
