var events = require('events');
var net = require('net');
const RECONNECT_MS = 5000;
const MAX_LISTENERS = 64;

module.exports = function (RED) {

    function FHEMInstance(config) {

        var intervalConnect = false;
        RED.nodes.createNode(this, config);

        this.eventEmitter = new events.EventEmitter();
        var t = this;
        //t.log('create FHEMInstance');
        var client = new net.Socket();
        this.devicelist = {};
        //var devicelistraw = "";
        function connect() {
            t.log('connecting to ' + config.server + ":" + config.port);

            try {

                client.on('connect', function () {
                    t.log('connected');
                    t.eventEmitter.emit("connected");
                    /*
                        List aliases for all devices
                    */
                    var devicelistraw = "";
                    var clientMgm = new net.Socket();
                    clientMgm.on('connect', function () {
                        t.log('mgm.connected');
                        clientMgm.write('jsonlist2 .* alias room\n');
                    })
                    clientMgm.on('data', function (data) {
                        //t.log('Received: ' + data);
                        //t.log(data.length);
                        devicelistraw += data;
                        try {
                            JSON.parse(devicelistraw).Results.forEach(device => {
                                //t.log(JSON.stringify(device));
                                device.label = device.Attributes.room+":"+device.Attributes.alias;
                                t.devicelist[device.Name] = device;
                                
                            })
                            //t.set("devicelist",t.devicelist);
                            //t.log(JSON.stringify(devicelist));

                            // After successfully read fhem configuration, subscribe to events
                            // https://fhem.de/commandref_DE.html#inform
                            clientMgm.removeAllListeners();
                            clientMgm.destroy();
                            
                            client.write('inform timer\n');
                        } catch (e) {
                            //t.error('Error: ' + e);
                            //this.status({ fill: "red", shape: "dot", text: e });
                        }
                        //t.eventEmitter.emit("data_received", data.toString());
                    });
                    clientMgm.connect(config.port, config.server);




                    if (false == intervalConnect) return
                    clearInterval(intervalConnect)
                    intervalConnect = false

                });
                client.on('data', function (data) {
                    //t.log('Received: ' + data);
                    t.eventEmitter.emit("data_received", data.toString());
                });
                client.on('error', function (err) {
                    t.error(JSON.stringify(err))
                })
                client.on('timeout', function (err) {
                    t.error(JSON.stringify(err))
                })
                client.on('close', function () {
                    t.eventEmitter.emit("disconnected");
                });
                client.on('end', function () {
                    //t.error("end")
                    t.eventEmitter.emit("reconnect");
                });
            } catch (e) {
                t.error('Error: ' + e);
                //this.status({ fill: "red", shape: "dot", text: e });
            }
            client.connect(config.port, config.server);
        }
        function launchIntervalConnect() {
            if (false != intervalConnect) return
            intervalConnect = setInterval(connect, RECONNECT_MS)
        }

        /*
            Default Limit is 10 listeners to avoid memory leaks
            We need it higher because of the shared connection
            to the fhem instance(s) for all nodes
        */
        this.eventEmitter.setMaxListeners(MAX_LISTENERS);

        this.eventEmitter.on("data_send", (data) => {
            try {
                client.write(data + "\n");
            } catch (e) {
                t.error('Error: ' + e);
                //this.status({ fill: "red", shape: "dot", text: e });
            }
        });
        this.eventEmitter.on("reconnect", () => {
            t.log('try reconnect in ' + RECONNECT_MS + "ms");
            client.removeAllListeners(); // the important line that enables you to reopen a connection
            launchIntervalConnect();
        });
        config.fhemInstance = RED.nodes.getNode(config.server);

        this.on('close', (removed, done) => {
            t.log("closing");
            client.removeAllListeners();
            client.destroy(); // kill client after server's response
            handleDisconnected(this);
            done();
        });

        /*
            direct connect after first init
        */
        connect();
    }
    RED.nodes.registerType('fhem-instance', FHEMInstance);
    //RED.nodes.registerType('fhem-mgm-instance', FHEMMgmInstance);

    RED.httpAdmin.get("/fhem/:id/devicelist",function(req,res) {
        //this.log(req);
        //this.devicelist
        var fhem = RED.nodes.getNode(req.params.id);
        //console.log(fhem);
        //console.log(req.params.id);
        res.send( fhem.devicelist );
    })
}