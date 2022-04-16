# node-red-contrib-fhem

This package contains a receiver and a sender node which connects to FHEM instances.

# Requirements
a telnet "device" in fhem.
https://fhem.de/commandref.html#telnet

The configured port must be accessible over the network from the node-red instance.

# Example Configuration for fhem-instance
Name: MyFhem
Server: 192.168.1.10
Port: 7072

# Example Configuration for fhem-in
Name: Temps
Instance: Choose your fhem-instance

The Devivefilter and Readingsfilter are optional settings. If you leave both blank, you will get all events from fhem-instance

Example for alle temperature readings from all devices
Devicefilter: leave blank
Readingsfilter: temperatur

# Example Configuration for fhem-out
Name: MyOutDevice
FHEM-Instance: Choose your fhem-instance
Device: the fhem device-name property

The string of msg.action is send directly to the fhem device
"msg.action = set_on" sets a device in them on
"msg.action = virtTemp 10" sets the device property virtTemp to 10
