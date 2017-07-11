# aquaponics-app
A web application for the aquaponics project.

Contains an Angular 1.5 front end, a node-js api to run on the master PI, a node-js api to run on the slave PI's, and a scheduler daemon to run on all the PIs.

Packages to install:
- node.js & npm (sudo apt-get install nodejs npm)
- may need to symlink node (because debian called it nodejs for whatever reason) (cd /usr/bin \n sudo ln -s ./nodejs ./node)
- mongodb (sudo apt-get install mongodb) (takes awhile to install on pi, expect 20-30 minutes)
- forever (sudo npm install -g forever)
- bower (sudo npm install -g bower)

In project root, run
- npm install

In /app folder, run
- bower install

To run on master PI, start (as sudo, to run on port 80) master-server.js. This is protected by authentication and is (relatively) safe to expose to the internet.
- sudo forever start master-server.js

To run on secondary PI, start (doesn't need sudo) secondary-server.js (as sudo, to run on port 80). This has no authentication and is designed to run behind a the firewall.
- sudo forever start secondary-server.js

The angular app will be served from the Master PI via port 80.

The IP addresses will be configured via the MasterPI and stored there, so that the application knows how to talk to the secondary PIs.

schedule-runner.js should run in the background on the master and all secondary pis.
- forever start schedule-runner.js

mongodb has to run on all PIs as well.
- mongod
