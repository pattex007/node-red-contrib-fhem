var events = require('events');
var net = require('net');
module.exports = function (RED) {
    function FHEMInstance(config) {
        RED.nodes.createNode(this, config);
        this.eventEmitter = new events.EventEmitter();
        var t = this;
        try {
            var client = new net.Socket();

            client.connect(config.port, config.server, function () {
                t.eventEmitter.emit("connected");
                // https://fhem.de/commandref_DE.html#inform
                client.write('inform timer\n');
            });

            client.on('data', function (data) {
                //t.log('Received: ' + data);
                t.eventEmitter.emit("data_received", data);
            });

            client.on('close', function () {
                t.eventEmitter.emit("disconnected");
            });

        } catch (e) {
            //this.status({ fill: "red", shape: "dot", text: e });
        }

        this.eventEmitter.on("data_send", (data) => {
            client.write(data + "\n");
        });

        config.fhemInstance = RED.nodes.getNode(config.server);

        this.on('close', (removed, done) => {
            client.destroy(); // kill client after server's response
            handleDisconnected(this);
            done();
        });
    }
    RED.nodes.registerType('fhem-instance', FHEMInstance);
}