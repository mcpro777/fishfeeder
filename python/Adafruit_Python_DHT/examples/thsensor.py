#!/usr/bin/python
import sys
import Adafruit_DHT

while True:
    humidity, temperature = Adafruit_DHT.read_retry(11, 16)
    print 'Temperature of unit 1: {0:0.1f} C Humidity: {1:0.1f} %'.format(temperature, humidity)

    
