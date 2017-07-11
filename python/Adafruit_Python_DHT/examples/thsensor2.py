#!/usr/bin/python
import sys
import Adafruit_DHT

humidity, temperature = Adafruit_DHT.read_retry(11, 16)
print 'Temp: {0:0.1f} C Humidity: {1:0.1f} %'.format(temperature, humidity)
